import { useState, useEffect, useRef, useCallback } from 'react';
import { Dashboard, Profiles, ChangePassword } from './index.jsx';
import {
  web3,
  PXLsContract,
  PXLsChestContract,
  tokenDivider,
} from '../utils/Constants.jsx'

export default function MinerApp({encrypt, decrypt, setAuthorized}) {
  const [page, setPage] = useState('dashboard');
  const [buttonDashboardDisabled, setButtonDashboardDisabled] = useState(true);
  const [buttonProfilesDisabled, setButtonProfilesDisabled] = useState(false);
  const [buttonChangeDisabled, setButtonChangeDisabled] = useState(false);
  
  const localStorageProfilesData = JSON.parse(localStorage.getItem('profilesData'));
  const [profilesData, setProfilesData] = useState(localStorageProfilesData ? [localStorageProfilesData.length] : []);
  const profilesDataRef = useRef(localStorageProfilesData || []);

  const miningQueueRef = useRef([]);
  const miningCurrentProfile = useRef('');
  const isProcessing = useRef(false);

  useEffect(() => {
    (async () => {
      await updateProfiles();
    })()
  }, []); //Обновление данных при запуске

  function changePage(page) {
    const buttons = {
      dashboard: setButtonDashboardDisabled,
      profiles: setButtonProfilesDisabled,
      change: setButtonChangeDisabled
    };

    for (const button in buttons) {
      buttons[button](button === page);
    }
    if (page !== 'dashboard') miningQueueRef.current = [];
    setPage(page);
  }

  function createPage() {
    switch (page) {
      case 'dashboard':
        return <Dashboard profilesData={profilesData} updateProfiles={updateProfiles} miningQueue={miningQueue}/>
      case 'profiles':
        return <Profiles decrypt={decrypt} profilesData={profilesDataRef.current} saveData={saveData}/>
      case 'change':
        return <ChangePassword encrypt={encrypt} decrypt={decrypt} profilesData={profilesDataRef.current} setAuthorized={setAuthorized}/>
    }
  }

  function updateVariables(data) {
    localStorage.setItem('profilesData', JSON.stringify(data));
    profilesDataRef.current = data;
    setProfilesData(data);
  }

  async function saveData(data) { //[{name: '', privateKey: '', disabled: false}
    setProfilesData([data.length]); //Создание профилей с анимацией загрузки
    changePage('dashboard');

    const updateProfilesData = await Promise.all(data.map(async (profile) => {
      if (!profile.id) {
        try {
          const account = web3.eth.accounts.privateKeyToAccount(profile.privateKey);
          profile.publicKey = account.address;
          encryptProfile(profile);
          profile = await getDataFromBlockchain(profile);
        } catch {
          encryptProfile(profile);
          profile.disabled = true;
          profile.error = "Incorrect Private Key"
        }
      } else {
        encryptProfile(profile);
      }
      return profile;
    }));

    function encryptProfile(profile) {
      [profile.salt, profile.iv, profile.privateKey] = encrypt(profile.privateKey);
    }

    updateVariables(updateProfilesData);
  }

  async function getIdFromBlockchain(address) {
    try {
      const id = Number(await PXLsContract.methods.getAddressId(address).call());
      if (id === 0) throw new Error("This address is not linked to any Telegram account in Pixel Wallet");
      return id;
    } catch (error) {
      const message = error.code === 1100 ? "Incorrect profile property: address" : error.message;
      throw new Error(message);
    }
  }

  async function getDataFromBlockchain(profile) {
    try {
      const id = profile.id ?? await getIdFromBlockchain(profile.publicKey);

      const {user: {claimTimestamp, refStorage}, sizeLimit, rewardPerSecond, refLimit, balance, prices}
      = await PXLsContract.methods.getStorage(id).call();

      if (Number(rewardPerSecond) === 0) throw new Error("This Telegram id is not linked to any Pixel Wallet")

      const newProfile = (
        ({error, ...restData}) => ({
          ...restData,
          id,
          disabled: false,
          claimTimestamp: Number(claimTimestamp),
          sizeLimit: Number(sizeLimit),
          rewardPerSecond: Number(rewardPerSecond),
          refLimit: Number(refLimit),
          refStorage: Number(refStorage),
          balance: Number(balance),
          prices: prices.map(Number)
        })
      )(profile);

      return newProfile;
    } catch (error) {
      const message = error.code === 1100 ? "Incorrect profile property: id" : error.message;
      profile = {
        name: profile.name,
        privateKey: profile.privateKey,
        salt: profile.salt,
        iv: profile.iv,
        publicKey: profile.publicKey,
        disabled: true,
        error: message
      };

      return profile;
    }
  }

  const updateProfiles = useCallback(async (profileIndex = 'all') => { //Обновление данных
    const updateProfilesData = [...profilesDataRef.current];
    const profilesToUpdate = profileIndex === 'all' ? updateProfilesData : [updateProfilesData[profileIndex]];

    await Promise.all(profilesToUpdate.map(async (profile, index) => {
      if (profile.publicKey) {
        const updatedProfile = await getDataFromBlockchain(profile);
        const updateIndex = profileIndex === 'all' ? index : profileIndex;
        updateProfilesData[updateIndex] = updatedProfile;
      }
    }));

    updateVariables(updateProfilesData);
    return updateProfilesData;
  }, []);

  function disableProfile(index, error) { //Отключение профиля
    const updateProfilesData = [...profilesDataRef.current];

    updateProfilesData[index] = (
      ({name, privateKey, publicKey, salt, iv, ...restData}) => ({ //Удаление данных с помощью деструктурирующего присваивания
        name,
        privateKey,
        salt,
        iv,
        publicKey,
        error,
        disabled: true,
      })
    )(updateProfilesData[index]);

    updateVariables(updateProfilesData);
  }

  async function getGasLimit(from, to, data) {
    const gas = await web3.eth.estimateGas({
      from,
      to,
      "data": data.encodeABI()
    });
    return Math.round(Number(gas) * 1.1); //Лимит +10%
  }

  async function sendTransaction(contract, methodName, from, data) {
    try {
      const to = contract._address;
      const method = contract.methods[methodName](data);

      const gasLimit = await getGasLimit(from, to, method)
      const result = await method.send({from, gasLimit});
    } catch (error) {
      if (error.message === 'Error happened while trying to execute a function inside a smart contract') {
        const message = error.cause?.message;
        if (methodName !== "claimWeeklyChest") throw new Error(message);
      } else {
        throw new Error(error.message)
      }
    }
  }

  async function mining(index, fillingTime) {
    const {id, privateKey, salt, iv, publicKey, prices, refLimit} = profilesDataRef.current[index];
    let {balance, refStorage} = profilesDataRef.current[index].balance;

    try {
      const decryptedPrivateKey = decrypt(privateKey, salt, iv);
      await web3.eth.accounts.wallet.add(decryptedPrivateKey);

      refStorage = (await updateProfiles(index))[index].refStorage; //Обновление реферального хранилища перед проверкой

      if ((refStorage / refLimit) > 0.85) { //Хранилище заполнено на 85%?
        await sendTransaction(PXLsContract, "claimReferral", publicKey, id); //Клейм реф хранилища
        balance = (await updateProfiles(index))[index].balance;
      }

      await sendTransaction(PXLsChestContract, "claimWeeklyChest", publicKey, ''); //Клейм NFT
      //При вызове метода считаются транзакции за каждый день недели. Метод будет вызван при успешном моделировании

      const isFillingQuickly = fillingTime < 10800; //Хранилище заполняется менее чем за 3 часа?
      const nextUpgradePrice = isFillingQuickly ? prices[1] : prices[0]; //Прокачивать хранилище или дрель?

      if (balance > nextUpgradePrice) {
        const upgradeType = isFillingQuickly ? "buySizeLevel" : "buySpeedLevel";
        await sendTransaction(PXLsContract, upgradeType, publicKey, id); //Прокачка и клейм
      } else {
        await sendTransaction(PXLsContract, "claimReward", publicKey, id); //Клейм
      }
      await updateProfiles(index);
    } catch (error) {
      await disableProfile(index, error.message);
    } finally {
      await web3.eth.accounts.wallet.clear();
    }
  }

  const miningQueue = useCallback((index, fillingTime, id) => { //Добавить в очередь
    miningQueueRef.current.push([() => mining(index, fillingTime), id]);
    startQueue();
  }, []);

  async function startQueue() { //Запустить очередь
    if (isProcessing.current || miningQueueRef.current.length === 0) return; //Если очередь запущена или пуста прервать выполнение

    isProcessing.current = true;

    while (miningQueueRef.current.length > 0) {
      const [miningFunction, id] = miningQueueRef.current.shift();
      if (id !== miningCurrentProfile.current) { //Проверка на повторный профиль
        miningCurrentProfile.current = id;
        await miningFunction();
      }
    }
    miningCurrentProfile.current = '';
    isProcessing.current = false;
  }

  return (
    <div className="container">
      <h1 className="container__title">Welcome to AutoPXLs!</h1>
      <div className="container__buttons">
        <button className={`container__button container__button-dashboard ${page === "dashboard" ? "container__button-dashboard_active" : ''}`}
                onClick={() => changePage('dashboard')} disabled={buttonDashboardDisabled}></button>
        <button className={`container__button container__button-profiles ${page === "profiles" ? "container__button-profiles_active" : ''}`}
                onClick={() => changePage('profiles')} disabled={buttonProfilesDisabled}></button>
      </div>
      <button className="button container__button-change" onClick={() => changePage('change')} disabled={buttonChangeDisabled}>Change password</button>

      {createPage()}
    </div>
  );
}