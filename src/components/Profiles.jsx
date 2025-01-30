import { useState } from "react";
import { ProfilesAuthentication, ProfilesForm } from './index.jsx';
import { decrypt } from '../utils/Functions';
import { useSelector } from 'react-redux';
import { updateProfiles, disableMiner } from '../store/profilesSlice';

export default function Profiles({setLoading, changePage}) {
  const profilesData = useSelector((state) => state.profilesData.profiles);
  const password = useSelector((state) => state.password.data);
  const [authorized, setAuthorized] = useState(false);

  function decryptProfiles() {
    return profilesData.length 
      ? profilesData.map(profile => {
          try {
            return {
              ...profile,
              privateKey: decrypt(profile.privateKey, profile.salt, profile.iv, password)
            }
          } catch {
            return {
              ...profile
            }
          }
        })
      : [{name: '', privateKey: '', proxy: '', disabled: false}];
  }

  return (
    <>
      {authorized || !profilesData.length
       ? <ProfilesForm profilesData={decryptProfiles()} setLoading={setLoading} changePage={changePage} password={password} />
       : <ProfilesAuthentication setAuthorized={setAuthorized} />
      }
    </>
  );
}