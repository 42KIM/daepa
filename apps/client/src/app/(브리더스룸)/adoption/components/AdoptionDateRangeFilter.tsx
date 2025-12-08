"use client";

import { useEffect, useRef, useState } from "react";
import { useAdoptionFilterStore } from "../../store/adoptionFilter";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { isNotNil } from "es-toolkit";

const AdoptionDateRangeFilter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { searchFilters, setSearchFilters } = useAdoptionFilterStore();

  const getDateString = (date: Date | string | undefined): string => {
    if (!date) return "";
    try {
      const dateStr = new Date(date).toISOString().split("T")[0];
      return dateStr || "";
    } catch {
      return "";
    }
  };

  const [startDate, setStartDate] = useState<string>(getDateString(searchFilters.startDate));
  const [endDate, setEndDate] = useState<string>(getDateString(searchFilters.endDate));

  const containerRef = useRef<HTMLDivElement>(null);
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const root = containerRef.current;
      if (root && !root.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsEntering(false);
      const raf = requestAnimationFrame(() => setIsEntering(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setIsEntering(false);
    }
  }, [isOpen]);

  useEffect(() => {
    setStartDate(getDateString(searchFilters.startDate));
    setEndDate(getDateString(searchFilters.endDate));
  }, [searchFilters]);

  const hasFilter = searchFilters.startDate !== undefined || searchFilters.endDate !== undefined;

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  };

  const displayText = () => {
    if (isNotNil(searchFilters.startDate) && isNotNil(searchFilters.endDate)) {
      return `분양 날짜・${formatDate(searchFilters.startDate)} ~ ${formatDate(searchFilters.endDate)}`;
    }
    if (searchFilters.startDate) {
      return `분양 날짜・${formatDate(searchFilters.startDate)} 이후`;
    }
    if (searchFilters.endDate) {
      return `분양 날짜・${formatDate(searchFilters.endDate)} 이전`;
    }
    return "분양 날짜";
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={cn(
          "flex h-[32px] cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[14px] font-[500]",
          hasFilter ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-800",
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div>{displayText()}</div>
        <ChevronDown className={cn("h-4 w-4", hasFilter ? "text-blue-600" : "text-gray-600")} />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute left-0 top-[40px] z-50 w-[320px] rounded-2xl border-[1.8px] border-gray-200 bg-white p-5 shadow-lg",
            "origin-top transform transition-all duration-200 ease-out",
            isEntering
              ? "translate-y-0 scale-100 opacity-100"
              : "-translate-y-1 scale-95 opacity-0",
          )}
        >
          <div className="mb-4 font-[500]">분양 날짜</div>
          <div className="mb-4 flex items-center gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-gray-600">시작 날짜</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-[32px] w-full rounded-lg border border-gray-200 px-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="mt-6 text-gray-400">~</div>
            <div className="flex-1">
              <label className="mb-1 block text-sm text-gray-600">종료 날짜</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-[32px] w-full rounded-lg border border-gray-200 px-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setSearchFilters({
                  ...searchFilters,
                  startDate: undefined,
                  endDate: undefined,
                });
              }}
              className="h-[32px] cursor-pointer rounded-lg bg-gray-100 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-200"
            >
              초기화
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchFilters({
                  ...searchFilters,
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                });
                setIsOpen(false);
              }}
              className="h-[32px] cursor-pointer rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-600"
            >
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdoptionDateRangeFilter;
