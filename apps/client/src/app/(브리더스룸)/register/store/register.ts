import { create } from "zustand";
import { BaseFormStore, createFormStore } from "./base";

export const useRegisterStore = create<BaseFormStore>(createFormStore());
