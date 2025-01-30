import { configureStore } from '@reduxjs/toolkit';
import globalAuthorizedSlice from './globalAuthorizedSlice';
import passwordSlice from './passwordSlice';
import authorizedSlice from './authorizedSlice';
import profilesSlice from './profilesSlice';
import pageSlice from './pageSlice';

const store = configureStore({
  reducer: {
  	globalAuthorized: globalAuthorizedSlice,
  	password: passwordSlice,
  	authorized: authorizedSlice,
    profilesData: profilesSlice,
    page: pageSlice,
  },
});

export default store;