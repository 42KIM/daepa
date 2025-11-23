import { create } from "zustand";

import { DUPLICATE_CHECK_STATUS } from "../constants";

interface nameStore {
  duplicateCheckStatus: (typeof DUPLICATE_CHECK_STATUS)[keyof typeof DUPLICATE_CHECK_STATUS];

  setDuplicateCheckStatus: (
    duplicateCheckStatus: (typeof DUPLICATE_CHECK_STATUS)[keyof typeof DUPLICATE_CHECK_STATUS],
  ) => void;
}

export const useNameStore = create<nameStore>()((set) => ({
  duplicateCheckStatus: DUPLICATE_CHECK_STATUS.NONE,
  setDuplicateCheckStatus: (duplicateCheckStatus) => set({ duplicateCheckStatus }),
}));
