import { useState, useEffect, useRef } from 'react';
import Dashboard from './Dashboard.jsx';
import Profiles from './Profiles.jsx';
import "./App.css";
import { Web3 } from 'web3';
import AbiPXLs from './utils/abiPXLs.js'
import AbiPXLsChest from './utils/abiPXLsChest.js'

function App() {
  //Отключение меню при нажатии правой кнопки мыши
  window.addEventListener("contextmenu", (e) => {e.preventDefault()});

  const [name, setName] = useState("");

  const localStorageProfilesData = localStorage.getItem('profilesData');
  const [profilesData, setProfilesData] = useState(localStorageProfilesData ? JSON.parse(localStorageProfilesData) : [])
  const timeoutIdsRef = useRef([]);

  const localStoragePage = localStorage.getItem('page');
  const [page, setPage] = useState(localStoragePage ? localStoragePage : 'dashboard')

  const web3 = new Web3("https://songbird.solidifi.app/ext/C/rpc");

  if (profilesData.length) {
    profilesData.forEach((profile) => {
      if (!profile.disabled) {
        web3.eth.accounts.wallet.add(profile.privateKey);
      }
    });
  }

  const PXLsAdress = '0x39838abf66af299401030e1B82be7848301FbB94';
  const PXLsToken = new web3.eth.Contract(AbiPXLs, PXLsAdress);
  const PXLsChestAdress = '0xcDf540967562c48E470b714699c7fd659d4A346e';
  const PXLsChest = new web3.eth.Contract(AbiPXLsChest, PXLsChestAdress);
  const tokenDivider = 10e17;

//   (async () => {
//     const nonce = Number(await web3.eth.getTransactionCount("0x8698652b5d0125e76e8Ec71103B8E351c38F547B"));
//   const block = await web3.eth.estimateGas({
//     "from": "0x8698652b5d0125e76e8Ec71103B8E351c38F547B",       
//     "nonce": nonce, 
//     "to": "0x39838abf66af299401030e1B82be7848301FbB94",     
//     // "data": "0x6759647a000000000000000000000000000000000000000000000000000000004c397705"
//   })
//     console.log(block)
// })()

  function changePage(page) {
    setPage(page);
    localStorage.setItem('page', page);
  }

  async function saveData(data) { //[{name: '', privateKey: '', disabled: false}]
    let updateProfilesData = [];
    let newProfiles = profilesData.length = data.length ? false : true; //Есть новые профиля?
    console.log(newProfiles)

    for (let i = 0; i < data.length; i++) {
      let profile = data[i];

      if (!Object.hasOwn(profile, 'id')) {
        try {
          const wallet = web3.eth.accounts.wallet.add(profile.privateKey);
          profile.publicKey = wallet[wallet.length - 1].address;

          profile.id = await getIdFromBlockchain(profile.publicKey);
          [profile.claimTimestamp,
           profile.sizeLimit,
           profile.rewardPerSecond,
           profile.refLimit,
           profile.refStorage,
           profile.balance,
           profile.prices] = await getDataFromBlockchain(profile.id)
           newProfiles = true; //Считается новым, если всё прошло без ошибок
        } catch {
          profile.disabled = true;
          profile.error = "Incorrect Private Key"
        }
      }

      updateProfilesData.push(profile)
    }

    localStorage.setItem('profilesData', JSON.stringify(updateProfilesData));
    setProfilesData(updateProfilesData);

    changePage('dashboard');

    newProfiles && startMiningForAllProfiles();
  }

  function getIdFromBlockchain(address) {
    return PXLsToken.methods.getAddressId(address).call().then(data => {return Number(data)});
  }

  async function getDataFromBlockchain(id) {
    const storage = await PXLsToken.methods.getStorage(id).call().then(data => {return data});

    const {claimTimestamp, refStorage} = storage.user;
    const {sizeLimit, rewardPerSecond, refLimit, balance, prices} = storage;

    const pricesInNumbers = prices.map(price => Number(price))

    return [Number(claimTimestamp), Number(sizeLimit), Number(rewardPerSecond), Number(refLimit), Number(refStorage), Number(balance), pricesInNumbers]
  }

  function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
  }

  async function claim(profile, index, filled, fillingTime) {
    if (filled >= 0.95) {
      console.log('До')
      console.log(profile)
      await PXLsToken.methods.claimReward(profile.id).send({from: profile.publicKey}); //Клейм хранилища
      await updateProfiles(index);
      console.log('После')
      console.log(profile)
            // console.log(profile.name + ' ' + fillingTime* 1000 + ' ' + Date.now());
      // await abb(index);
      // console.log(fillingTime)
      // console.log(profile.name + ' ' + filled + ' ' + Date.now())
      // console.log(profile.name + ' ' + getRandomInt(fillingTime * 950, fillingTime * 1000) + ' ' + Date.now())
      // console.log(web3.eth.accounts.wallet)
      mining(profile, index);
    } else {
      // console.log(profile.name + ' ' + fillingTime* 1000 + ' ' + Date.now());
      // await abb(index);
      // console.log(fillingTime)
      // console.log(profile.name + ' ' + filled + ' ' + Date.now())
      // console.log(profile.name + ' ' + getRandomInt(fillingTime * 950, fillingTime * 1000) + ' ' + Date.now())
      // console.log(web3.eth.accounts.wallet)
      console.log('Сидим')
      // console.log(profile, index, filled, fillingTime)
      const timeoutId = setTimeout(mining, getRandomInt(fillingTime * 950, fillingTime * 1000), profile, index);
      console.log('Таймер айди ' + timeoutId)
      timeoutIdsRef.current.push(timeoutId);
    }
  }

  async function mining(profile, index) {
    console.log(profile.name)
    if ((profile.refStorage / profile.refLimit) > 0.9) { //Хранилище заполнено на 90%?
      await PXLsToken.methods.claimReferral(profile.id).send({from: profile.publicKey}); //Клейм реф хранилища
      await updateProfiles(index);
    }
    
    const timestamp = Math.round(Date.now() / 1000);
    
    // const chestTimestamp = Number(await PXLsChest.methods.getLastFreeClaim(profile.id).call()); //Прошла неделя?
    // if (chestTimestamp !== 0 && (timestamp - chestTimestamp) > 60 * 60 * 24 * 7) {
    //   await PXLsChest.methods.claimWeeklyChest().send({from: profile.publicKey}); //Клейм NFT
    // }

    const fillingTime = Math.round(profile.sizeLimit / profile.rewardPerSecond);
    const filled = (timestamp - profile.claimTimestamp) / fillingTime;

    if (fillingTime < 10800) { //Хранилище заполняется менее чем за 3 часа?
      if (profile.balance > profile.prices[1]) { //Хватает ли на прокачку хранилища?
        await PXLsToken.methods.buySizeLevel(profile.id).send({from: profile.publicKey}); //Прокачка хранилища и клейм
        await updateProfiles(index);
        mining(profile, index);
      } else {
        await claim(profile, index, filled, fillingTime);
      }
    } else {
      if (profile.balance > profile.prices[0]) { //Хватает ли на прокачку дрели?
        await PXLsToken.methods.buySpeedLevel(profile.id).send({from: profile.publicKey}); //Прокачка дрели и клейм
        await updateProfiles(index);        
        mining(profile, index);
      } else {
        await claim(profile, index, filled, fillingTime);
      }
    }
  }

  async function updateProfiles(index = 'all') { //Обновление данных
    const updateProfilesData = [...profilesData];
    const profilesToUpdate = index === 'all' ? updateProfilesData : [updateProfilesData[index]];

    await Promise.all(profilesToUpdate.map(async (updateProfileData) => {
      if (!updateProfileData.disabled) {
        [updateProfileData.claimTimestamp, 
         updateProfileData.sizeLimit, 
         updateProfileData.rewardPerSecond, 
         updateProfileData.refLimit,
         updateProfileData.refStorage, 
         updateProfileData.balance, 
         updateProfileData.prices] = await getDataFromBlockchain(updateProfileData.id);
      }
    }));

    localStorage.setItem('profilesData', JSON.stringify(updateProfilesData));
    setProfilesData(updateProfilesData);
  }

  function clearAllTimeouts() {
    console.log(timeoutIdsRef)
    timeoutIdsRef.current.forEach(id => { console.log(id); clearTimeout(id)});
    timeoutIdsRef.current = [];
    console.log(timeoutIdsRef)
  }

  function startMiningForAllProfiles() {
    clearAllTimeouts();
    console.log("Таймеры сброшен")
    console.log(profilesData)
    profilesData.forEach((profile, index) => {
      if (!profile.disabled) {
        console.log(profile)
        mining(profile, index);
      }
    });
  }

  useEffect(() => {
    startMiningForAllProfiles();

    return () => {
      clearAllTimeouts();
    };
  }, []);

  return (
    <div className="container">
      <h1 className="container__title">Welcome to AutoPXLs!</h1>
      <div className="container__buttons">
        <button className={`container__button container__button-dashboard ${page === "dashboard" ? "container__button-dashboard_active" : ''}`} onClick={() => changePage('dashboard')}></button>
        <button className={`container__button container__button-profiles ${page === "profiles" ? "container__button-profiles_active" : ''}`} onClick={() => changePage('profiles')}></button>
      </div>

      {page === 'dashboard'
       ? <Dashboard profilesData={profilesData} updateProfiles={updateProfiles} startMiningForAllProfiles={startMiningForAllProfiles}/>
       : <Profiles profilesData={profilesData} saveData={saveData}/>
      }
    </div>
  );
}

export default App;

// Dianchik: {
//   id: '',
//   claimTimestamp: '',
//   sizeLimit: '',
//   rewardPerSecond: '',
//   refLimit: '',
//   refStorage: '',
//   balance: '',
//   prices: [ 900000000000000000n, 2400000000000000000n, 3696000000000000000n ],
// }