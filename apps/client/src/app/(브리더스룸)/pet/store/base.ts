import { StateCreator } from "zustand";
import { FormFieldName, BaseFormErrors } from "../types/form.type";

export type BaseFormData = Partial<Record<FormFieldName, any>>;

export interface BaseFormStore {
  formData: BaseFormData;
  step: number;
  errors: BaseFormErrors;
  setErrors: (errors: BaseFormErrors) => void;
  setStep: (step: number) => void;
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
    step: 0,
    setErrors: (errors) => set({ errors }),
    setStep: (step) => set({ step }),
    setFormData: (data) =>
      set((state) => ({
        formData: typeof data === "function" ? data(state.formData) : data,
      })),
    resetForm: () => set({ formData: initialFormData, errors: {}, step: 0 }),
  });
}
