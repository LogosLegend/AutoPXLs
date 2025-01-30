import { useState, useEffect, useRef, useCallback } from 'react';
import { Dashboard, Profiles, ChangePassword } from './index';
import { networks, contractsConfig } from '../utils/Constants';
import { checkAuthentication, updateProfilesData, decrypt, createWeb3, createContract } from '../utils/Functions';
import { useDispatch, useSelector } from 'react-redux';
import { setGlobalAuthorized } from '../store/globalAuthorizedSlice';
import { updateProfiles, disableMiner } from '../store/profilesSlice';
import { setPage } from '../store/pageSlice';

export default function MinerApp() {
  const dispatch = useDispatch();
  const profilesData = useSelector(state => state.profilesData.profiles);
  const profilesDataRef = useRef(profilesData);
  const password = useSelector(state => state.password.data);
  const page = useSelector(state => state.page.data);

  const [buttonDashboardDisabled, setButtonDashboardDisabled] = useState(true);
  const [buttonProfilesDisabled, setButtonProfilesDisabled] = useState(false);
  const [buttonChangeDisabled, setButtonChangeDisabled] = useState(false);
  
  const miningQueueRef = useRef([]);
  const miningCurrentProfile = useRef({}); //Профиль для которого в данный момент выполняется mining. Во время выполнения функции содержит id профиля и имя контракта {id, contractName}
  const isProcessing = useRef(false);

  const [loading, setLoading] = useState(profilesData.length);

  useEffect(() => {
    (async () => {
      dispatch(setPage('dashboard'));
      await dispatch(updateProfiles([]));
      setLoading(false);
    })()
  }, []); //Обновление данных профилей при запуске

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!await checkAuthentication()) dispatch(setGlobalAuthorized(false));
    }, 1800000); //Проверка сессии каждые 30 минут (Единовременно может существовать только одна)

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    profilesDataRef.current = profilesData;
  }, [profilesData]);

  function changePage(page) { //Переход в другой раздел страницы
    const buttons = { //Объект с функциями для обновления state переменных отвечающих за выключение кнопок
      dashboard: setButtonDashboardDisabled,
      profiles: setButtonProfilesDisabled,
      change: setButtonChangeDisabled
    };

    for (const button in buttons) { //Обновление всех state переменных из buttons
      buttons[button](button === page); // — это setButtonDisabled(true or false)
    }
    if (page !== 'dashboard') miningQueueRef.current = []; //Очищение очереди
    dispatch(setPage(page));
  }

  function createPage() {
    switch (page) {
      case 'dashboard':
        return <Dashboard loading={loading} miningQueue={miningQueue} />
      case 'profiles':
        return <Profiles setLoading={setLoading} changePage={changePage} />
      case 'change':
        return <ChangePassword />
    }
  }

  async function getGasLimit(web3, from, to, data) {
    const gas = await web3.eth.estimateGas({
      from,
      to,
      data: data.encodeABI()
    });
    return Math.round(Number(gas) * 1.1); //Повышение лимита газа на 10%
  }

  async function sendTransaction(contract, contractName, methodName, web3, from, data) {
    try {
      const to = contract._address;
      const method = data ? contract.methods[methodName](data) : contract.methods[methodName]();

      const gasLimit = await getGasLimit(web3, from, to, method);
      const result = await method.send({from, gasLimit});
    } catch (error) {
      const code = error.error?.code;

      const message = error.error.cause?.message;
      const newMessage = message.includes('gas * price + value') ? 'Out of gas to pay' : message;
      if (methodName !== "claimWeeklyChest" || code !== 310) throw Error(newMessage); //claimWeeklyChest доступен 1 раз в неделю, 310 — ошибка выполнения контракта
    }
  }

  async function mining(index, fillingTime, contractName) {
    const {id, privateKey, salt, iv, publicKey, proxy, userAgent} = profilesDataRef.current[index];
    const {prices, refLimit, upgrade} = profilesDataRef.current[index][contractName];
    let balance = profilesDataRef.current[index][contractName].balance;

    try {
      const contractConfig = contractsConfig[contractName]; //Данные контракта
      const web3 = createWeb3(networks[contractConfig.network].rpc, {proxy, userAgent}); //Соединение с RPC
      const contract = createContract(web3, contractConfig.contract); //Создание экземпляра контракта

      try {
        const decryptedPrivateKey = decrypt(privateKey, salt, iv, password); //Расшифровка приватного ключа
        await web3.eth.accounts.wallet.add(decryptedPrivateKey); //Добавление приватного ключа в кошелёк для дальнейшего взаимодействия

        if (contractConfig.referals) { //Есть ли у контракта реферальная система?
          const refStorage = (await updateProfilesData(profilesDataRef.current, index, contractName))[index][contractName].refStorage; //Обновление реферального хранилища перед проверкой

          if ((refStorage / refLimit) > 0.7) { //Хранилище заполнено на 70%?
            await sendTransaction(contract, contractName, "claimReferral", web3, publicKey, id); //Клейм реферального хранилища
            balance = (await updateProfilesData(profilesDataRef.current, index, contractName))[index][contractName].balance; //Обновление баланса
          }
        }

        if (contractConfig.chest) { //Есть ли у контракта еженедельная награда?
          const chest = createContract(web3, contractConfig.chest);
          await sendTransaction(chest, contractName, "claimWeeklyChest", web3, publicKey); //Клейм NFT
          //При вызове метода происходит проверка транзакций за последние 7 дней. При успешном моделировании метод будет вызван в основной сети
        }

        async function claimReward() {
          await sendTransaction(contract, contractName, "claimReward", web3, publicKey, id);
        }

        async function processUpgrade(isFillingQuickly, priceIndex) {
          const nextUpgradePrice = prices[priceIndex]; //Улучшать хранилище[1] или дрель[0]?
          const upgradeType = isFillingQuickly ? "buySizeLevel" : "buySpeedLevel";
          if (balance > nextUpgradePrice) {
            await sendTransaction(contract, contractName, upgradeType, web3, publicKey, id); //Улучшение и клейм
          } else {
            await claimReward(); //Клейм
          }
        };

        if (contractConfig.upgrade) { //Есть ли у контракта возможность улучшения?
          const {drill, storage} = upgrade; //Булевые переменные
          if (drill && storage) { //Разрешены все улучшения?
            const isFillingQuickly = fillingTime < 10800; //Хранилище заполняется менее чем за 3 часа?
            await processUpgrade(isFillingQuickly, isFillingQuickly ? 1 : 0);
          } else if (drill) { //Разрешена улучшение дрель?
            await processUpgrade(false, 0);
          } else if (storage) { //Разрешено улучшение хранилища?
            await processUpgrade(true, 1);
          } else { //Улучшения отключены
            await claimReward(); //Клейм
          }
        } else {
          await claimReward(); //Клейм
        }

        await dispatch(updateProfiles([index, contractName])); //Обновление профиля
      } catch (error) {
        await dispatch(disableMiner([index, error.message, contractName])); //Отключение профилю возможности взаимодействия с контрактом
      } finally {
        await web3.eth.accounts.wallet.clear(); //Очищение кошелька от адресов
      }
    } catch(error) {
      await dispatch(disableMiner([index, error.message, contractName])); //Отключение профилю возможности взаимодействия с контрактами
    }
  }

  const miningQueue = useCallback((index, fillingTime, id, contractName) => { //Добавить в очередь (необходима для избежания попадания всех транзакций в один блок)
    miningQueueRef.current.push([() => mining(index, fillingTime, contractName), id, contractName]);
    startQueue();
  }, []);

  async function startQueue() { //Запустить очередь
    if (isProcessing.current || miningQueueRef.current.length === 0) return; //Если очередь запущена или пуста прервать выполнение

    isProcessing.current = true;

    while (miningQueueRef.current.length > 0) {
      const [miningFunction, id, contractName] = miningQueueRef.current.shift();
      if (id !== miningCurrentProfile.id || contractName !== miningCurrentProfile.contractName) { //Проверка на повторный профиль или контракт
        miningCurrentProfile.current = {id, contractName};
        await miningFunction();
      }
    }
    miningCurrentProfile.current = '';
    isProcessing.current = false;
  }

  return (
    <div className="container">
      <h1 className="container__title">Welcome to AutoPixel!</h1>
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