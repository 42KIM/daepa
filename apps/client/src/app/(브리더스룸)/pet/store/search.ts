import { create } from "zustand";
import { BrPetControllerFindAllParams } from "@repo/api-client";

interface SearchState {
  searchFilters: Partial<BrPetControllerFindAllParams>;
  setSearchFilters: (filters: Partial<BrPetControllerFindAllParams>) => void;
}

const createSearchStore = () =>
  create<SearchState>((set) => ({
    searchFilters: {},
    setSearchFilters: (filters) => set({ searchFilters: filters }),
  }));

const useSearchStore = createSearchStore();

export default useSearchStore;
