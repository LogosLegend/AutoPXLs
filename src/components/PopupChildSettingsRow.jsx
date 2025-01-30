import { setNameAbbreviation } from '../utils/Functions';

export default function PopupChildSettingsRow({index, name, drill, storage, visibleContract, setSettings}) {
  function handleChange(index, property, value) {
    setSettings(prev => {
      const newSettings = [...prev];
      newSettings[index] = {...prev[index], [visibleContract]: {...prev[index][visibleContract], [property]: value}}
      return newSettings;
    });
  }

  return (
    <tr className="table__row">
      <td className="table__cell">{setNameAbbreviation(name)}</td>
      <td className="table__cell">
        <input type="checkbox" className="table__checkbox" id={`checkbox-${index}-1`} checked={drill} onChange={() => handleChange(index, 'drill', !drill)}/>
        <label htmlFor={`checkbox-${index}-1`}></label>
      </td>
      <td className="table__cell">
        <input type="checkbox" className="table__checkbox" id={`checkbox-${index}-2`} checked={storage} onChange={() => handleChange(index, 'storage', !storage)}/>
        <label htmlFor={`checkbox-${index}-2`}></label>
      </td>
    </tr>
  );
}