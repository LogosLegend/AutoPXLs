import { useState, useEffect } from 'react';
import "./App.css";
import { MainAuthentication, ResetPassword, MinerApp } from './components';
import CryptoJS from 'crypto-js';

window.addEventListener("contextmenu", (e) => {e.preventDefault()}); //Отключение всплывающего меню после нажатии правой кнопки мыши

function App() {
  const [authorized, setAuthorized] = useState(false);
  const [value, setValue] = useState('');
  const [page, setPage] = useState('authentication');

  useEffect(() => {
    !authorized && setValue('');
  }, [authorized]);

  function encrypt(data, password=value) {
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
  
  function decrypt(encryptedData, saltHex, ivHex, password=value) {
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

  function reset() {
    localStorage.clear();
    setPage('authentication');
  }

  function authorization() {
    // return <MinerApp encrypt={encrypt} decrypt={decrypt} />
    if (authorized) return <MinerApp encrypt={encrypt} decrypt={decrypt} setAuthorized={setAuthorized} />
    if (page === 'authentication') {
      return <MainAuthentication
        value={value}
        setValue={setValue}
        setAuthorized={setAuthorized}
        setPage={setPage}
      />
    }
    return <ResetPassword reset={reset} setPage={setPage}/>
  }

  return authorization();
}
export default App;