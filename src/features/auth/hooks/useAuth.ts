import { useState, useCallback } from 'react';

export function useAuth() {
  const [isActive, setIsActive] = useState<boolean>(false);

  const toggle = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  return {
    isActive,
    toggle,
  };
}
