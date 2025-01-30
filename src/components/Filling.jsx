import { useState, useEffect } from "react";

export default function Filling({claimTimestamp, size, fillingTime, tokenColor}) {
  const [timestamp, setTimestamp] = useState(Math.round(Date.now() / 1000));
  const percent = Math.min(1, Math.max(0, (timestamp - claimTimestamp) / fillingTime)); //Сколько времени заполняется хранилище? Насколько % заполнено хранилище?

  const currentSize = (percent * size).toFixed(4);
  const currentSizeWidth = percent * 122 + 'px';

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Math.round(Date.now() / 1000));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []); //Счётчик заполнения

  return (
    <>
      <div className="profile__filling" style={{width: currentSizeWidth, background: tokenColor}}></div>
      <p className="profile__progress-text">{currentSize}</p>
    </>
  )
}