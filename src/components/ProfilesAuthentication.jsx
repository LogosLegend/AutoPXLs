import { useState } from 'react';
import { Authentication } from './index.jsx';

export default function ProfilesAuthentication({setAuthorized}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState([false, '']);

  return (
    <div className="auth auth__profile">
      <Authentication value={value} setValue={setValue} setAuthorized={setAuthorized} setError={setError} />
      <p className="error_small">{error[0] && error[1]}</p>
    </div>
  );
}