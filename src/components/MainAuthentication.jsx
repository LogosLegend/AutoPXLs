import { useState } from 'react';
import { Authentication } from './index.jsx';
import { useDispatch } from 'react-redux';
import { setAuthorized } from '../store/authorizedSlice';
import { setPage } from '../store/pageSlice';

export default function MainAuthentication() {
  const dispatch = useDispatch();
  const localStorageHash = localStorage.getItem('auth');
  const [error, setError] = useState('');

  function setAuth(value) {
    dispatch(setAuthorized(value));
  }

  function setPageReset() {
    dispatch(setPage('resetPassword'));
  }

  return (
    <div className="auth">
      <p className="auth__title">
        {localStorageHash
         ? <>Enter password or <button className="auth__button-change" onClick={setPageReset}>reset</button></>
         : 'Enter a new password'
        }
      </p>
      <Authentication setAuthorized={setAuth} setError={setError} />
      <p className="error_small">{error}</p>
    </div>
  )
}