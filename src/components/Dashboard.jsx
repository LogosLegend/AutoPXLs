import { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshButton, DashboardCard, DashboardCardDisabled, Popup, PopupChildSettings } from './index.jsx';
import gearImage from '/gear.svg';
import swapImage from '/swap.svg';

import { contractsInfo } from '../utils/Constants';
import { useDispatch, useSelector } from 'react-redux';
import { updateProfiles } from '../store/profilesSlice';

export default function Dashboard({loading, miningQueue}) {
  const dispatch = useDispatch();

  const profilesData = useSelector((state) => state.profilesData.profiles);
  const profilesDataRef = useRef(profilesData);

  const dataIsEmpty = !profilesData.length;
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [isOpenPopup, setIsOpenPopup] = useState(false);
  const [contentPopup, setContentPopup] = useState('');

  const [mainContract, setMainContract] = useState(contractsInfo[0].name);

  const [visibleContract, setVisibleContract] = useState('');

  useEffect(() => {
    profilesDataRef.current = profilesData;
  }, [profilesData]);

  useEffect(() => {
    const interval = setInterval(async () => {
      for ([index, porfile] of profilesDataRef.current.entries()) {
        if (profile.PXLs?.disabled) await dispatch(updateProfiles([index, ['PXLs']]));
        if (profile.Jade?.disabled) await dispatch(updateProfiles([index, ['Jade']]));
      }
    }, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []); //Включение отключённых контрактов у профилей каждые 30 минут

  function change() {
    if (visibleContract === "Jade") {
      setVisibleContract("PXLs");
    } else {
      setVisibleContract("Jade");
    }
  }

  const openErrorPopup = useCallback((error) => {
    setContentPopup(error);
    setIsOpenPopup(true);
  }, []);

  function openSettingsPopup(error) {
    setContentPopup(<PopupChildSettings setIsOpenPopup={setIsOpenPopup} />);
    setIsOpenPopup(true);
  }

  function createCards() {
    if (dataIsEmpty) return <p className="dashboard__text">No profiles</p>;

    const profiles = loading ? [loading] : profilesData;

    return profiles.map((profile, index) => {
      if (Number.isInteger(profile)) {
        return Array.from({length: profile}, (_, i) => (
          <div className="profile-container" key={`${index}-${i}`}>
            <div className="profile load"></div>
          </div>
        ));
      };

      const passedProps = {
        index,
        name: profile.name,
        publicKey: profile.publicKey,
      };

      if (profile.disabled) return (
        <div key={index} className="profile-container">
          <DashboardCardDisabled {...passedProps} error={profile.error} openPopup={openErrorPopup} />
        </div>
      );
      
      return (
        <div key={index} className="profile-container">
          {
            contractsInfo.map(({name, image, color, explorer, divider}, i) => {

              if (profile[name].disabled) return <DashboardCardDisabled
                key={`${index}-${i}`}
                {...passedProps}
                error={profile[name].error}
                openPopup={openErrorPopup}
                contractName={name}
                visibleContract={visibleContract}
                explorer={explorer}
              />

              return <DashboardCard
                key={`${index}-${i}`}
                {...passedProps}
                id={profile.id}
                balance={profile[name].balance}
                claimTimestamp={profile[name].claimTimestamp}
                sizeLimit={profile[name].sizeLimit}
                rewardPerSecond={profile[name].rewardPerSecond}
                refLimit={profile[name].refLimit}
                refStorage={profile[name].refStorage}
                miningQueue={miningQueue}
                contractName={name}
                visibleContract={visibleContract}
                tokenImage={image}
                tokenColor={color}
                explorer={explorer}
                divider={divider}
              />
            })
          }
        </div>
      )
    })
  }

  return (
    <div className={'dashboard' + (dataIsEmpty ? " dashboard__empty" : "")}>
      {!dataIsEmpty && <div className="dashboard__buttons">
        <RefreshButton />
        <button className="button dashboard__button" onClick={openSettingsPopup}>
          <img src={gearImage}/>
        </button>
        <button className="button dashboard__button" onClick={change}>
          <img src={swapImage}/>
        </button>
      </div>}

      {createCards()}

      {
        isOpenPopup && <Popup setIsOpenPopup={setIsOpenPopup}>
          {contentPopup}
        </Popup>
      }
    </div>
  );
}