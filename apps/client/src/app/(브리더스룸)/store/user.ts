import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserProfileDto } from "@repo/api-client";

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

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
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
          // API 호출
          const response = await fetch("/api/v1/user/profile", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });

          if (!response.ok) {
            throw new Error("사용자 정보를 가져오는데 실패했습니다.");
          }

          const userData: UserProfileDto = await response.json();
          set({
            user: userData,
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
    }),
    {
      name: "br-user-storage", // 브리더스룸 전용 localStorage 키
      partialize: (state) => ({
        user: state.user,
        isInitialized: state.isInitialized,
      }), // user와 isInitialized만 저장
    },
  ),
);
