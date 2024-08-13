import { useState, useCallback } from "react";
import { DashboardCard, DashboardCardDisabled } from './index.jsx';
import refreshImage from '/refresh.svg';

export default function Dashboard({profilesData, updateProfiles, miningQueue}) {
  const dataIsEmpty = !profilesData.length;
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [isOpenPopup, setIsOpenPopup] = useState(false);
  const [onMouseDownPopup, setOnMouseDownPopup] = useState(false);
  const [onMouseHoverPopup, setOnMouseHoverPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function refresh() {
    if(!buttonDisabled) {
      setButtonDisabled(true)
      await updateProfiles()
      setButtonDisabled(false)
    }
  }

  function didEventInPopup(event) {
    return !event.target.closest('.popup__container');
  }

  function onMousePointing(event) { //Изменение цвета кнопки при наведении на задний фон попапа
    if (didEventInPopup(event)) {
      setOnMouseHoverPopup(true)
    } else {
      setOnMouseHoverPopup(false)
    }
  }

  const openPopup = useCallback((error) => {
    setErrorMessage(error);
    setIsOpenPopup(true);
  }, []);

  function closePopup(event) {
    (didEventInPopup(event) && onMouseDownPopup) && setIsOpenPopup(false); 
  }

  const setName = useCallback((name) => { //Длинное имя будет превращено в abc..xyz;
    const length = name.length;
    return length > 9 ? name.slice(0, 4) + '..' + name.slice(length - 4, length) : name;
  }, []);

  function createCards() {
    if (dataIsEmpty) return <p className="dashboard__text">No profiles</p>;

    return profilesData.map((profile, index) => {
      if (Number.isInteger(profile)) {
        return Array.from({length: profile}, (_, i) => (
          <div className="profile load" key={`${index}-${i}`}></div>
        ));
      }

      const passedProps = {
        index,
        setName,
        openPopup,
        name: profile.name,
        publicKey: profile.publicKey,
      };
      
      return profile.disabled
             ? <DashboardCardDisabled key={index} {...passedProps} error={profile.error} updateProfiles={updateProfiles} />
             : <DashboardCard key={index} {...passedProps} id={profile.id} balance={profile.balance} claimTimestamp={profile.claimTimestamp}
                              sizeLimit={profile.sizeLimit} rewardPerSecond={profile.rewardPerSecond} refLimit={profile.refLimit}
                              refStorage={profile.refStorage} miningQueue={miningQueue} />
    })
  }

  return (
    <div className={`dashboard ${dataIsEmpty ? "dashboard__empty" : ""}`}>
      {!dataIsEmpty && <button className="button dashboard__refresh" disabled={buttonDisabled} onClick={refresh}>
        <img className={buttonDisabled ? "button__image-rotate" : ""} src={refreshImage}/>
      </button>}

      {createCards()}

      {isOpenPopup &&
        <div className="popup" onMouseOver={onMousePointing} onMouseOut={onMousePointing} onMouseDown={() => setOnMouseDownPopup(didEventInPopup(event))} onMouseUp={closePopup}>
          <button className={'popup__button-close' + (onMouseHoverPopup ? ' popup__button-close_active' : '')}></button>
          <div className="popup__container">{errorMessage}</div>
        </div>
      }
    </div>
  );
}