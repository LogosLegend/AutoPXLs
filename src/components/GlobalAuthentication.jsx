import { useState } from 'react';
import { fetch } from '@tauri-apps/plugin-http';
import { projectId, inputErrors } from '../utils/Constants.jsx';
import { useDispatch } from 'react-redux';
import { setGlobalAuthorized } from '../store/globalAuthorizedSlice';

export default function GlobalAuthentication() {
  const dispatch = useDispatch();
  const [updatingAttempts, setUpdatingAttempts] = useState(localStorage.getItem('updatingAttempts') ?? 0);
  const [failedCount, setFailedCount] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [animation, setAnimation] = useState(false);
  const [error, setError] = useState('');

  async function authentication(e) {
    e.preventDefault();
    
    if (Date.now() < updatingAttempts) {
      setError(inputErrors.manyAttempts);
      return;
    };

    if (Date.now() > updatingAttempts && failedCount === 3) setFailedCount(0);

    if (email && password) {
      if(!buttonDisabled) {
        setButtonDisabled(true);
        setAnimation(true);

        await fetch('https://cloud.appwrite.io/v1/account/sessions/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Appwrite-Project': projectId
          },
          body: JSON.stringify({email, password})
        })
        .then(response => {
          if (!response.ok) {
            setFailedCount(prev => {
              const count = prev + 1;
              if (count === 3) { //Отключение возможности входа при 3 неудачных попытках
                const time = Date.now() + 30 * 60 * 1000; //30 минут
                localStorage.setItem('updatingAttempts', time);
                setUpdatingAttempts(time);
              }
              return count;
            });
            setError(inputErrors.incorrectData);
            return;
          }
          const cookies = response.headers.get('set-cookie');
          const cookieArray = cookies.split(';')[0];
          const [cookieName, cookieValue] = cookieArray.split('=');

          localStorage.setItem('cookieFallback', JSON.stringify({['a_session_' + projectId]: cookieValue}));
          
          dispatch(setGlobalAuthorized(true));
        })
        .catch(error => {
          setError(inputErrors.unknownAuthError);
        });

        setAnimation(false);
        setButtonDisabled(false);
      }
    } else {
      setError(inputErrors.emptyField);
    }
  }

  return (
    <div className="auth">
        <form className="auth__form" onSubmit={authentication}>
          <div className="auth__fields">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              aria-autocomplete="none"
              placeholder="Email"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
              aria-autocomplete="none"
              placeholder="Password"
              type="password"
            />
          </div>
          <button className={`button auth__button-submit ${buttonDisabled ? 'auth__button-submit_active' : ''} ${animation ? 'button_loading auth__button-loading' : ''}`} type="submit" disabled={buttonDisabled}></button>

        </form>
      <p className="error_small">{error}</p>
    </div>
  )
}