import { Web3 } from 'web3';
import AbiPXLs from './abiPXLs.js'
import AbiPXLsChest from './abiPXLsChest.js'

export const web3 = new Web3("https://songbird.solidifi.app/ext/C/rpc");
web3.eth.transactionBlockTimeout = 150;
web3.eth.transactionPollingTimeout = 3000;

const PXLsAddress = '0x7B3D7cfEe6BD2B3042B8F04D90b137D9Ed06Ea74';
export const PXLsContract = new web3.eth.Contract(AbiPXLs, PXLsAddress);

const PXLsChestAddress = '0x16Eba4fa780d915251e57190231327C775c97F3d';
export const PXLsChestContract = new web3.eth.Contract(AbiPXLsChest, PXLsChestAddress);

export const tokenDivider = 10e17;

export const inputErrors = {
  incorrectPassword: 'Incorrect current password',
  emptyField: 'Fill empty fields',
  internalError: 'Internal error, restart app',
}

export const profilesErrors = {
  duplicatedError: {
  	class: 'form__duplicated',
  	message: 'Delete duplicate private keys'
  },
  emptyError: {
    class: 'form__empty',
    message: 'Delete empty profiles'
  },
}