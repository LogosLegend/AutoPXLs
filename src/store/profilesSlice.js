import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { jsonCheck, saveProfilesData, updateProfilesData, updateClaimSettings, disableMinerProfile, disableProfile } from '../utils/Functions';

export const saveProfiles = createAsyncThunk('profiles/saveProfiles', async (data, {getState}) => {
  return await saveProfilesData(data, getState().profilesData.contracts, getState().password.data); //Данные профилей и пароль
});

export const updateProfiles = createAsyncThunk('profiles/updateProfiles', async ([index, contractName], {getState}) => { //индекс и имя контракта необязательные параметры
  return await updateProfilesData(getState().profilesData.profiles, index, contractName); //Текущие данные, индекс профиля и имя майнера
});

export const disableMiner = createAsyncThunk('profiles/disableMiner', async ([index, error, contractName], {getState}) => {
  return await disableMinerProfile(getState().profilesData.profiles, index, error, contractName); //Текущие данные, индекс, ошибка и имя контракта
});

export const disable = createAsyncThunk('profiles/disable', async ([index, error], {getState}) => {
  return await disableProfile(getState().profilesData.profiles, index, error); //Текущие данные, индекс и ошибка
});

const checkedProfiles = jsonCheck(localStorage.getItem('profilesData'));

const profilesDataSlice = createSlice({
  name: 'profilesData',
  initialState: {
    profiles: checkedProfiles,
  },
  reducers: {
    setProfiles(state, action) {
      state.profiles = action.payload;
      localStorage.setItem('profilesData', JSON.stringify(action.payload));
    },
    setClaimSettings(state, action) {
      const newProfilesData = updateClaimSettings(state.profiles, action.payload);
      state.profiles = newProfilesData;
      localStorage.setItem('profilesData', JSON.stringify(newProfilesData));
    },
  },
  extraReducers: (builder) => {
    function handleFulfilled(state, action) {
      state.profiles = action.payload;
      localStorage.setItem('profilesData', JSON.stringify(action.payload));
    }

    const handleRejected = (state, action) => {
      console.error(action.error);
    };

    builder
      .addCase(saveProfiles.fulfilled, handleFulfilled)
      .addCase(updateProfiles.fulfilled, handleFulfilled)
      .addCase(disableMiner.fulfilled, handleFulfilled)
      .addCase(disable.fulfilled, handleFulfilled)

      .addCase(saveProfiles.rejected, handleRejected)
      .addCase(updateProfiles.rejected, handleRejected)
      .addCase(disableMiner.rejected, handleRejected)
      .addCase(disable.rejected, handleRejected)
  },
});

export const { setProfiles, setClaimSettings } = profilesDataSlice.actions;
export default profilesDataSlice.reducer;