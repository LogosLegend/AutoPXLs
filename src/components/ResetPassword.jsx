import { useState } from 'react';

export default function ResetPassword({reset, setPage}) {
  return (
    <div className="auth">
      <p className="error_medium">Resetting your password will delete all profiles</p>
      <div className="auth__reset">
        <button className="button auth__button-reset" onClick={reset}>Reset</button>
        &nbsp;or&nbsp;
        <button className="auth__button-change" onClick={() => setPage('authentication')}>Back</button>
      </div>
    </div>
  )
}