"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useUserStore } from "./store/user";
import Menubar from "./components/Menubar";
import Sidebar from "./components/Sidebar";

export default function BrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { initialize } = useUserStore();
  const pathname = usePathname();
  const isPetDetail = pathname?.startsWith("/pet/") ?? false;

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <main
      className={`relative mx-auto flex min-h-screen w-full ${isPetDetail ? "bg-gray-100" : ""}`}
    >
      <div className="mr-[55px] flex flex-1 flex-col p-2">
        <Menubar />
        {children}
      </div>
      <Sidebar />
    </main>
  );
}
