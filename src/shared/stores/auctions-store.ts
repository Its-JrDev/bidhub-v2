import { create } from 'zustand';

export interface AuctionsState {
  categoryId: string;
  status: string;
  search: string;
  setCategoryId: (id: string) => void;
  setStatus: (status: string) => void;
  setSearch: (query: string) => void;
  reset: () => void;
}

export const useAuctionsStore = create<AuctionsState>((set) => ({
  categoryId: '',
  status: 'ALL',
  search: '',
  setCategoryId: (categoryId) => set({ categoryId }),
  setStatus: (status) => set({ status }),
  setSearch: (search) => set({ search }),
  reset: () => set({ categoryId: '', status: 'ALL', search: '' }),
}));
