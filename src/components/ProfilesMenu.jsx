import { useState, useEffect, memo } from "react";

function ProfilesMenu({error, addProfile}) {
  const [alpha, setAlpha] = useState(0);
  const [fixedMenu, setFixedMenu] = useState('');
  
  const handleScroll = () => {
    const position = window.pageYOffset;
    if (position > 172) {
      setAlpha(Math.min(1, 1 - (214 - position) / 42)); //Плавное изменение прозрачности background
      setFixedMenu('form__menu_fixed'); //Зафиксировать элемент
    } else {
      setAlpha(0);
      setFixedMenu('');
    }
  };
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
  
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className={`form__menu ${fixedMenu}`} style={{background: `rgba(47, 47, 47, ${alpha})`}}>
      <div className="form__menu-container">
        <p className={`form__error ${error.class}`}>{error.message}</p>
        <button className="button form__add" onClick={addProfile} type="button"></button>
      </div>
    </div>
  );
}

export default memo(ProfilesMenu);