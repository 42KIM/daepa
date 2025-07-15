import { useEffect } from "react";
import { useUserStore } from "../store/user";

export const useUser = () => {
  const { user, isInitialized, isLoading, error, initialize } = useUserStore();

  useEffect(() => {
    // 브리더스룸 진입 시 한 번만 초기화
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  return {
    user,
    isLoading,
    error,
    initialize,
    isInitialized,
  };
};
