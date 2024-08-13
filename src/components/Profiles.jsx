import { useState } from "react";
import { ProfilesAuthentication, ProfilesForm } from './index.jsx';

export default function Profiles({decrypt, profilesData, saveData}) {
  const [authorized, setAuthorized] = useState(false);

  function decryptProfiles() {
    return profilesData.length 
      ? profilesData.map(profile => ({
          ...profile,
          privateKey: decrypt(profile.privateKey, profile.salt, profile.iv)
        }))
      : [{name: '', privateKey: '', disabled: false}];
  }

  return (
    <>
      {authorized || !profilesData.length
       ? <ProfilesForm profilesData={decryptProfiles()} saveData={saveData} />
       : <ProfilesAuthentication setAuthorized={setAuthorized} />
      }
    </>
  );
}