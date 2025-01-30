import { useState, memo } from "react";
import refreshImage from '/refresh.svg';

import { setNameAbbreviation } from '../utils/Functions';
import { useDispatch } from 'react-redux';
import { updateProfiles } from '../store/profilesSlice';

function DashboardCardDisabled({
  name,
  publicKey,
  error,
  index,
  openPopup,
  contractName,
  visibleContract,
  explorer,
}) {
  const dispatch = useDispatch();
  
  const profileClass = visibleContract ? (contractName === visibleContract ? "profile-show" : "profile-hide") : (contractName === 'PXLs' ? "profile-show-default" : "");
  const profileDisabled = !contractName ? "profile-show-default" : "";
  const [buttonDisabled, setButtonDisabled] = useState(false);

  async function refresh() {
    if(!buttonDisabled) {
      setButtonDisabled(true);
      await dispatch(updateProfiles([index]));
      setButtonDisabled(false);
    }
  }

  return (
    <div className={`profile ${profileClass} ${profileDisabled}`}>
      {publicKey && explorer
       ? <a className="profile__title" title={name} target="_blank" rel="noopener noreferrer" href={explorer + publicKey}>{setNameAbbreviation(name)}</a>
       : <h2 className="profile__title" title={name}>{setNameAbbreviation(name)}</h2>
      }
      <div className="profile__error" onClick={() => openPopup(error)}>
        <p className="profile__message">{error}</p>
      </div>
      {publicKey && 
        <button className="button profile__refresh" disabled={buttonDisabled} onClick={refresh}>
        	<img className={buttonDisabled ? "button__image-rotate" : ""} src={refreshImage}/>
        </button>
      }
    </div>
  )
}

export default memo(DashboardCardDisabled);