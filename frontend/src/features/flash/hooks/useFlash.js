import { useContext } from 'react';
import { FlashContext } from '../flash.context';

export const useFlash = () => {
  const context = useContext(FlashContext);

  if (!context) {
    throw new Error('useFlash must be used inside FlashProvider');
  }

  return context;
};
