import React, { createContext, useState, ReactNode, useContext } from 'react';

type SetType = 'set1' | 'set2' | 'encore';

interface ScrollContextType {
  scrollToSet: (setType: SetType) => void;
  triggerScroll: Record<SetType, boolean>;
  resetTrigger: (setType: SetType) => void;
}

const ScrollContext = createContext<ScrollContextType>({
  scrollToSet: () => {},
  triggerScroll: {
    set1: false,
    set2: false,
    encore: false
  },
  resetTrigger: () => {}
});

export const useScroll = () => useContext(ScrollContext);

interface ScrollProviderProps {
  children: ReactNode;
}

export function ScrollProvider({ children }: ScrollProviderProps) {
  const [triggerScroll, setTriggerScroll] = useState<Record<SetType, boolean>>({
    set1: false,
    set2: false,
    encore: false
  });

  const scrollToSet = (setType: SetType) => {
    setTriggerScroll(prev => ({
      ...prev,
      [setType]: true
    }));
  };

  const resetTrigger = (setType: SetType) => {
    setTriggerScroll(prev => ({
      ...prev,
      [setType]: false
    }));
  };

  return (
    <ScrollContext.Provider value={{ 
      scrollToSet, 
      triggerScroll,
      resetTrigger 
    }}>
      {children}
    </ScrollContext.Provider>
  );
}