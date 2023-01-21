import React, { useState, useEffect } from 'react';

import { Stack } from '@mui/system';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileDateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { TextField, Button, FormControlLabel, Checkbox } from '@mui/material';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { ComposableMap, Geographies, Geography, Graticule, Marker } from 'react-simple-maps';

import dayjs from 'dayjs';

import { calculate, calculateMultiple } from './calculator';

import './index.css';

const geoURL = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

const App = () => {
  const inputStyle = {
    marginBottom: '20px',
    width: '100%'
  };
  
  useEffect(() => {
    document.querySelectorAll('svg')[1].setAttribute('viewBox', '0 100 800 400');
  }, []);

  const [coordinates, setCoordinates] = useState(null);
  const [acceptQuaternions, setAcceptQuaternions] = useState(false);
  const [params, setParams] = useState({
    sma: '',
    inclination: '',
    raan: '',
    eccentricity: 0,
    trueAnomaly: '',
    meanAnomaly: '',
    periapsis: '',
    altitude: '',
    time: dayjs(Date().toString())
  });
  const [quaternions, setQuaternions] = useState({
    w: '',
    x: '',
    y: '',
    z: ''
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === 'sma'){
      const e = params.eccentricity;
      const taRad = Math.PI * parseFloat(params.trueAnomaly) / 180;
      const eaRad = 2 * Math.atan2(Math.sqrt(1-e)*Math.sin(taRad/2), Math.sqrt(1+e)*Math.cos(taRad/2));
      const r = parseFloat(value) * (1 - e*Math.cos(eaRad));
      const newAltitude = r - 6378137.0;
      setParams({
        ...params,
        altitude: newAltitude,
        sma: value
      });
    } else if (name === 'altitude'){
      const e = params.eccentricity;
      const taRad = Math.PI * parseFloat(params.trueAnomaly) / 180;
      const eaRad = 2 * Math.atan2(Math.sqrt(1-e)*Math.sin(taRad/2), Math.sqrt(1+e)*Math.cos(taRad/2));
      const newSma = (6378137.0 + parseFloat(value)) / (1 - e*Math.cos(eaRad));
      setParams({
        ...params,
        sma: newSma,
        altitude: value
      });
      console.log(eaRad*180/Math.PI);
    } else if (name === 'trueAnomaly'){
      const e = params.eccentricity;
      const taRad = Math.PI * parseFloat(value) / 180;
      const maRad = taRad - (2*e*Math.sin(taRad)) + (0.75*e*e+0.125*e*e*e*e)*Math.sin(2*taRad) - (1/3 * e*e*e)*Math.sin(3*taRad) + (5/32 * e*e*e*e)*Math.sin(4*taRad);
      setParams({
        ...params,
        trueAnomaly: value,
        meanAnomaly: (maRad*180/Math.PI)
      });
    } else if (name === 'meanAnomaly'){
      const e = params.eccentricity;
      const maRad = Math.PI * parseFloat(value) / 180;
      const taRad = (maRad + (2*e-0.25*e*e*e)*Math.sin(maRad) + 1.25*e*e*Math.sin(2*maRad) + (13/12)*e*e*e*Math.sin(3*maRad));
      const newTrueAnomaly = taRad * 180 / Math.PI;
      setParams({
        ...params,
        meanAnomaly: value,
        trueAnomaly: newTrueAnomaly
      });
    } else {
      setParams({
        ...params,
        [name]: value
      });
    }
  };

  const handleTimeChange = (event) => {
    const newTime = new Date(event.$d);
    setParams({
      ...params,
      time: dayjs(newTime.toString())
    });
  };

  const handleQuaternionChange = (event) => {
    const { name, value } = event.target;
    setQuaternions({
      ...quaternions,
      [name]: value
    });
  };

  const handleReset = () => {
    setCoordinates(null);
    setAcceptQuaternions(false);
    setQuaternions({
      w: '',
      x: '',
      y: '',
      z: ''
    });
    setParams({
      sma: '',
      inclination: '',
      raan: '',
      eccentricity: 0,
      trueAnomaly: '',
      meanAnomaly: '',
      periapsis: '',
      altitude: '',
      time: dayjs(Date().toString())
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const newCoordinates = calculate(params, acceptQuaternions, quaternions);
    setCoordinates(newCoordinates);
  };

  return (
    <>
      <h1>Shastra</h1>
      <div className='app'>

        <div className='container'>
          <form onReset={handleReset} onSubmit={handleSubmit}>
            <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='Inclination (in degrees)' name='inclination' required value={params.inclination} onChange={handleChange} /></div>
            <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='RAAN (in degrees)' name='raan' required value={params.raan} onChange={handleChange} /></div>
            <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='Eccentricity' name='eccentricity' required value={params.eccentricity} onChange={handleChange} /></div>
            {
              params.eccentricity === 0
                ? null
                : <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='Argument of Periapsis (in degrees)' name='periapsis' required value={params.periapsis} onChange={handleChange} /></div>
            }
            <div className='form__field'>
              <div className='quat'>
                <TextField style={{ marginRight: '7px', width: '100%', marginBottom: '20px' }} type='number' variant='outlined' label='True Anomaly (in degrees)' name='trueAnomaly' required value={params.trueAnomaly} onChange={handleChange} />
                <TextField style={{ marginLeft: '7px', width: '100%', marginBottom: '20px' }} type='number' variant='outlined' label='Mean Anomaly (in degrees)' name='meanAnomaly' required value={params.meanAnomaly} onChange={handleChange} />
              </div>
            </div>
            <div className='form__field'>
              <div className='quat'>
                <TextField style={{ marginRight: '7px', width: '100%', marginBottom: '20px' }} type='number' variant='outlined' label='Semi-Major Axis (in m)' name='sma' required value={params.sma} onChange={handleChange} />
                <TextField style={{ marginLeft: '7px', width: '100%', marginBottom: '20px' }}  type='number' variant='outlined' label='Altitude (in m)' name='altitude' required value={params.altitude} onChange={handleChange} />
              </div>
            </div>
            <div className='form__field'>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Stack spacing={3}>
                  <MobileDateTimePicker
                    value={params.time}
                    onChange={handleTimeChange}
                    label='UTC'
                    onError={console.log}
                    inputFormat="YYYY/MM/DD hh:mm a"
                    mask="____/__/__ __:__ _M"
                    renderInput={(p) => <TextField required { ...p } />}
                  />
                </Stack>
              </LocalizationProvider>
            </div>
            
            <FormControlLabel style={{ paddingTop: '10px', paddingBottom: '10px' }} control={<Checkbox value={acceptQuaternions} onClick={() => { setAcceptQuaternions(!acceptQuaternions); }} />} label="Input Camera Orientation" />
            
            {
              acceptQuaternions === false ? null :
              <div style={{ marginBottom: '20px' }}>
                <div className='quat'>
                  <TextField required={acceptQuaternions} style={{ width: '100%', marginBottom: '20px', marginRight: '7px' }} type='number' variant='outlined' label='W Quaternion' name='w' value={quaternions.w} onChange={handleQuaternionChange} />
                  <TextField required={acceptQuaternions} style={{ width: '100%', marginBottom: '20px', marginLeft: '7px' }} type='number' variant='outlined' label='X Quaternion' name='x' value={quaternions.x} onChange={handleQuaternionChange} />
                </div>
                <div className='quat'>
                  <TextField required={acceptQuaternions} style={{ width: '100%', marginRight: '7px' }} type='number' variant='outlined' label='Y Quaternion' name='y' value={quaternions.y} onChange={handleQuaternionChange} />
                  <TextField required={acceptQuaternions} style={{ width: '100%', marginLeft: '7px' }} type='number' variant='outlined' label='Z Quaternion' name='z' value={quaternions.z} onChange={handleQuaternionChange} />
                </div>
              </div>
            }

            <div className='btn__container'>
              <Button variant='outlined' type='reset'>Reset</Button>
              <Button variant='contained' type='submit'>Submit</Button>
            </div>

          </form>
        </div>

        <div className='container'>
          <div className='table'>
            <TableContainer componenet={Paper}>
              <Table aria-label='simple table'>
                <TableHead>
                  <TableRow>
                    <TableCell style={{ backgroundColor: 'rgba(0,0,0,0.1)', fontWeight: 'bold' }}>Location in GCS</TableCell>
                    <TableCell style={{ backgroundColor: 'rgba(0,0,0,0.1)', fontWeight: 'bold' }}>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Longitude</TableCell>
                    <TableCell>{ coordinates === null ? 'NA' : coordinates.satellite.longitude }</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Latitude</TableCell>
                    <TableCell>{ coordinates === null ? 'NA' : coordinates.satellite.latitude }</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Height</TableCell>
                    <TableCell>{ coordinates === null ? 'NA' : coordinates.satellite.height }</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          <div className='map'>
            <ComposableMap projectionConfig={{ scale: 140 }}>
              <Graticule stroke="rgba(0,0,0,0.1)" />
              <Geographies geography={geoURL}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography key={geo.rsmKey} geography={geo} fill='rgba(0,0,0,0.6)' />
                ))
              }
              </Geographies>
              {
                (coordinates===null) ? null :
                  <>
                    <Marker coordinates={[coordinates.satellite.longitude, coordinates.satellite.latitude]}>
                      <circle r={7} fill='blue' />
                    </Marker>
                    <Marker coordinates={[coordinates.image.longitude, coordinates.image.latitude]}>
                      <circle r={7} fill='red' />
                    </Marker>
                  </>
              }
            </ComposableMap>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;