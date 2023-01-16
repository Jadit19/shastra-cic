import React, { useState } from 'react';
import dayjs from 'dayjs';
import { TextField, Button } from '@mui/material';
import { MobileDateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Stack } from '@mui/system';

import { calculate } from './calculator';

const App = () => {
  const [params, setParams] = useState({
    sma: 0,
    inclination: 0,
    raan: 0,
    eccentricity: 0,
    anomaly: 0,
    periapsis: 0,
    time: dayjs(Date().toString())
  });
  const [ecefVector, setEcefVector] = useState(null);

  const inputStyle = {
    marginBottom: '20px',
    width: '100%'
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setParams({
      ...params,
      [name]: value
    });
  };

  const handleReset = () => {
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
    const answer = calculate(params);
    setEcefVector(answer);
  };

  return (
    <div className='app'>
      <h1>Shastra</h1>
      <form onSubmit={handleSubmit} onReset={handleReset}>
        <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='Semi-Major Axis (in m)' name='sma' required value={params.sma} onChange={handleChange} /></div>
        <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='Inclination (in degrees)' name='inclination' required value={params.inclination} onChange={handleChange} /></div>
        <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='RAAN (in degrees)' name='raan' required value={params.raan} onChange={handleChange} /></div>
        <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='Eccentricity' name='eccentricity' required value={params.eccentricity} onChange={handleChange} /></div>
        {
          params.eccentricity === 0
            ? <div></div>
            : <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='Argument of Periapsis' name='periapsis' required value={params.periapsis} onChange={handleChange} /></div>
        }
        <div className='form__field'><TextField style={inputStyle} type='number' variant='outlined' label='True Anomaly (in degrees)' name='anomaly' required value={params.anomaly} onChange={handleChange} /></div>
        <div className='form__field'>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={3}>
              <MobileDateTimePicker
                value={params.time}
                onChange={handleChange}
                label='UTC'
                onError={console.log}
                minDate={dayjs('2018-01-01T00:00')}
                inputFormat="YYYY/MM/DD hh:mm a"
                mask="____/__/__ __:__ _M"
                renderInput={(p) => <TextField { ...p } />}
              />
            </Stack>
          </LocalizationProvider>
        </div>
        <div className='btn__container'>
          <Button variant='outlined' type='reset'>Reset</Button>
          <Button variant='contained' type='submit'>Submit</Button>
        </div>
      </form>

        <br />

      <div className='answer'>The ECEF Vector is:&nbsp;
        {
          ecefVector === null
            ? <span>not defined yet. Waiting for Submit.</span>
            : <span>{ ecefVector[0] }, { ecefVector[1] }, { ecefVector[2] }</span>
        }
      </div>
    </div>
  );
};

export default App;