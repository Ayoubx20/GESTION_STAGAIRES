import React, { createContext, useState, useContext, useEffect } from 'react';

const AntigravityContext = createContext();

export const useAntigravity = () => {
  const context = useContext(AntigravityContext);
  if (!context) {
    throw new Error('useAntigravity must be used within an AntigravityProvider');
  }
  return context;
};

export const AntigravityProvider = ({ children }) => {
  const [isAntigravityActive, setIsAntigravityActive] = useState(false);

  const toggleAntigravity = () => {
    setIsAntigravityActive((prev) => !prev);
  };

  const value = {
    isAntigravityActive,
    setIsAntigravityActive,
    toggleAntigravity,
  };

  return (
    <AntigravityContext.Provider value={value}>
      {children}
    </AntigravityContext.Provider>
  );
};
