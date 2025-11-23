import { create } from "zustand";
import { BaseFormStore, createFormStore } from "./base";

export const useRegisterPetStore = create<BaseFormStore>(createFormStore());
