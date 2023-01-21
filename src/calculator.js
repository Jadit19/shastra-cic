import { getLST } from "local-sidereal-time";
import { dot, cross, multiply } from "mathjs";

const cos = (theta) => {
  return Math.cos(theta);
};

const sin = (theta) => {
  return Math.sin(theta);
};

const unpackParams = (params) => {
  const a = parseFloat(params.sma);
  const nu = parseFloat(params.trueAnomaly) * Math.PI / 180;
  const i = parseFloat(params.inclination) * Math.PI / 180;
  const OMEGA = parseFloat(params.raan) * Math.PI / 180;
  const e = parseFloat(params.eccentricity);

  let omega = 0;
  if (e > 0){
    omega = parseFloat(params.periapsis) * Math.PI / 180;
  };

  return { a, e, i, nu, omega, OMEGA };
};

const calcEOmega = (nu, e) => {
  const y = Math.sqrt(1-e) * sin(nu/2);
  const x = Math.sqrt(1+e) * cos(nu/2);
  const EOmega = 2 * Math.atan2(y, x);
  
  return EOmega;
};

const calcOrbitalPosition = (R, nu) => {
  const x = R * Math.cos(nu);
  const y = R * Math.sin(nu);
  const z = 0;

  return [x, y, z];
};

const calculateECI = ({ a, e, i, nu, omega, OMEGA }) => {
  const EOmega = calcEOmega(nu, e);
  const R = a * (1-e*cos(EOmega));
  const orbitalPosition = calcOrbitalPosition(R, nu);

  const eciX = orbitalPosition[0]*(cos(omega) * cos(OMEGA) - sin(omega) * cos(i) * sin(OMEGA)) - orbitalPosition[1]*(sin(omega) * cos(OMEGA) + cos(omega) * cos(i) * sin(OMEGA));
  const eciY = orbitalPosition[0]*(cos(omega) * sin(OMEGA) + sin(omega) * cos(i) * cos(OMEGA)) + orbitalPosition[1]*(cos(omega) * cos(i) * cos(OMEGA) - sin(omega) * sin(OMEGA));
  const eciZ = orbitalPosition[0] * sin(omega) * sin(i) + orbitalPosition[1] * cos(omega) * sin(i);

  return [eciX, eciY, eciZ];
};

const calculateECIVel = ({ a, e, i, nu, omega, OMEGA }) => {
  const EOmega = calcEOmega(nu, e);
  const R = a * (1-e*cos(EOmega));

  const G = 6.6743e-11;
  const Me = 5.972e24;
  const coeff = G*Me*a/R;

  const xVel = -coeff * sin(EOmega);
  const yVel = coeff * (Math.sqrt(1-e*e)*cos(EOmega));
  const zVel = 0;

  const eciX = xVel*(cos(omega) * cos(OMEGA) - sin(omega) * cos(i) * sin(OMEGA)) - yVel*(sin(omega) * cos(OMEGA) + cos(omega) * cos(i) * sin(OMEGA));
  const eciY = xVel*(cos(omega) * sin(OMEGA) + sin(omega) * cos(i) * cos(OMEGA)) + yVel*(cos(omega) * cos(i) * cos(OMEGA) - sin(omega) * sin(OMEGA));
  const eciZ = xVel * sin(omega) * sin(i) + yVel * cos(omega) * sin(i);

  return [eciX, eciY, eciZ];
};

const calcLST = (params) => {
  const unixTime = params.time.unix();
  const date = new Date(unixTime);
  const lst = getLST(date, 0);
  return lst;
};

const calculateECEF = (vector, theta) => {
  const x = vector[0]*cos(-theta) - vector[1]*sin(-theta);
  const y = vector[0]*sin(-theta) + vector[1]*cos(-theta);
  const z = vector[2];

  return [x, y, z];
};

const calculateLLH = (ecefVector) => {
  const x = ecefVector[0];
  const y = ecefVector[1];
  const z = ecefVector[2];

  const a = 6378137.0
  const f = 1.0 / 298.257223563
  // const f = 0;
  const b = a - f*a;
  const e = Math.sqrt(Math.pow(a,2) - Math.pow(b,2)) / a;
  const clambda = Math.atan2(y, x);
  const p = Math.sqrt(x*x+y*y);
  let hOld = 0.0;

  let theta = Math.atan2(z, p*(1.0-e*e));
  let cs = cos(theta);
  let sn = sin(theta);
  let N = (a*a)/(Math.sqrt(a*a*cs*cs + b*b*sn*sn));
  let h = p/cs - N;

  while (Math.abs(h-hOld) > 1e-6){
    hOld = h;
    theta = Math.atan2(z, p*(1-e*e*N/(N+h)));
    cs = cos(theta);
    sn = sin(theta);
    N = a*a / (Math.sqrt(a*a*cs*cs + b*b*sn*sn));
    h = p/cs - N;
  };

  return {
    "lon": (clambda * 180 / Math.PI),
    "lat": (theta * 180 / Math.PI),
    "h": h
  };
};

