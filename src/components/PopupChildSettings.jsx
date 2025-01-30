import { useState } from 'react';
import { PopupChildSettingsRow } from './index';
import { contractsConfig } from '../utils/Constants';
import { useDispatch, useSelector } from 'react-redux';
import { setClaimSettings } from '../store/profilesSlice';

export default function PopupChildSettings({setIsOpenPopup}) {
  const dispatch = useDispatch();
  const profilesData = useSelector(state => state.profilesData.profiles);
  const contractsNameArr = Object.keys(contractsConfig);

  const [settings, setSettings] = useState(createSettings());
  const [visibleContract, setVisibleContract] = useState(contractsNameArr[0]);

  function createSettings() {
    return profilesData.map(profile => {
      if (profile.disabled) return;
      return {name: profile.name, ...contractsNameArr.reduce((acc, name) => { //[{name, PXLs, Scale}]
        const upgrade = profile[name].upgrade;
        if (upgrade) acc[name] = upgrade;
        return acc;
      }, {})};
    });
  };

  function handleChange(index, property, value) {
    setSettings(prev => {
      const newSettings = [...prev];
      newSettings[index] = {...prev[index], [visibleContract]: {...prev[index][visibleContract], [property]: value}}
      return newSettings;
    });
  }

  function handleAllChange(property) {
    setSettings(prev => {
      return prev.map(profile => {
        return {...profile, [visibleContract]: {...profile[visibleContract], [property]: !prev[0][visibleContract][property]}} //Ориентирование на настройку первого профиля
      })
    });
  }

  function save() {
    dispatch(setClaimSettings(settings));
    setIsOpenPopup(false);
  }

  return (
    <div className="popup__settings">
      <h1 className="popup__title">PXLs Upgrade Settings</h1>
      <table className="table">
        <thead className="table__head">
          <tr className="table__row">
            <th className="table__cell"></th>
            <th className="table__cell table__button" onClick={() => handleAllChange('drill')}>Drill</th>
            <th className="table__cell table__button" onClick={() => handleAllChange('storage')}>Storage</th>
          </tr>
        </thead>
        <tbody className="table__body">
        {
          settings.map((profile, index) => {
            if (!profile || !profile[visibleContract]) return;
            return <PopupChildSettingsRow key={`${visibleContract}-${index}`} {...{
              index,
              name: profile.name,
              drill: profile[visibleContract].drill,
              storage: profile[visibleContract].storage,
              visibleContract,
              setSettings
            }}/>
          })
        }
        </tbody>
      </table>
      <button className="button button_small" type="submit" onClick={save}>Save</button>
    </div>
  );
}