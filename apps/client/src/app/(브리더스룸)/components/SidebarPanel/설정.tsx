"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { overlay } from "overlay-kit";
import Dialog from "../../components/Form/Dialog";
import { useUserStore } from "../../store/user";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";

const SettingList = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const { theme, setTheme } = useTheme();
  const { logout } = useLogout();

  const handleThemeChange = (isDark: boolean) => {
    setTheme(isDark ? "dark" : "light");
  };
  return (
    <ScrollArea className="h-full flex-1 pb-[60px]">
      <div className="flex flex-col p-4 pt-0">
        <Button
          type="button"
          variant="outline"
          className="group mb-4 w-full justify-between rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800"
          onClick={() => router.push("/settings")}
        >
          <span>전체 설정 보기</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>

        {/* 계정 정보 */}
        <div className="mb-6 text-sm">
          <h3 className="mb-3 font-semibold text-gray-700 dark:text-gray-400">계정 정보</h3>

          <Item label="닉네임" content={user?.name} />
          <Item label="이메일" content={user?.email} />
        </div>

        <Separator className="my-4" />

        <div className="mb-6 text-sm">
          <h3 className="mb-3 font-semibold text-gray-700 dark:text-gray-400">앱 설정</h3>

          <Item
            label="다크모드"
            content={<Switch checked={theme === "dark"} onCheckedChange={handleThemeChange} />}
          />
        </div>

        <Separator className="my-4" />

        <button
          type="button"
          className="mb-4 w-full justify-start gap-2 text-sm text-gray-600 dark:text-gray-400"
          onClick={() => {
            overlay.open(({ isOpen, close, unmount }) => (
              <Dialog
                title="로그아웃"
                description="정말 로그아웃 하시겠습니까?"
                onExit={unmount}
                isOpen={isOpen}
                onCloseAction={close}
                onConfirmAction={() => {
                  logout();
                  close();
                }}
              />
            ));
          }}
        >
          로그아웃
        </button>

        {/* 도움말 섹션 */}
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-neutral-800">
          <h4 className="mb-2 text-sm font-semibold text-blue-900 dark:text-neutral-300">
            도움이 필요하신가요?
          </h4>
          <p className="text-blue-70 text-xs dark:text-neutral-400">
            문의사항이 있으시면 고객센터로 연락해주세요.
          </p>
        </div>
      </div>
    </ScrollArea>
  );
};

export default SettingList;

export const Item = ({
  label,
  content,
}: {
  label?: string;
  content?: string | React.ReactNode;
}) => {
  return (
    <div className="flex justify-between">
      <div className="text-gray-600 dark:text-gray-400">{label}</div>
      <div>{content}</div>
    </div>
  );
};
