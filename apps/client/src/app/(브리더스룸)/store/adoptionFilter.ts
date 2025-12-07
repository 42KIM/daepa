import { create } from "zustand";
import { AdoptionControllerGetAllAdoptionsParams } from "@repo/api-client";
import { FilterStore } from "./filter";

export const useAdoptionFilterStore = create<
  FilterStore<AdoptionControllerGetAllAdoptionsParams>
>()((set) => ({
  searchFilters: {
    species: "CR",
  },

  // Actions
  setSearchFilters: (filters) => set({ searchFilters: filters }),
  resetFilters: () => set({ searchFilters: {} }),
}));
