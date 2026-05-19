import { createContext, useContext, useState } from "react";

type CoinsContextType = {
  balance: number;
  add: (n: number) => void;
  spend: (n: number) => boolean; // returns false if insufficient
};

const CoinsContext = createContext<CoinsContextType>({
  balance: 0,
  add: () => {},
  spend: () => false,
});

export function CoinsProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(500);

  function add(n: number) {
    setBalance((b) => b + n);
  }

  function spend(n: number) {
    if (balance < n) return false;
    setBalance((b) => b - n);
    return true;
  }

  return (
    <CoinsContext.Provider value={{ balance, add, spend }}>
      {children}
    </CoinsContext.Provider>
  );
}

export const useCoins = () => useContext(CoinsContext);
