"use client";

import MatingList from "./components/MatingList";
import Dashboard from "./components/Dashboard";
import RangeFilterCalendar from "./components/RangeFilterCalendar";

const HatchingPage = () => {
  return (
    <div className="flex flex-col gap-4">
      {/* 메이팅 리스트 */}
      <MatingList />

      {/* 해칭 날짜 범위 선택 */}
      <RangeFilterCalendar />

      {/* 대시보드 */}
      <Dashboard />
    </div>
  );
};

export default HatchingPage;
