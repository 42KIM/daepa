"use client";

import { useRouter } from "next/navigation";

const UserButton = () => {
  const router = useRouter();
  const isLoggedIn = localStorage.getItem("accessToken");

  const handleClick = () => {
    if (isLoggedIn) {
      localStorage.removeItem("accessToken");
      router.push("/sign-in");
    } else {
      router.push("/sign-in");
    }
  };

  return <button onClick={handleClick}>{isLoggedIn ? "로그아웃" : "로그인"}</button>;
};

export default UserButton;
