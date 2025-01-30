import CryptoJS from 'crypto-js';
import userAgents from './User-agents';
import { Web3 } from 'web3';
import { fetch } from '@tauri-apps/plugin-http';
import { projectId, networks, contractsConfig } from './Constants';

const networksNames = Object.keys(networks);
const contractsNames = Object.keys(contractsConfig);

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

export async function checkAuthentication() {
  try {
    const response = await fetch("https://cloud.appwrite.io/v1/account", {
      "headers": {
        "content-type": "application/json",
        "x-appwrite-project": projectId,
        "x-fallback-cookies": localStorage.getItem('cookieFallback'),
      },
    });
    if (response.ok) return true;
    return false;
  } catch(e) {
    return false;
  }
}

export function jsonCheck(data) {
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return []
  }
}

export function setNameAbbreviation(name) { //Длинное имя будет превращено в abc..xyz;
  const length = name?.length;
  return length > 9 ? name.slice(0, 4) + '..' + name.slice(length - 4, length) : name;
}

export function encrypt(data, password) {
  const salt = CryptoJS.lib.WordArray.random(128 / 8); //16 байт
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 512 / 32,
    iterations: 1000
  });

  const iv = CryptoJS.lib.WordArray.random(128 / 8);
  const encrypted = CryptoJS.AES.encrypt(data, key, {
    iv: iv
  });

  return [salt.toString(CryptoJS.enc.Hex), iv.toString(CryptoJS.enc.Hex), encrypted.toString()]; //salt, iv, data
}

export function decrypt(encryptedData, saltHex, ivHex, password) {
  const salt = CryptoJS.enc.Hex.parse(saltHex);
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 512 / 32,
    iterations: 1000
  });

  const decrypted = CryptoJS.AES.decrypt(encryptedData, key, {
    iv: iv
  });

  return decrypted.toString(CryptoJS.enc.Utf8);
}

async function getIdFromBlockchain(address, contract) {
  try {
    const id = Number(await contract.methods.getAddressId(address).call());
    if (id === 0) throw Error("This address is not linked to any Telegram account in Pixel Wallet");
    return id;
  } catch(error) {
    const {code} = error; //Код 1100 может быть только в error
    const {message} = error.error ? error.error.cause : error; //Ответ от сервера приходит в error.error
    const newMessage = code === 1100 ? "Incorrect Public Key" : message;
    throw Error(newMessage);
  }
}

async function getDataFromBlockchain(id, contractName, upgrade, contract) {
  try {
    const {user: {claimTimestamp, refStorage}, sizeLimit, rewardPerSecond, refLimit, balance, prices = []} //Некоторые контракты не имеют prices
    = await contract.methods.getStorage(id).call();

    if (Number(rewardPerSecond) === 0) throw Error("This Telegram id is not linked to any Pixel Wallet");

    return {
      [contractName]: {
        ...(upgrade && {upgrade}),
        disabled: false,
        claimTimestamp: Number(claimTimestamp),
        sizeLimit: Number(sizeLimit),
        rewardPerSecond: Number(rewardPerSecond),
        refLimit: Number(refLimit),
        refStorage: Number(refStorage),
        balance: Number(balance),
        prices: prices.map(Number)
      }
    }
  } catch(error) {
    const {message} = error.error ? error.error.cause : error; //Ответ от сервера приходит в error.error
    return {
      [contractName]: { 
        disabled: true,
        error: message
      }
    }
  }
}

async function createProfile(profile, contractName = 'all') {
  try {
    const requiredNetworks = contractName === 'all' ? networksNames : [contractsConfig[contractName].network];
    const web3 = requiredNetworks.reduce((acc, name) => {
      acc[name] = createWeb3(networks[name].rpc, profile);
      return acc;
    }, {});
    
    const contractsRequired = contractName === 'all' ? contractsNames : [contractName];
    const contracts = contractsRequired.map((name) => {
      return {
        name,
        upgrade: contractsConfig[name].upgrade, //Есть возможность улучшения или нет?
        contract: createContract(web3[contractsConfig[name].network], contractsConfig[name].contract)
      };
    });

    const id = Number.isInteger(profile.id) && profile.id ? profile.id : await getIdFromBlockchain(profile.publicKey, contracts[0].contract); //Проверка на целое число и !== 0
    const contractsData = await Promise.all( //Возвращает массив [{PXLs: {…}}, {Jade: {…}}]
      contracts.map(async ({name, upgrade, contract}) => {
        const upgradeData = upgrade ? profile[name]?.upgrade || {drill: false, storage: false} : undefined;
        return await getDataFromBlockchain(id, name, upgradeData, contract);
      })
    );
    return (
      ({error, ...restData}) => ({ //Удаление данных с помощью деструктурирующего присваивания
        ...restData,
        id,
        disabled: false,
        ...Object.assign({}, ...contractsData), //Вставка в объект. PXLs: {…}, Jade: {…}
      })
    )(profile);
  } catch(error) {
    return {
      ...profile,
      name: profile.name ?? '',
      privateKey: profile.privateKey ?? '',
      proxy: profile.proxy ?? '',
      publicKey: profile.publicKey ?? '',
      disabled: true,
      error: error.message
    }
  }
}

