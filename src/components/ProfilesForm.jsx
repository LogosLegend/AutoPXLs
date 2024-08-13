import { useState, useCallback } from "react";
import { ProfilesMenu, ProfilesFormItem } from './index.jsx';
import { profilesErrors } from '../utils/Constants.jsx';

export default function ProfilesForm({profilesData, saveData}) {
  const [profiles, setProfiles] = useState(profilesData);
  const [buttonSubmitDisabled, setButtonSubmitDisabled] = useState(false);
  const [error, setError] = useState({class: '', message: ''});

  const addProfile = useCallback(() => {
    setProfiles(prev => [...prev, {name: '', privateKey: '', disabled: false}])
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
      newProfiles[index] = {name: newProfiles[index].name, privateKey: value, disabled: false};
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

  function submit(e) {
    e.preventDefault();

    if (!buttonSubmitDisabled) {
      setButtonSubmitDisabled(true);

      const newProfiles = [...profiles];

      const isEmptyInputs = newProfiles.reduce((acc, item, index) => { //Найти профили без ключей
        if (item.privateKey === '') acc.push(index);
        return acc;
      }, []);

      if (isEmptyInputs.length) { //Вызвать ошибку и пометить профили без ключей
        for (const index of isEmptyInputs) {
          newProfiles[index].error = profilesErrors.emptyError.class;
          setProfiles(newProfiles);
          setError(profilesErrors.emptyError);
        }
      } else {
        const privateKeys = newProfiles.map(obj => obj.privateKey.toLowerCase());
        const duplicates = findDuplicates(privateKeys); //Найти дубликаты ключей

        if (duplicates.length) { //Вызвать ошибку и пометить дубликаты ключей
          for (const index of duplicates) {
            newProfiles[index].error = profilesErrors.duplicatedError.class;
            setProfiles(newProfiles);
            setError(profilesErrors.duplicatedError);
          }
        } else {
          saveData(newProfiles)
        }
      }

      setButtonSubmitDisabled(false);
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <ProfilesMenu error={error} addProfile={addProfile} />
      {profiles.map((profile, index) => (
        <ProfilesFormItem
          key={index}
          index={index}
          name={profile.name}
          privateKey={profile.privateKey}
          error={profile.error}
          removeProfile={removeProfile}
          changeName={changeName}
          changePrivateKey={changePrivateKey}
        />
      ))}
      <button className={`button button_middle ${buttonSubmitDisabled ? 'button_loading button_middle_loading' : ''}`}
              type="submit" disabled={buttonSubmitDisabled}>
        {!buttonSubmitDisabled && 'Save'}
      </button>
    </form>
  );
}