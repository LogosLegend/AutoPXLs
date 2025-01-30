import { useState, useCallback } from "react";
import { ProfilesMenu, ProfilesFormItem } from './index';
import { profilesErrors } from '../utils/Constants';
import { encrypt } from '../utils/Functions';
import { useDispatch } from 'react-redux';
import { saveProfiles } from '../store/profilesSlice';

export default function ProfilesForm({profilesData, setLoading, changePage, password}) {
  const dispatch = useDispatch();
  const [profiles, setProfiles] = useState(profilesData);
  const [buttonSubmitDisabled, setButtonSubmitDisabled] = useState(false);
  const [error, setError] = useState({class: '', message: ''});

  const addProfile = useCallback(() => {
    setProfiles(prev => [...prev, {name: '', privateKey: '', proxy: '', disabled: false}])
  }, []);

  const removeProfile = useCallback((index) => {
    setProfiles(prev => {
      const newProfiles = [...prev];
      newProfiles.splice(index, 1);
      return newProfiles;
    });
  }, []);

  const changeName = useCallback((index, value) => {
    setProfiles(prev => {
      const newProfiles = [...prev];
      newProfiles[index].name = value;
      return newProfiles;
    });
  }, []);

  const changePrivateKey = useCallback((index, value) => {
    setProfiles(prev => {
      const newProfiles = [...prev];
      newProfiles[index] = {name: newProfiles[index].name, privateKey: value, proxy: newProfiles[index].proxy, disabled: false};
      return newProfiles;
    });
  }, []);

  const changeProxy = useCallback((index, value) => {
    setProfiles(prev => {
      const newProfiles = [...prev];
      newProfiles[index].proxy = value;
      return newProfiles;
    });
  }, []);

  function findDuplicates(arr) {
    const indexes = {};

    for (let i = 0; i < arr.length; i++) { //Создание массивов для каждого значения. Дубликаты попадают в один массив
      const profile = arr[i];
      if (!indexes[profile]) indexes[profile] = [];
      indexes[profile].push(i);
    }
    //Преобразование объекта в массив дубликатов
    return Object.values(indexes)
           .filter(arr => arr.length > 1) //Фильтрация массивов с уникальными значениями
           .flatMap(arr => arr.slice(1)); //Удаление уникального значения из массивов с дубликатами и преобразование всех дубликатов в единый массив
  }

  async function submit(e) {
    e.preventDefault();

    if (!buttonSubmitDisabled) {
      setButtonSubmitDisabled(true);

      const newProfiles = [...profiles];

      const isEmptyInputs = newProfiles.reduce((acc, item, index) => { //Найти профили без ключей
        if (item.privateKey === '') acc.push(index);
        return acc;
      }, []);

      if (isEmptyInputs.length) { //Выбросить ошибку и пометить профили без ключей
        for (const index of isEmptyInputs) {
          newProfiles[index].error = profilesErrors.emptyError.class;
          setProfiles(newProfiles);
          setError(profilesErrors.emptyError);
        }
      } else {
        const privateKeys = newProfiles.map(obj => obj.privateKey.toLowerCase());
        const duplicates = findDuplicates(privateKeys); //Найти дубликаты ключей

        if (duplicates.length) { //Выбросить ошибку и пометить дубликаты ключей
          for (const index of duplicates) {
            newProfiles[index].error = profilesErrors.duplicatedError.class;
            setProfiles(newProfiles);
            setError(profilesErrors.duplicatedError);
          }
        } else {
          changePage('dashboard');
          setLoading(newProfiles.length);
          await dispatch(saveProfiles(newProfiles));
          setLoading(false);
        }
      }

      setButtonSubmitDisabled(false);
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <ProfilesMenu error={error} addProfile={addProfile} />
      {profiles.map((profile, index) => (
        <ProfilesFormItem
          key={index}
          index={index}
          name={profile.name}
          privateKey={profile.privateKey}
          proxy={profile.proxy}
          error={profile.error}
          removeProfile={removeProfile}
          changeName={changeName}
          changePrivateKey={changePrivateKey}
          changeProxy={changeProxy}
        />
      ))}
      <div className="form__button-container">
        <button className={`button button_middle ${buttonSubmitDisabled ? 'button_loading button_middle_loading' : ''}`} type="submit" disabled={buttonSubmitDisabled}>
          Save
        </button>
      </div>
    </form>
  );
};