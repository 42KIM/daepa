import { ChevronsLeft, Clock7, Mail, Settings } from "lucide-react";
import { useState } from "react";
import SidebarPanel from "./SidebarPanel";
import { cn } from "@/lib/utils";

type SIDEBAR_TYPE = "알림" | "최근 본" | "설정";

const Sidebar = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [type, setType] = useState<SIDEBAR_TYPE>("알림");

  const handleClickSidebarItem = (selectedType: SIDEBAR_TYPE) => {
    setType(selectedType);
    if (isNotificationOpen && type !== selectedType) {
      return;
    }
    setIsNotificationOpen((prev) => !prev);
  };

  return (
    <>
      <div className="z-100 fixed right-0 flex h-full w-[55px] flex-col items-center gap-2 bg-gray-100 dark:bg-black">
        <SidebarItem
          icon={
            <ChevronsLeft
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              className={cn(
                "h-7 w-7 text-gray-500 transition-transform duration-300 dark:text-neutral-400",
                isNotificationOpen && "rotate-180",
              )}
            />
          }
        />
        <SidebarItem
          icon={
            <Mail
              className="text-gray-500 dark:text-neutral-400"
              onClick={() => handleClickSidebarItem("알림")}
            />
          }
          label="알림"
          selected={isNotificationOpen && type === "알림"}
        />
        <SidebarItem
          icon={
            <Clock7
              onClick={() => handleClickSidebarItem("최근 본")}
              className="text-gray-500 dark:text-neutral-400"
            />
          }
          label="최근 본"
          selected={isNotificationOpen && type === "최근 본"}
        />

        <SidebarItem
          icon={
            <Settings
              onClick={() => handleClickSidebarItem("설정")}
              className="text-gray-500 dark:text-neutral-400"
            />
          }
          label="설정"
          selected={isNotificationOpen && type === "설정"}
        />
      </div>
      <SidebarPanel type={type} isOpen={isNotificationOpen} />
    </>
  );
};

export default Sidebar;

const SidebarItem = ({
  icon,
  label,
  selected,
}: {
  icon: React.ReactNode;
  label?: string;
  selected?: boolean;
}) => {
  return (
    <div className="flex h-[64px] items-center justify-center">
      <button type="button" className="flex flex-col items-center">
        <div
          className={cn(
            "rounded-lg p-2 hover:bg-gray-200 dark:hover:bg-neutral-800",
            selected && "bg-gray-200 dark:bg-neutral-800",
          )}
        >
          {icon}
        </div>
        <span className="text-[12px] font-[500] text-gray-500 dark:text-neutral-400">{label}</span>
      </button>
    </div>
  );
};
