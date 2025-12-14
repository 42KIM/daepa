"use client";

import Link from "next/link";
import { useUserStore } from "../store/user";

const UserButton = () => {
  const { user } = useUserStore();

  if (user && !!user.userId) return null;

  return (
    <Link
      className="flex h-[32px] items-center rounded-lg bg-blue-600 px-2 text-[14px] font-bold text-gray-100 hover:font-bold dark:bg-black/80 dark:text-white dark:hover:font-bold"
      href="/sign-in"
    >
      로그인
    </Link>
  );
};

export default UserButton;
