import { create } from "zustand";
import { userControllerGetUserProfile, UserProfileDto } from "@repo/api-client";

interface UserState {
  user: UserProfileDto | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UserActions {
  setUser: (user: UserProfileDto) => void;
  clearUser: () => void;
  setInitialized: (initialized: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initialize: () => Promise<void>;
}

type UserStore = UserState & UserActions;

export const useUserStore = create<UserStore>()((set, get) => ({
  // State
  user: null,
  isInitialized: false,
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) => set({ user, error: null }),
  clearUser: () => set({ user: null, error: null, isInitialized: false }),
  setInitialized: (initialized) => set({ isInitialized: initialized }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // 초기화 함수
  initialize: async () => {
    const { isInitialized, user } = get();

    // 이미 초기화되었거나 사용자 정보가 있으면 스킵
    if (isInitialized || user) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        set({
          error: "토큰이 없습니다.",
          isInitialized: true,
        });
        return;
      }

      const { data, status } = await userControllerGetUserProfile();

      if (status !== 200) {
        throw new Error("사용자 정보를 가져오는데 실패했습니다.");
      }

      set({
        user: data,
        isInitialized: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
        isLoading: false,
        isInitialized: true, // 에러가 발생해도 초기화는 완료로 처리
      });
    }
  },
}));
