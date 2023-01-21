import { getLST } from "local-sidereal-time";

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
  const omega = parseFloat(params.periapsis) * Math.PI / 180;
  const e = parseFloat(params.eccentricity);

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

const calcRPY = (quat) => {
  const { w, x, y, z } = quat;
  
  const srcp = 2 * (w*x + y*z);
  const crcp = 1 - 2 * (x*x + y*y);
  const roll = Math.atan2(srcp, crcp);

  const sp = Math.sqrt(1 + 2*(w*y-x*z));
  const cp = Math.sqrt(1 - 2*(w*y-x*z));
  const pitch = 2 * Math.atan2(sp, cp) - Math.PI/2;

  const sycp = 2 * (w*z + x*y);
  const cycp = 1 - 2 * (y*y + z*z);
  const yaw = Math.atan2(sycp, cycp);

  return { roll, pitch, yaw };
};

export const calculate = (params, acceptQuaternions, quat) => {
  const { a, e, i, nu, omega, OMEGA } = unpackParams(params);
  const eciVector = calculateECI({ a, e, i, nu, omega, OMEGA });
  const lst = calcLST(params);
  const theta = 2 * lst / 23.9344696 * Math.PI;
  const ecefVector = calculateECEF(eciVector, theta);
  const { lon, lat, h } = calculateLLH(ecefVector);

  if (acceptQuaternions === false){
    return {
      "longitude": Math.round(lon*1000)/1000,
      "latitude": Math.round(lat*1000)/1000,
      "height": h
    };
  };

  const { roll, pitch, yaw } = calcRPY(quat);
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

  for (let i=0; i<iterations; i++){
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
    currentUnixTime += timeJump * 1000;
  };

  return llh;
};