export async function saveProfilesData(data, contracts, password) { //[{name: '', privateKey: '', disabled: false}
  function encryptProfile(profile, password) {
    [profile.salt, profile.iv, profile.privateKey] = encrypt(profile.privateKey, password);
  }

  return await Promise.all(
    data.map(async (profile, index) => {
      if (!profile.id) {
        try {
          profile.userAgent = userAgents[getRandomInt(0, userAgents.length)];
          const web3 = createWeb3(networks.songbird.rpc, profile);
          const account = web3.eth.accounts.privateKeyToAccount(profile.privateKey);
          profile.publicKey = account.address;
          encryptProfile(profile, password);
          profile = await createProfile(profile); //Всегда возвращает профиль с данными
        } catch(error) {
          const message = error.code === 702 ? 'Incorrect Private Key' : error.message; //702 — Неверный приватный ключ
          encryptProfile(profile, password);
          profile.disabled = true;
          profile.error = message;
        }
      } else {
        encryptProfile(profile, password);
      }
      return profile;
    })
  );
}

export async function updateProfilesData(profiles, profileIndex = 'all', contractName) { //Обновление данных //Необязательные параметры — индекс профиля и название контракта
  const newProfileData = [...profiles];
  const profilesToUpdate = profileIndex === 'all' ? newProfileData : [newProfileData[profileIndex]];

  await Promise.all(
    profilesToUpdate.map(async (profile, index) => {
      if (profile.publicKey) {
        const updateIndex = profileIndex === 'all' ? index : profileIndex;
        newProfileData[updateIndex] = await createProfile(profile, contractName);
      }
    })
  );
  return newProfileData;
}

export function updateClaimSettings(profiles, claimSettings) {
  return profiles.map((profile, index) => {
    if(!claimSettings[index]) return {...profile};
    const contractsData = contractsNames.reduce((acc, name) => {
      const contractSetting = claimSettings[index][name];
      if (contractSetting) acc[name] = {...profile[name], upgrade: contractSetting};
      return acc;
    }, {});
    return {...profile, ...contractsData}
  });
}

export function disableMinerProfile(profiles, index, error, contractName) { //Отключение профилю возможности взаимодействия с контрактом
  const newProfileData = [...profiles];
  newProfileData[index] = {
    ...newProfileData[index],
    [contractName]: {
      ...newProfileData[index][contractName],
      disabled: true,
      error: error
    }
  }
  return newProfileData;
}

export function disableProfile(profiles, index, error) { //Отключение профилю возможности взаимодействия с контрактами
  const newProfileData = [...profiles];
  newProfileData[index] = {
    ...newProfileData[index],
    disabled: true,
    error: error
  }
  return newProfileData;
}

export function createWeb3(rpc, {proxy, userAgent}) { //url адрес RPC сервера, прокси и пользовательский агент профиля
  try {
    const provider = createProvider(rpc, proxy, userAgent);
    return new Web3(provider);
  } catch(error) {
    throw Error(error.message);
  }

  function createProvider(rpc, proxy, userAgent) {
    const proxyData = (() => {
      if (proxy) {
        const data = proxy.split(":");
        if (data.length !== 4) throw Error('Incorrect proxy data');
        const [ip, port, login, password] = data;
        return {
          proxy: {
            all: {
              url: ip + ':' + port,
              basicAuth: {
                username: login,
                password: password
              }
            }
          }
        }
      }
    })()

    return {
      send: async (payload, callback) => {
        try {
          if (proxyData && await proxyCheck(proxyData)) throw 'Proxy not working'; //Проверка прокси

          const response = await fetch(rpc, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-agent': userAgent
            },
            body: JSON.stringify(payload),
            ...proxyData
          }).then(data => data.json());
          callback(null, response);
        } catch (error) {
          const newError = typeof error === 'string' ? {cause: {message: await createError()}} : {...error};
          //fetch plagin возвращает строку с текстом ошибки если не получил ответа от сервера

          async function createError() {
            if (error.includes('error sending request for url')) {
              const proxyWork = await proxyCheck(proxyData);
              return proxyWork ? 'RPC Error (Try again later)' : 'Proxy not working';
            }
            return error;
          }
          callback(newError, null);
        }
      },
    };
  }
}

export function createContract(web3, {abi, address}) { //Создание экземпляра контракта
  return new web3.eth.Contract(abi, address);
}

async function proxyCheck(proxyData) { //Проверка прокси
  try {
    const response = await fetch("https://example.com", {
      ...proxyData
    });
    return true;
  } catch {
    return false;
  }
}