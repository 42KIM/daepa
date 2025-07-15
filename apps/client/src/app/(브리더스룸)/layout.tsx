"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/AppSidebar";
import NotiButton from "./noti/components/NotiButton";
import UserButton from "../(user)/UserButton";
import { useEffect } from "react";
import { useUser } from "./hooks/useUser";

export default function BrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { initialize, isInitialized } = useUser();

  useEffect(() => {
    // 브리더스룸 레이아웃 마운트 시 한 번만 초기화
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return (
    <>
      <AppSidebar />
      <main className="min-h-screen w-full p-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <NotiButton />
          </div>
          <div>
            <UserButton />
          </div>
        </div>
        {children}
      </main>
    </>
  );
}
