import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPage } from '../store/pageSlice';

export default function ResetPassword() {
  const dispatch = useDispatch();

  function setPageAuth() {
    dispatch(setPage('authentication'))
  }

  function reset() {
    localStorage.removeItem('auth');
    localStorage.removeItem('profilesData');
    dispatch(setPage('authentication'));
  }

  return (
    <div className="auth">
      <p className="error_medium">Resetting your password will delete all profiles</p>
      <div className="auth__reset">
        <button className="button auth__button-reset" onClick={reset}>Reset</button>
        &nbsp;or&nbsp;
        <button className="auth__button-change" onClick={setPageAuth}>Back</button>
      </div>
    </div>
  )
}