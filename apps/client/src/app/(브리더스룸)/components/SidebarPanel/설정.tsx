"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { overlay } from "overlay-kit";
import Dialog from "../../components/Form/Dialog";
import { useUserStore } from "../../store/user";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";

const SettingList = () => {
  const { user } = useUserStore();
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (isDark: boolean) => {
    setTheme(isDark ? "dark" : "light");
  };

  const handleLogout = async () => {
    // TODO: 로그아웃 로직
  };
  return (
    <ScrollArea className="h-full flex-1 pb-[60px]">
      <div className="flex flex-col p-4">
        {/* 계정 정보 */}
        <div className="mb-6 text-sm">
          <h3 className="mb-3 font-semibold text-gray-700">계정 정보</h3>

          <Item label="닉네임" content={user?.name} />
          <Item label="이메일" content={user?.email} />
        </div>

        <Separator className="my-4" />

        <div className="mb-6 text-sm">
          <h3 className="mb-3 font-semibold text-gray-700">앱 설정</h3>

          <Item
            label="다크모드"
            content={<Switch checked={theme === "dark"} onCheckedChange={handleThemeChange} />}
          />
        </div>

        <Separator className="my-4" />

        <button
          type="button"
          className="mb-1 w-full justify-start gap-2 text-sm text-gray-600"
          onClick={() => {
            overlay.open(({ isOpen, close, unmount }) => (
              <Dialog
                title="로그아웃"
                description="정말 로그아웃 하시겠습니까?"
                onExit={unmount}
                isOpen={isOpen}
                onCloseAction={close}
                onConfirmAction={() => {
                  handleLogout();
                  close();
                }}
              />
            ));
          }}
        >
          로그아웃
        </button>

        {/* 도움말 섹션 */}
        <div className="rounded-lg bg-blue-50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-blue-900">도움이 필요하신가요?</h4>
          <p className="text-xs text-blue-700">문의사항이 있으시면 고객센터로 연락해주세요.</p>
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
      <div className="text-gray-600">{label}</div>
      <div>{content}</div>
    </div>
  );
};
