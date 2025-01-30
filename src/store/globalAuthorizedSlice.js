import { createSlice } from '@reduxjs/toolkit';
import { checkAuthentication } from '../utils/Functions';

const check = await checkAuthentication();

const globalAuthorizedSlice = createSlice({
  name: 'globalAuthorized',
  initialState: {
    data: check,
  },
  reducers: {
    setGlobalAuthorized(state, action) {
      state.data = action.payload;
    },
  },
});

export const { setGlobalAuthorized } = globalAuthorizedSlice.actions;
export default globalAuthorizedSlice.reducer;