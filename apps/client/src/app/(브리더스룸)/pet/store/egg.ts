import { create } from "zustand";
import { BaseFormStore, createFormStore } from "./base";

export const useEggStore = create<BaseFormStore>(createFormStore());
