import { getLST } from "local-sidereal-time";

const cos = (theta) => {
  return Math.cos(theta);
};

const sin = (theta) => {
  return Math.sin(theta);
};

const unpackParams = (params) => {
  const a = parseFloat(params.sma);
  const nu = parseFloat(params.anomaly) * Math.PI / 180;
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

const calculateECI = (params) => {
  const { a, e, i, nu, omega, OMEGA } = unpackParams(params);
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

export const calculate = (params) => {
  const eciVector = calculateECI(params);
  const lst = calcLST(params);
  const theta = 2 * lst / 23.9344696 * Math.PI;
  const ecefVector = calculateECEF(eciVector, theta);

  return ecefVector;
};