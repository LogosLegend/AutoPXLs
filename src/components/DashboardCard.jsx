import { useEffect, memo } from "react";
import { Filling } from './index.jsx';
import { tokenDivider } from '../utils/Constants.jsx';
import token from '/token.png';

function DashboardCard({name, publicKey, id, balance, claimTimestamp, sizeLimit, rewardPerSecond, refLimit, refStorage, index, miningQueue, setName, openPopup}) {
  // const {name, publicKey, balance, claimTimestamp, sizeLimit, rewardPerSecond, refLimit, refStorage} = profile;

  const timestamp = Math.round(Date.now() / 1000);
  const fillingTime = Math.round(sizeLimit / rewardPerSecond);
  const percent = Math.min(1, Math.max(0, (timestamp - claimTimestamp) / fillingTime)); //Сколько времени заполняется хранилище? Насколько % заполнено хранилище?

  const speed = (60 * 60 * rewardPerSecond / tokenDivider).toFixed(4);

  const currentBalance = (balance / tokenDivider).toFixed(2);

  const size = (sizeLimit / tokenDivider).toFixed(4);

  const currentRefSize = (refStorage / tokenDivider).toFixed(2);
  const refSize = (refLimit / tokenDivider).toFixed(2);

  const currentRefSizeWidth = currentRefSize / refSize * 122 + 'px';

  console.log('Ты че бля')

  function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
  }

  useEffect(() => {
    if (percent >= 0.95) {
      miningQueue(index, fillingTime, id);
      return;
    }

    const remainingTime = (1 - percent) * fillingTime
    const random = getRandomInt(remainingTime * 950, remainingTime * 1000)
    console.log(name + ' ' + percent + ' ' + random)

    const timeout = setTimeout(miningQueue, random, index, fillingTime, id);

    return () => {
      clearTimeout(timeout);
    };
  }, [claimTimestamp]); //Клейм

  return (
    <div className="profile">
      <a className="profile__title" title={name} target="_blank" rel="noopener noreferrer" href={'https://songbird-explorer.flare.network/address/' + publicKey}>{setName(name)}</a>
      <p className="profile__speed">{`${speed} PXLs / hour`}</p>
      <div className="profile__pixels">
        <h3 className="profile__balance">{currentBalance}</h3>
        <img className="profile__img" src={token} alt="logo"/>
      </div>
      <div className="profile__storage">
        <h2 className="profile__subtitle">Storage</h2>
        <div className="profile__progress profile__progress_storage">
          <Filling claimTimestamp={claimTimestamp} size={size} fillingTime={fillingTime}/>
          <p className="profile__progress-text">{size}</p>
        </div>
      </div>
      <div className="profile__storage">
        <h2 className="profile__subtitle">Referal Storage</h2>
        <div className="profile__progress profile__progress_referal-storage">
          <div className="profile__filling profile__filling_referal-storage" style={{width: currentRefSizeWidth}}></div>
          <p className="profile__progress-text">{currentRefSize}</p>
          <p className="profile__progress-text">{refSize}</p>
        </div>
      </div>
    </div>
  );
}

export default memo(DashboardCard);