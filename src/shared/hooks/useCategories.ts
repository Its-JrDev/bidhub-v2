'use client';

import { useState, useEffect } from 'react';

export interface CategoryItem {
  id: string;
  name: string;
  description?: string | null;
  _count?: {
    auctions: number;
  };
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/categories')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json?.data) {
          setCategories(json.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { categories, loading };
}
