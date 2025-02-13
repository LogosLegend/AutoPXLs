import init from "./init"; //Fix - ReferenceError: global is not defined
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from 'react-redux';
import store from './store/store.js';
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
	<Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
