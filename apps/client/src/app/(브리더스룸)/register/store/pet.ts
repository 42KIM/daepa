import { create } from "zustand";
import { BaseFormStore, FormData, createFormStore } from "./base";

// 타입 별칭으로 기존 코드와의 호환성 유지
export type FormStore = BaseFormStore;
// FormData를 re-export하여 기존 import 경로와의 호환성 유지
export type { FormData };

export const usePetStore = create<FormStore>(createFormStore());
