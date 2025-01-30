import { useState } from 'react';
export default function Popup({setIsOpenPopup, children}) {
  const [onMouseDownPopup, setOnMouseDownPopup] = useState(false);
  const [onMouseHoverPopup, setOnMouseHoverPopup] = useState(false);

  function didEventInPopup(event) {
    return !event.target.closest('.popup__container');
  }

  function onMousePointing(event) { //Изменение цвета кнопки при наведении на задний фон попапа
    if (didEventInPopup(event)) {
      setOnMouseHoverPopup(true);
    } else {
      setOnMouseHoverPopup(false);
    }
  }

  function closePopup(event) {
    (didEventInPopup(event) && onMouseDownPopup) && setIsOpenPopup(false); 
  }

  function onMouseDown(event) {
    setOnMouseDownPopup(didEventInPopup(event))
  }

  return (
    <div className="popup" onMouseOver={onMousePointing} onMouseOut={onMousePointing} onMouseDown={onMouseDown} onMouseUp={closePopup}>
      <button className={'popup__button-close' + (onMouseHoverPopup ? ' popup__button-close_active' : '')}></button>
      <div className="popup__container">
        {children}
      </div>
    </div>
  );
}