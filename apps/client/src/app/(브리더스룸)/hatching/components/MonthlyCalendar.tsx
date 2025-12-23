"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import Loading from "@/components/common/Loading";

import { brPetControllerGetPetsByMonth, PetDto, PetDtoType } from "@repo/api-client";
import HatchingPetCard from "./HatchingPetCard";

import { Calendar } from "./Calendar";
import { format, getWeekOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";
import { DateTime } from "luxon";

const MonthlyCalendar = memo(() => {
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isScrolled, setIsScrolled] = useState(false);

  const [tab, setTab] = useState<"all" | PetDtoType>("all");

  // 월별 해칭된 펫 조회
  const { data: monthlyData, isPending: monthlyIsPending } = useQuery({
    queryKey: [
      brPetControllerGetPetsByMonth.name,
      (selectedDate ?? new Date()).getFullYear(),
      (selectedDate ?? new Date()).getMonth(),
    ],
    queryFn: () =>
      brPetControllerGetPetsByMonth({
        year: (selectedDate ?? new Date()).getFullYear().toString(),
        month: (selectedDate ?? new Date()).getMonth().toString(),
      }),
    select: (data) => data.data.data,
  });

  const todayIsFetching = false;

  // 월별 해칭된 펫 개수 계산
  const petCounts = useMemo(() => {
    if (!monthlyData) return {};

    return Object.entries(monthlyData).reduce(
      (acc, [date, pets]) => {
        // 현재 탭에 맞는 펫만 필터링
        const filteredPets = tab === "all" ? pets : pets.filter((pet) => pet.type === tab);

        const hatched = filteredPets.filter((pet) => pet.type === PetDtoType.PET).length;
        const egg = filteredPets.filter((pet) => pet.type === PetDtoType.EGG).length;

        acc[date] = {
          hatched,
          egg,
          total: filteredPets.length,
        };
        return acc;
      },
      {} as Record<string, { hatched: number; egg: number; total: number }>,
    );
  }, [monthlyData, tab]);

  const visibleData = useMemo(() => (monthlyData ?? {}) as Record<string, PetDto[]>, [monthlyData]);
  const sortedEntries = useMemo(() => {
    const entries = Object.entries(visibleData as Record<string, PetDto[]>);
    entries.sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
    return entries as Array<[string, PetDto[]]>;
  }, [visibleData]);

  // 주차별 그룹 생성
  const weeklyGroups = useMemo(() => {
    const groups: Array<{ weekKey: string; label: string; items: Array<[string, PetDto[]]> }> = [];
    let currentKey: string | null = null;
    for (const [date, pets] of sortedEntries) {
      const d = new Date(date);
      const week = getWeekOfMonth(d, { weekStartsOn: 1 });
      const label = `${format(d, "MM월 ")}${week}주차`;
      const key = `${format(d, "yyyy-MM")}-w${week}`;
      if (key !== currentKey) {
        groups.push({ weekKey: key, label, items: [] });
        currentKey = key;
      }
      if (groups[groups.length - 1]) {
        groups[groups.length - 1]?.items.push([date, pets]);
      }
    }
    return groups;
  }, [sortedEntries]);

  // 스크롤 이벤트 감지
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      const scrollTop = target.scrollTop;
      setIsScrolled(scrollTop > 50);
    };

    // ScrollArea의 실제 스크롤 가능한 요소 찾기
    const scrollableElement = scrollArea.querySelector("[data-radix-scroll-area-viewport]");
    if (scrollableElement) {
      scrollableElement.addEventListener("scroll", handleScroll);
      return () => {
        scrollableElement.removeEventListener("scroll", handleScroll);
      };
    }
  }, []);

  const tabs: Array<{ key: "all" | PetDtoType; label: string }> = [
    { key: "all", label: "전체" },
    { key: PetDtoType.EGG, label: "알" },
    { key: PetDtoType.PET, label: "해칭 완료" },
  ];

  return (
    <div className="flex">
      {!isMobile && (
        <Calendar
          mode="single"
          selected={selectedDate ? new Date(selectedDate) : undefined}
          onSelect={(date) => {
            if (!date) return;
            setSelectedDate(date);
          }}
          eggCounts={petCounts}
        />
      )}

      <ScrollArea ref={scrollAreaRef} className={cn("flex h-[calc(100vh-100px)] gap-4 px-2")}>
        {isMobile && (
          <div
            className={cn(
              "shrink-0 transition-all duration-300",
              isScrolled && "sticky top-0 z-20 h-fit w-full origin-top-left scale-75 bg-white",
            )}
          >
            <Calendar
              mode="single"
              selected={selectedDate ? new Date(selectedDate) : undefined}
              onSelect={(date) => {
                if (!date) return;
                setSelectedDate(date);
              }}
              eggCounts={petCounts}
            />
          </div>
        )}

        <div>
          <div className="flex h-[32px] w-fit items-center gap-2 rounded-lg bg-gray-100 px-1">
            {tabs.map(({ key, label }) => {
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-gray-800",
                    tab === key ? "bg-white shadow-sm" : "text-gray-600",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <ScrollArea className="relative h-[calc(100vh-320px)]">
            {monthlyIsPending || todayIsFetching ? (
              <Loading />
            ) : (
              weeklyGroups.map((group) => (
                <div key={group.weekKey} ref={(el) => void (groupRefs.current[group.weekKey] = el)}>
                  <div className="sticky top-0 z-10 bg-white/70 px-1 py-2 text-[15px] font-semibold supports-[backdrop-filter]:bg-white/60">
                    {group.label}
                  </div>
                  {group.items
                    .filter(([, pets]) => {
                      if (tab === "all") return pets.length > 0;
                      if (tab === PetDtoType.PET)
                        return pets.filter((pet) => pet.type === PetDtoType.PET).length > 0;
                      if (tab === PetDtoType.EGG)
                        return pets.filter((pet) => pet.type === PetDtoType.EGG).length > 0;
                    })
                    .map(([date, pets]) => {
                      const isSelected = selectedDate
                        ? DateTime.fromJSDate(selectedDate).hasSame(
                            DateTime.fromFormat(date, "yyyy-MM-dd"),
                            "day",
                          )
                        : false;

                      return (
                        <HatchingPetCard
                          key={date}
                          isSelected={isSelected}
                          date={date}
                          pets={pets}
                          tab={tab}
                        />
                      );
                    })}
                </div>
              ))
            )}
          </ScrollArea>
        </div>
      </ScrollArea>
    </div>
  );
});

MonthlyCalendar.displayName = "MonthlyCalendar";

export default MonthlyCalendar;
