import { useState, memo } from "react";
import refreshImage from '/refresh.svg';

function DashboardCardDisabled({name, publicKey, error, index, setName, openPopup, updateProfiles}) {
  const [buttonDisabled, setButtonDisabled] = useState(false);

  async function refresh() {
    if(!buttonDisabled) {
      setButtonDisabled(true)
      await updateProfiles(index)
      setButtonDisabled(false)
    }
  }

  return (
    <div className="profile">
      {publicKey
       ? <a className="profile__title" title={name} target="_blank" rel="noopener noreferrer" href={'https://songbird-explorer.flare.network/address/' + publicKey}>{setName(name)}</a>
       : <h2 className="profile__title" title={name}>{setName(name)}</h2>
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