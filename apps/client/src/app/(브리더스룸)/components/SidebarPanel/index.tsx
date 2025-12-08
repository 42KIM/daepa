"use client";

import { cn } from "@/lib/utils";
import NotificationList from "./알림";

interface SidebarPanelProps {
  isOpen: boolean;
  type?: "알림" | "최근 본";
}

const SidebarPanel = ({ isOpen, type }: SidebarPanelProps) => {
  return (
    <div
      className={cn(
        "fixed right-[55px] top-0 h-full w-[315px] border-x bg-gray-100 shadow-lg transition-transform duration-300",
        isOpen ? "translate-x-0" : "translate-x-[315px]",
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold">{type}</h2>
        </div>

        {isOpen && type === "알림" && <NotificationList />}
      </div>
    </div>
  );
};

export default SidebarPanel;
