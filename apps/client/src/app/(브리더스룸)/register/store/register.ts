import { create } from "zustand";
import { FieldName, FormErrors } from "../types";

export type RegisterFormData = Partial<Record<FieldName, any>>;
export interface RegisterStore {
  formData: RegisterFormData;
  step: number;
  page: "register" | "detail";
  errors: FormErrors;
  setErrors: (errors: FormErrors) => void;
  setStep: (step: number) => void;
  setPage: (page: "register" | "detail") => void;
  setFormData: (data: RegisterFormData | ((prev: RegisterFormData) => RegisterFormData)) => void;
  resetForm: () => void;
}

const initialFormData: RegisterFormData = {};

export const useRegisterStore = create<RegisterStore>((set) => ({
  formData: initialFormData,
  errors: {},
  page: "register",
  step: 0,
  setErrors: (errors) => set({ errors }),
  setStep: (step) => set({ step }),
  setPage: (page) => set({ page }),
  setFormData: (data) =>
    set((state) => ({
      formData: typeof data === "function" ? data(state.formData) : data,
    })),
  resetForm: () => set({ formData: initialFormData, errors: {}, step: 0 }),
}));
