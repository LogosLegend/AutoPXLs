import { useState } from 'react';
import { Authentication } from './index.jsx';

export default function MainAuthentication({value, setValue, setAuthorized, setPage}) {
  const localStorageHash = localStorage.getItem('auth');
  const [error, setError] = useState([false, '']);

  return (
    <div className="auth">
      <p className="auth__title">
        {localStorageHash
         ? <>Enter password or <button className="auth__button-change" onClick={() => setPage('resetPassword')}>reset</button></>
         : 'Enter a new password'
        }
      </p>
      <Authentication value={value} setValue={setValue} setAuthorized={setAuthorized} setError={setError} />
      <p className="error_small">{error[0] && error[1]}</p>
    </div>
  )
}