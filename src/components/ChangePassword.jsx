import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { inputErrors } from '../utils/Constants';
import { encrypt, decrypt } from '../utils/Functions';
import { useDispatch, useSelector } from 'react-redux';
import { setProfiles } from '../store/profilesSlice';
import { setAuthorized } from '../store/authorizedSlice';
import { setPage } from '../store/pageSlice';

export default function ChangePassword() {
  const dispatch = useDispatch();
  const profilesData = useSelector((state) => state.profilesData.profiles);
  
  const hash = localStorage.getItem('auth') ?? '';
  const [value, setValue] = useState({currentPassword: '', newPassword: ''});
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [error, setError] = useState('');

  function changeValue(value, property) {
    setValue(prev => {
      const newValue = {...prev};
      newValue[property] = value;
      return newValue;
    });
  }

  async function submit(e) {
    e.preventDefault();

    if (!buttonDisabled) {
      setButtonDisabled(true);

      if (hash) {
        if (value.currentPassword && value.newPassword) { //Проверка на пустоту
          const isCorrect = await invoke('verify_password', {password: value.currentPassword, hash: hash});

          if (isCorrect) { //Проверка пароля
            const newHash = await invoke('hash_password', {password: value.newPassword});

            const decryptedProfiles = profilesData.map(profile => ({
              ...profile,
              privateKey: decrypt(profile.privateKey, profile.salt, profile.iv, value.currentPassword)
            }));

            const encryptedProfiles = decryptedProfiles.map(profile => {
              const [salt, iv, privateKey] = encrypt(profile.privateKey, value.newPassword);
              return {
                ...profile,
                salt,
                iv,
                privateKey
              };
            });
            
            localStorage.setItem('auth', newHash);
            dispatch(setProfiles(encryptedProfiles));
            dispatch(setAuthorized(false));
            dispatch(setPage('authentication'));
          } else {
            setError(inputErrors.incorrectPassword);
          }
        } else {
          setError(inputErrors.emptyField);
        }
      } else {
        setError(inputErrors.internalError);
      }
      setButtonDisabled(false);
    }
  }

  return (
    <form className="form form__change" onSubmit={submit}>
      <p className="error_small">{error}</p>
      <input
        className="form__password"
        value={value.currentPassword}
        onChange={(e) => changeValue(e.target.value, 'currentPassword')}
        autoComplete="off"
        aria-autocomplete="none"
        placeholder="Current password"
        type="password"
      />
      <input
        className="form__password"
        value={value.newPassword}
        onChange={(e) => changeValue(e.target.value, 'newPassword')}
        autoComplete="off"
        aria-autocomplete="none"
        placeholder="New password"
        type="password"
      />
      <button className={`button button_middle ${buttonDisabled ? 'button_loading button_middle_loading' : ''}`}
              type="submit" disabled={buttonDisabled}>
        {!buttonDisabled && 'Change'}
      </button>
    </form>
  )
}