import "./App.css";
import { GlobalAuthentication } from './components';
import { MainAuthentication, ResetPassword, MinerApp } from './components';
import { useSelector } from 'react-redux';

window.addEventListener("contextmenu", (e) => e.preventDefault()); //Отключение меню, появляющегося после нажатии правой кнопки мыши

function App() {
  const globalAuthorized = useSelector(state => state.globalAuthorized.data);
  const authorized = useSelector(state => state.authorized.data);
  const page = useSelector(state => state.page.data);

  if (!globalAuthorized) return <GlobalAuthentication />
  if (authorized) return <MinerApp />
  if (page === 'authentication') return <MainAuthentication />
  return <ResetPassword />
}
export default App;