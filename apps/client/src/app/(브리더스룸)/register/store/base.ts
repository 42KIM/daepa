import { StateCreator } from "zustand";
import { FieldName, FormErrors } from "../types";

export type BaseFormData = Partial<Record<FieldName, any>>;

export interface BaseFormStore {
  formData: BaseFormData;
  step: number;
  page: "register" | "detail";
  errors: FormErrors;
  setErrors: (errors: FormErrors) => void;
  setStep: (step: number) => void;
  setPage: (page: "register" | "detail") => void;
  setFormData: (data: BaseFormData | ((prev: BaseFormData) => BaseFormData)) => void;
  resetForm: () => void;
}

const initialFormData: BaseFormData = {};

/**
 * 공통 form store 생성 팩토리 함수
 * @returns zustand store hook
 */
export function createFormStore(): StateCreator<BaseFormStore> {
  return (set) => ({
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
  });
}
