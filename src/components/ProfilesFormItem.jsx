import { memo } from "react";

function ProfilesFormItem({index, name, privateKey, error, removeProfile, changeName, changePrivateKey}) {
  return (
    <div className="form__container">
      <input
        className="form__name"
        value={name}
        onChange={(e) => changeName(index, e.target.value)}
        autoComplete="off"
        aria-autocomplete="none"
        placeholder="Name"
      />
      <input
        className={`form__privateKey ${error ?? ''}`}
        value={privateKey}
        onChange={(e) => changePrivateKey(index, e.target.value)}
        autoComplete="off"
        aria-autocomplete="none"
        placeholder="Private key"
      />
      <button className="button form__delete" type="button" onClick={() => removeProfile(index)}></button>
    </div>
  );
}

export default memo(ProfilesFormItem);