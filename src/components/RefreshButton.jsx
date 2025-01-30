import { useState } from "react";
import refreshImage from '/refresh.svg';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfiles } from '../store/profilesSlice';

export default function RefreshButton() {
  const dispatch = useDispatch();
  const [buttonDisabled, setButtonDisabled] = useState(false);

  async function refresh() {
    if(!buttonDisabled) {
      setButtonDisabled(true);
      await dispatch(updateProfiles([]));
      setButtonDisabled(false);
    }
  }

  return (
    <button className="button dashboard__button" disabled={buttonDisabled} onClick={refresh}>
      <img className={buttonDisabled ? "button__image-rotate" : ""} src={refreshImage}/>
    </button>
  )
}