import React, { useState } from 'react';

import { TextField, Button } from '@mui/material';

import { Stack } from '@mui/system';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileDateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

import { ComposableMap, Geographies, Geography, Graticule, Marker } from 'react-simple-maps';

import dayjs from 'dayjs';

import { calculate } from './calculator';

import './index.css';

const geoURL = "https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json";

const App = () => {
  const inputStyle = {
    marginBottom: '20px',
    width: '100%'
  };
  
  const [coordinates, setCoordinates] = useState(null);
  const [params, setParams] = useState({
    sma: 0,
    inclination: 0,
    raan: 0,
    eccentricity: 0,
    anomaly: 0,
    periapsis: 0,
    time: dayjs(Date().toString())
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setParams({
      ...params,
      [name]: value
    });
  };

  const handleTimeChange = (event) => {
    const newTime = new Date(event.$d);
    setParams({
      ...params,
      time: dayjs(newTime.toString())
    });
  };

  const handleReset = () => {
    setCoordinates(null);
    setParams({
      sma: 0,
      inclination: 0,
      raan: 0,
      eccentricity: 0,
      anomaly: 0,
      periapsis: 0,
      time: dayjs(Date().toString())
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const newCoordinates = calculate(params);
    setCoordinates(newCoordinates);
  };

  return (
    <>
      <h1>Shastra</h1>
      <div className='app'>

        <div className='container'>
          <form onReset={handleReset} onSubmit={handleSubmit}>
            <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='Semi-Major Axis (in m)' name='sma' required value={params.sma} onChange={handleChange} /></div>
            <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='Inclination (in degrees)' name='inclination' required value={params.inclination} onChange={handleChange} /></div>
            <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='RAAN (in degrees)' name='raan' required value={params.raan} onChange={handleChange} /></div>
            <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='Eccentricity' name='eccentricity' required value={params.eccentricity} onChange={handleChange} /></div>
            {
              params.eccentricity === 0
                ? null
                : <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='Argument of Periapsis (in degrees)' name='periapsis' required value={params.periapsis} onChange={handleChange} /></div>
            }
            <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='True Anomaly (in degrees)' name='anomaly' required value={params.anomaly} onChange={handleChange} /></div>
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
                    <TableCell>{ coordinates === null ? 'NA' : coordinates.longitude }</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Latitude</TableCell>
                    <TableCell>{ coordinates === null ? 'NA' : coordinates.latitude }</TableCell>
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
                  <Marker coordinates={[coordinates.longitude, coordinates.latitude]}>
                    <circle r={7} fill='red' />
                  </Marker>
              }
            </ComposableMap>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;