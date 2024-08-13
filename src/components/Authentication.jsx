import { useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { inputErrors } from '../utils/Constants.jsx';

export default function Authentication({value, setValue, setAuthorized, setError}) {
  const hash = localStorage.getItem('auth')  ?? '';
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [animation, setAnimation] = useState(false);

  async function authentication(e) {
    e.preventDefault();

    if (value) {
      if(!buttonDisabled) {
        setTimeout(setButtonDisabled, 0, true);
        setTimeout(setAnimation, 100, true);
        
        if (value) {
          if (hash) {
            const isCorrect = await invoke('verify_password', {password: value, hash: hash});
            if (isCorrect) {
              setAuthorized(true);
            } else {
              setError([true, inputErrors.incorrectPassword]);
            }
          } else {
            localStorage.clear();
            const newHash = await invoke('hash_password', { password: value });
            localStorage.setItem('auth', newHash);
            setAuthorized(true);
          }
        }
        setAnimation(false);
        setButtonDisabled(false);
      }
    } else {
      setError([true, inputErrors.emptyField]);
    }
  }

  return (
    <form className="auth__form" onSubmit={authentication}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        aria-autocomplete="none"
        placeholder="Password"
        type="password"
      />
      <button className={`button auth__button-submit ${buttonDisabled ? 'auth__button-submit_active' : ''} ${animation ? 'button_loading auth__button-loading' : ''}`} type="submit" disabled={buttonDisabled}></button>
    </form>
  )
}