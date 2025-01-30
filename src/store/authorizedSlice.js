import { createSlice } from '@reduxjs/toolkit';

const authorizedSlice = createSlice({
  name: 'authorized',
  initialState: {
    data: false,
  },
  reducers: {
    setAuthorized(state, action) {
      state.data = action.payload;
    },
  },
});

export const { setAuthorized } = authorizedSlice.actions;
export default authorizedSlice.reducer;