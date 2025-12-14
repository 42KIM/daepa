import { create } from "zustand";
import { AdoptionDtoStatus } from "@repo/api-client";

interface Adoption {
  petId?: string;
  price?: number;
  status?: AdoptionDtoStatus;
}

interface AdoptionStore {
  adoption: Adoption;

  setAdoption: (adoption: Adoption) => void;
}

export const useAdoptionStore = create<AdoptionStore>((set) => ({
  adoption: {},

  setAdoption: (adoption) => set({ adoption }),
}));
