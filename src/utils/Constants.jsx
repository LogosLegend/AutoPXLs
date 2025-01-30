import { Web3 } from 'web3';
import AbiPXLs from './abi/AbiPXLs';
import AbiPXLsChest from './abi/AbiPXLsChest';
import AbiJade from './abi/AbiJade';
import PXLsImage from '/PXLsImg.png';
import JadeImage from '/JadeImg.png';

export const projectId = "671d1c5000253ccb52e9";

export const inputErrors = {
  incorrectData: 'Incorrect login or password',
  incorrectPassword: 'Incorrect current password',
  unknownAuthError: 'Authorization error, try again later',
  manyAttempts: 'Many login attempts, try again later',
  emptyField: 'Fill empty fields',
  internalError: 'Internal error, restart app',
};

export const profilesErrors = {
  duplicatedError: {
    class: 'form__duplicated',
    message: 'Delete duplicate private keys'
  },
  emptyError: {
    class: 'form__empty',
    message: 'Delete empty profiles'
  },
};

export const networks = {
  songbird: {
    name: "songbird",
    rpc: "https://songbird-api.flare.network/ext/C/rpc"
  }
}

export const contractsConfig = {
  PXLs: {
    network: "songbird",
    contract: {
      abi: AbiPXLs,
      address: "0x7B3D7cfEe6BD2B3042B8F04D90b137D9Ed06Ea74"
    },
    chest: {
      abi: AbiPXLsChest,
      address: "0x16Eba4fa780d915251e57190231327C775c97F3d"
    },
    upgrade: true,
    referals: true
  },
  Jade: {
    network: "songbird",
    contract: {
      abi: AbiJade,
      address: "0xf4e4697Cc38f73B334daE3D41cAcAC489eFF3439"
    },
    upgrade: false,
    referals: false
  }
}

const songbirdExplorer = "https://songbird-explorer.flare.network/address/";

export const contractsInfo = [{
  name: "PXLs",
  image: PXLsImage,
  color: "#8527d4",
  explorer: songbirdExplorer,
  divider: 1e18
}, {
  name: "Jade",
  image: JadeImage,
  color: "#48a828",
  explorer: songbirdExplorer,
  divider: 1e18
}]