import { useEffect, memo } from "react";
import { Filling } from './index.jsx';
import { setNameAbbreviation } from '../utils/Functions';

function DashboardCard({
  name,
  publicKey,
  id,
  balance,
  claimTimestamp,
  sizeLimit,
  rewardPerSecond,
  refLimit,
  refStorage,
  index,
  miningQueue,
  contractName,
  visibleContract,
  tokenImage,
  tokenColor,
  explorer,
  divider
}) {
  const profileClass = visibleContract ? (contractName === visibleContract ? "profile-show" : "profile-hide") : (contractName === 'PXLs' ? "profile-show-default" : "");

  const timestamp = Math.round(Date.now() / 1000);
  const fillingTime = Math.round(sizeLimit / rewardPerSecond);
  const percent = Math.min(1, Math.max(0, (timestamp - claimTimestamp) / fillingTime)); //Сколько времени заполняется хранилище? Насколько % заполнено хранилище?

  const speed = (60 * 60 * rewardPerSecond / divider).toFixed(4);

  const currentBalance = (balance / divider).toFixed(2);

  const size = (sizeLimit / divider).toFixed(4);

  const currentRefSize = (refStorage / divider).toFixed(2);
  const refSize = (refLimit / divider).toFixed(2);

  const currentRefSizeWidth = currentRefSize / refSize * 122 + 'px';

  function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
  }

  useEffect(() => {
    if (percent >= 0.95) { //Добавление в очередь при заполнении хранилища минимум на 95%
      miningQueue(index, fillingTime, id, contractName);
      return;
    }

    const remainingTime = (1 - percent) * fillingTime; //Оставшееся время до полного заполнения в секундах
    const random = getRandomInt(remainingTime * 950, remainingTime * 1000); //Значение в промежутке между 95% и 100% оставшегося времени в секундах

    const timeout = setTimeout(miningQueue, random, index, fillingTime, id, contractName); //Добавление в очередь через время

    return () => {
      clearTimeout(timeout);
    };
  }, [claimTimestamp]); //Клейм

  return (
    <div className={`profile ${profileClass}`}>
      <a className="profile__title" title={name} target="_blank" rel="noopener noreferrer" href={explorer + publicKey}>{setNameAbbreviation(name)}</a>
      <p className="profile__speed">{`${speed} ${contractName} / hour`}</p>
      <div className="profile__pixels">
        <h3 className="profile__balance">{currentBalance}</h3>
        <img className="profile__img" src={tokenImage} alt="logo" style={{borderColor: tokenColor}}/>
      </div>
      <div className="profile__storage">
        <h2 className="profile__subtitle">Storage</h2>
        <div className="profile__progress" style={{borderColor: tokenColor}}>
          <Filling claimTimestamp={claimTimestamp} size={size} fillingTime={fillingTime} tokenColor={tokenColor}/>
          <p className="profile__progress-text">{size}</p>
        </div>
      </div>
      {refLimit ? <div className="profile__storage">
        <h2 className="profile__subtitle">Referal Storage</h2>
        <div className="profile__progress profile__progress_referal-storage">
          <div className="profile__filling profile__filling_referal-storage" style={{width: currentRefSizeWidth}}></div>
          <p className="profile__progress-text">{currentRefSize}</p>
          <p className="profile__progress-text">{refSize}</p>
        </div>
      </div> : ''}
    </div>
  );
}

export default memo(DashboardCard);