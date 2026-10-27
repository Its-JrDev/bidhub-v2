import { useState, useCallback } from 'react';

export function useAdmin() {
  const [isActive, setIsActive] = useState<boolean>(false);

  const toggle = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  return {
    isActive,
    toggle,
  };
}
