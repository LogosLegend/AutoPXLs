import { createSlice } from '@reduxjs/toolkit';

const passwordSlice = createSlice({
  name: 'password',
  initialState: {
    data: '',
  },
  reducers: {
    setPassword(state, action) {
      state.data = action.payload;
    },
  },
});

export const { setPassword } = passwordSlice.actions;
export default passwordSlice.reducer;