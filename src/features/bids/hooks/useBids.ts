import { useState, useCallback } from 'react';

export function useBids() {
  const [isActive, setIsActive] = useState<boolean>(false);

  const toggle = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  return {
    isActive,
    toggle,
  };
}
