import React, { createContext, useEffect, useRef, useState } from 'react';

export const FlashContext = createContext();

const FlashProvider = ({ children }) => {
  const [flash, setFlash] = useState(null);
  const timerRef = useRef(null);

  const clearFlash = () => {
    setFlash(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const showFlash = (message, type = 'success', duration = 2500) => {
    if (!message) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setFlash({ message, type, duration });

    timerRef.current = setTimeout(() => {
      setFlash(null);
      timerRef.current = null;
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <FlashContext.Provider value={{ flash, showFlash, clearFlash }}>
      {children}
    </FlashContext.Provider>
  );
};

export default FlashProvider;
