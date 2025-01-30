import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { inputErrors } from '../utils/Constants.jsx';
import { useDispatch } from 'react-redux';
import { setPassword } from '../store/passwordSlice';

export default function Authentication({setAuthorized, setError}) {
  const dispatch = useDispatch();
  const hash = localStorage.getItem('auth')  ?? '';
  const [value, setValue] = useState('');
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [animation, setAnimation] = useState(false);

  async function authentication(e) {
    e.preventDefault();

    if (value) {
      if(!buttonDisabled) {
        setButtonDisabled(true);
        setAnimation(true);
        
        if (hash) {
          const isCorrect = await invoke('verify_password', {password: value, hash: hash});
          if (isCorrect) {
            setAuthorized(true);
            dispatch(setPassword(value));
          } else {
            setError(inputErrors.incorrectPassword);
          }
        } else {
          localStorage.removeItem('auth');
          localStorage.removeItem('profilesData');
          const newHash = await invoke('hash_password', { password: value });
          localStorage.setItem('auth', newHash);
          setAuthorized(true);
          dispatch(setPassword(value));
        }

        setAnimation(false);
        setButtonDisabled(false);
      }
    } else {
      setError(inputErrors.emptyField);
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