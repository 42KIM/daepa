import { create } from "zustand";
import { BaseFormStore, createFormStore } from "./base";

export const usePetStore = create<BaseFormStore>(createFormStore());