export const calculate = (params, acceptQuaternions, quat) => {
  const { a, e, i, nu, omega, OMEGA } = unpackParams(params);
  console.log()
  const eciVector = calculateECI({ a, e, i, nu, omega, OMEGA });
  const lst = calcLST(params);
  const theta = 2 * lst / 23.9344696 * Math.PI;
  const ecefVector = calculateECEF(eciVector, theta);
  const { lon, lat, h } = calculateLLH(ecefVector);

  if (acceptQuaternions === false){
    return {
      "satellite": {
        "longitude": Math.round(lon*1000)/1000,
        "latitude": Math.round(lat*1000)/1000,
        "height": Math.round(h*1000)/1000
      },
      "image": {
        "longitude": NaN,
        "latitude": NaN,
      }
    };
  };

  const eciCoeff = Math.sqrt(eciVector[0]*eciVector[0] + eciVector[1]*eciVector[1] + eciVector[2]*eciVector[2]);
  const Z = [-eciVector[0]/eciCoeff, -eciVector[1]/eciCoeff, -eciVector[2]/eciCoeff];
  let Y = [sin(OMEGA)*sin(i), -cos(OMEGA)*sin(i), cos(i)];

  console.log(Z);
  console.log(Y);

  let X = cross(Y, Z);
  const eciVel = calculateECIVel({ a, e, i, nu, omega, OMEGA });
  const sign = dot(X, eciVel);

  console.log(X);

  if (sign < 0){
    X = [-X[0], -X[1], -X[2]];
    Y = [-Y[0], -Y[1], -Y[2]];
  };

  const xRed = [1, 0, 0];
  const yRed = [0, 1, 0];
  const zRed = [0, 0, 1];

  const rotMat = [
    [dot(X,xRed), dot(Y,xRed), dot(Z,xRed)],
    [dot(X,yRed), dot(Y,yRed), dot(Z,yRed)],
    [dot(X,zRed), dot(Y,zRed), dot(Z,zRed)]
  ];

  const { w, x, y, z } = quat;
  const rotVecMat = [
    [1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+w*y)],
    [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-w*z)],
    [2*(x*z-w*y), 2*(y*z+w*x), 1-2*(x*x+y*y)]
  ];
  const rotVec = multiply(rotVecMat, [0,0,1]);

  console.log(rotVec);

  const camVecECI = multiply(rotMat, rotVec);

  const x1 = eciVector[0] + 1;
  const y1 = (eciVector[1] + (camVecECI[1]/camVecECI[0]));
  const z1 = (eciVector[2] + (camVecECI[2]/camVecECI[0]));

  const Re = 6378137.0;
  const A = (eciVector[0]*eciVector[0]) + (eciVector[1]*eciVector[1]) + (eciVector[2]*eciVector[2]) - Re*Re;
  const C = Math.pow((eciVector[0]-x1),2) + Math.pow((eciVector[1]-y1),2) + Math.pow((eciVector[2]-z1),2);
  const B = (x1*x1) + (y1*y1) + (z1*z1) - A - C - Re*Re;

  const D = B*B - 4*A*C;
  if (D <= 0){
    return {
      "satellite": {
        "longitude": Math.round(lon*1000)/1000,
        "latitude": Math.round(lat*1000)/1000,
        "height": Math.round(h*1000)/1000
      },
      "image": {
        "longitude": NaN,
        "latitude": NaN,
      }
    };
  };

  const t1 = (-B - Math.sqrt(D)) / (2*C);
  const t2 = (-B + Math.sqrt(D)) / (2*C);
  console.log({ t1, t2 });
  const t = Math.min(Math.abs(t1), Math.abs(t2));

  const xImage = eciVector[0]*(1-t) + t*x1;
  const yImage = eciVector[1]*(1-t) + t*y1;
  const zImage = eciVector[2]*(1-t) + t*z1;

  const imageECEFVector = calculateECEF([xImage, yImage, zImage], theta);
  const imageLLH = calculateLLH(imageECEFVector);

  return {
    "satellite": {
      "longitude": Math.round(lon*1000)/1000,
      "latitude": Math.round(lat*1000)/1000,
      "height": Math.round(h*1000)/1000
    },
    "image": {
      "longitude": Math.round(imageLLH.lon * 1000) / 1000,
      "latitude": Math.round(imageLLH.lat * 1000) / 1000
    }
  };
};

export const calculateMultiple = (params) => {
  const llh = [];
  let { a, e, i, nu, omega, OMEGA } = unpackParams(params);
  let currentUnixTime = params.time.unix();

  const G = 6.6743e-11;
  const Me = 5.972e24;
  const timeJump = 3 * 60;
  const timePeriod = (2*Math.PI) * (Math.pow(Math.sqrt(a), 3)) / (Math.sqrt(G*Me));
  const iterations = Math.floor(2 * timePeriod / timeJump);

  for (let j=1; j<80; j++){
    const eciVector = calculateECI({ a, e, i, nu, omega, OMEGA });
    const newDate = new Date(currentUnixTime);
    const lst = getLST(newDate, 0);
    const theta = 2 * lst / 23.9344696 * Math.PI;
    const ecefVector = calculateECEF(eciVector, theta);
    const { lon, lat, h } = calculateLLH(ecefVector);
    llh.push({
      "longitude": lon,
      "latitude": lat,
      "height": h
    })
    nu += 10 * Math.PI / 180;
  };

  return llh;
};