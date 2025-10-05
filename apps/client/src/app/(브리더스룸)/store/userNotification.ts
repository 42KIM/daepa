import { UserNotificationDto } from "@repo/api-client";
import { create } from "zustand";

interface UserNotificationState {
  notification: UserNotificationDto | null;
  setNotification: (notification: UserNotificationDto | null) => void;
}

const createUserNotificationStore = () =>
  create<UserNotificationState>((set) => ({
    notification: null,
    setNotification: (notification: UserNotificationDto | null) => set({ notification }),
  }));

const useUserNotificationStore = createUserNotificationStore();

export default useUserNotificationStore;
