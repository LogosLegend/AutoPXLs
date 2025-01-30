import { useState } from 'react';
import { Authentication } from './index.jsx';

export default function ProfilesAuthentication({setAuthorized}) {
  const [error, setError] = useState('');

  return (
    <div className="auth auth__profile">
      <Authentication setAuthorized={setAuthorized} setError={setError} />
      <p className="error_small">{error}</p>
    </div>
  );
}