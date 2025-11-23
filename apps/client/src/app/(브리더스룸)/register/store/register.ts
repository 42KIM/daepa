import { create } from "zustand";
import { BaseFormStore, createFormStore } from "./base";

// 타입 별칭으로 기존 코드와의 호환성 유지
export type RegisterStore = BaseFormStore;

export const useRegisterStore = create<RegisterStore>(createFormStore());
