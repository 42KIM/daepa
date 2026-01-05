"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MatingByDateDto, PetDtoEggStatus } from "@repo/api-client";
import { DateTime } from "luxon";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn, getIncubationDays } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export enum EGG_STATUS {
  MATING = "mating",
  LAYING = "laying",
  HATCHING = "hatching",
  HATCHED = "hatched",
}

export interface CalendarEventDetail {
  matingId: number;
  eventType: EGG_STATUS;
  layingDate?: string; // 산란/해칭 이벤트의 경우 산란일
  layingId?: number; // 산란 이벤트의 경우 산란 ID
  eggId?: string; // 해칭예정/해칭완료 이벤트의 경우 알 ID (petId)
}

interface PairMiniCalendarProps {
  matingsByDate: MatingByDateDto[];
  onDateClick?: (detail: CalendarEventDetail) => void;
  onAddMating?: (date: string) => void;
  onAddLaying?: (date: string) => void;
}

interface CalendarEvent {
  date: string; // yyyy-MM-dd
  type: EGG_STATUS;
  matingId: number;
  layingDate?: string;
  layingId?: number;
  eggId?: string;
}

const EVENT_COLORS = {
  mating: "bg-blue-200 text-blue-700 dark:bg-blue-200 dark:text-blue-800",
  laying: "bg-amber-200 text-amber-800 dark:bg-amber-200 dark:text-amber-800",
  hatching: "bg-green-200 text-green-800 dark:bg-green-200 dark:text-green-800",
  hatched: "bg-purple-200 text-purple-800 dark:bg-purple-200 dark:text-purple-800",
};

const DOT_COLORS = {
  mating: "bg-blue-400 dark:bg-blue-400",
  laying: "bg-amber-400 dark:bg-amber-400",
  hatching: "bg-green-400 dark:bg-green-400",
  hatched: "bg-purple-400 dark:bg-purple-400",
};

const EVENT_LABELS = {
  mating: "메이팅",
  laying: "산란",
  hatching: "해칭예정",
  hatched: "해칭완료",
};

const PairMiniCalendar = ({
  matingsByDate,
  onDateClick,
  onAddMating,
  onAddLaying,
}: PairMiniCalendarProps) => {
  // 모든 이벤트 날짜 추출
  const events = useMemo(() => {
    const eventList: CalendarEvent[] = [];

    matingsByDate?.forEach((mating) => {
      // 메이팅 날짜
      if (mating.matingDate) {
        eventList.push({
          date: mating.matingDate,
          type: EGG_STATUS.MATING,
          matingId: mating.id,
        });
      }

      // 산란 날짜 및 해칭 예정일
      mating.layingsByDate?.forEach((laying) => {
        if (laying.layingDate) {
          eventList.push({
            date: laying.layingDate,
            type: EGG_STATUS.LAYING,
            matingId: mating.id,
            layingDate: laying.layingDate,
            layingId: laying.layingId,
          });

          // 유정란이 있는 경우 해칭 예정일 계산
          const fertilizedEggs = laying.layings?.filter(
            (egg) => egg.eggStatus === PetDtoEggStatus.FERTILIZED,
          );

          if (fertilizedEggs && fertilizedEggs.length > 0) {
            const incubationDays = getIncubationDays(laying.layings[0]?.temperature ?? 25);
            const hatchingDate = DateTime.fromFormat(laying.layingDate, "yyyy-MM-dd")
              .plus({ days: incubationDays })
              .toFormat("yyyy-MM-dd");

            // 각 유정란에 대해 이벤트 추가
            fertilizedEggs.forEach((egg) => {
              eventList.push({
                date: hatchingDate,
                type: EGG_STATUS.HATCHING,
                matingId: mating.id,
                layingDate: laying.layingDate,
                eggId: egg.petId,
              });
            });
          }

          // 해칭 완료된 알의 실제 해칭일 표시
          laying.layings?.forEach((egg) => {
            if (egg.eggStatus === PetDtoEggStatus.HATCHED && egg.hatchingDate) {
              const hatchedDate = DateTime.fromISO(egg.hatchingDate).toFormat("yyyy-MM-dd");

              eventList.push({
                date: hatchedDate,
                type: EGG_STATUS.HATCHED,
                matingId: mating.id,
                layingDate: laying.layingDate,
                eggId: egg.petId,
              });
            }
          });
        }
      });
    });

    return eventList;
  }, [matingsByDate]);

  // 날짜별 이벤트 맵 (타입별 이벤트 목록 포함)
  const eventsByDate = useMemo(() => {
    const map = new Map<
      string,
      { eventsByType: Map<EGG_STATUS, CalendarEvent[]>; matingId: number }
    >();
    events.forEach((event) => {
      if (!map.has(event.date)) {
        map.set(event.date, { eventsByType: new Map(), matingId: event.matingId });
      }
      const entry = map.get(event.date)!;
      if (!entry.eventsByType.has(event.type)) {
        entry.eventsByType.set(event.type, []);
      }
      entry.eventsByType.get(event.type)!.push(event);
    });
    return map;
  }, [events]);

  // 마지막 메이팅/산란 날짜 계산 (추가 버튼 표시 제한용)
  const lastEventDate = useMemo(() => {
    const matingAndLayingEvents = events.filter(
      (e) => e.type === EGG_STATUS.MATING || e.type === EGG_STATUS.LAYING,
    );
    if (matingAndLayingEvents.length === 0) return null;

    const dates = matingAndLayingEvents.map((e) => DateTime.fromFormat(e.date, "yyyy-MM-dd"));
    return DateTime.max(...dates);
  }, [events]);

  // 날짜 범위 계산 (첫 메이팅일 ~ 마지막 해칭예정일)
  const dateRange = useMemo(() => {
    if (events.length === 0) return null;

    const dates = events.map((e) => DateTime.fromFormat(e.date, "yyyy-MM-dd"));
    const minDate = DateTime.min(...dates);
    const maxDate = DateTime.max(...dates);

    return { start: minDate, end: maxDate };
  }, [events]);

  // 현재 표시할 월 (마지막 달부터 시작)
  const [currentMonth, setCurrentMonth] = useState<DateTime>(DateTime.now().startOf("month"));
  const isInitialized = useRef(false);

  // dateRange가 계산되면 마지막 달로 이동
  useEffect(() => {
    if (dateRange?.end && !isInitialized.current) {
      setCurrentMonth(dateRange.end.startOf("month"));
      isInitialized.current = true;
    }
  }, [dateRange?.end]);

  const canGoPrev = dateRange?.start ? currentMonth > dateRange.start.startOf("month") : true;

  // 현재 월의 달력 데이터 생성
  const calendarDays = useMemo(() => {
    const startOfMonth = currentMonth.startOf("month");
    const endOfMonth = currentMonth.endOf("month");
    const startOfWeek = startOfMonth.startOf("week"); // 월요일 시작
    const endOfWeek = endOfMonth.endOf("week");

    const days: DateTime[] = [];
    let day = startOfWeek;

    while (day <= endOfWeek) {
      days.push(day);
      day = day.plus({ days: 1 });
    }

    return days;
  }, [currentMonth]);

  if (!dateRange || events.length === 0) {
    return (
      <div className="flex items-center justify-center py-4 text-sm text-gray-500 dark:text-gray-400">
        메이팅 정보가 없습니다.
      </div>
    );
  }

  const weekdays = ["월", "화", "수", "목", "금", "토", "일"];

  return (
    <div className="flex flex-col gap-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {currentMonth.toFormat("yyyy년 M월")}
          </span>
          {/* 범례 */}
          <div className="flex flex-wrap justify-center gap-2 pt-1 text-[10px]">
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-300" />
              <span className="text-gray-700 dark:text-gray-400">메이팅</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
              <span className="text-gray-700 dark:text-gray-400">산란</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-green-300" />
              <span className="text-gray-700 dark:text-gray-400">해칭예정</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2.5 w-2.5 rounded-full bg-purple-300" />
              <span className="text-gray-700 dark:text-gray-400">해칭완료</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCurrentMonth((prev) => prev.minus({ months: 1 }))}
            disabled={!canGoPrev}
            className={cn(
              "rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700",
              !canGoPrev && "cursor-not-allowed opacity-30",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentMonth((prev) => prev.plus({ months: 1 }))}
            className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 달력 테이블 */}
      <div className="overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-[10px] text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          {weekdays.map((day) => (
            <div key={day} className="py-1.5">
              {day}
            </div>
          ))}
        </div>

        {/* 달력 그리드 */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dateKey = day.toFormat("yyyy-MM-dd");
            const eventData = eventsByDate.get(dateKey);
            const isCurrentMonth = day.month === currentMonth.month;
            const isToday = day.hasSame(DateTime.now(), "day");

            // 이벤트 타입에 따른 배경색 결정
            let bgClass = "";
            const hasMultipleEventTypes = eventData && eventData.eventsByType.size > 1;

            if (eventData) {
              if (eventData.eventsByType.size === 1) {
                const type = Array.from(eventData.eventsByType.keys())[0];
                if (type) {
                  bgClass = EVENT_COLORS[type];
                }
              } else {
                // 여러 이벤트가 겹치는 경우 연한 회색 배경 (점으로 이벤트 표시)
                bgClass = "bg-gray-100 dark:bg-gray-700";
              }
            }

            const hasEvent = !!eventData;
            // [type, events[]] 형태로 변환
            const eventTypeArray = eventData ? Array.from(eventData.eventsByType.entries()) : [];

            const isEditable = lastEventDate && day >= lastEventDate;

            const handleEventClick = (event: CalendarEvent) => {
              if (onDateClick) {
                onDateClick({
                  matingId: event.matingId,
                  eventType: event.type,
                  layingDate: event.layingDate,
                  layingId: event.layingId,
                  eggId: event.eggId,
                });
              }
            };

            const cellContent = (
              <div
                className={cn(
                  "flex h-8 w-full cursor-pointer flex-col items-center justify-center border-b border-r border-gray-100 text-[11px] dark:border-gray-700",
                  !isCurrentMonth && "cursor-not-allowed text-gray-200 dark:text-gray-600",
                  isCurrentMonth &&
                    !hasEvent &&
                    !isEditable &&
                    "cursor-not-allowed text-gray-400 dark:text-gray-500",
                  isToday && "font-bold ring-1 ring-inset ring-gray-400",
                  hasEvent && "font-[500] hover:opacity-80",
                  bgClass,
                )}
              >
                <span>{day.day}</span>
                {hasMultipleEventTypes && (
                  <div className="flex gap-0.5">
                    {eventTypeArray.map(([type]) => (
                      <div key={type} className={cn("h-2 w-2 rounded-full", DOT_COLORS[type])} />
                    ))}
                  </div>
                )}
              </div>
            );

            // 팝오버/툴팁 컨텐츠 (이벤트 목록 + 추가 버튼)
            const popoverContent = (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold">{day.toFormat("M월 d일")}</span>

                {/* 기존 이벤트 목록 */}
                {hasEvent && (
                  <div className="flex flex-col gap-1">
                    {eventTypeArray.map(([type, typeEvents]) => {
                      const firstEvent = typeEvents[0];
                      if (!firstEvent) return null;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleEventClick(firstEvent)}
                          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <div className={cn("h-2 w-2 rounded-full", DOT_COLORS[type])} />
                          <span className="text-xs font-medium">
                            {EVENT_LABELS[type]} {typeEvents.length}개
                          </span>
                          <ChevronRight className="ml-auto h-3 w-3 text-gray-400" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 추가 버튼들 */}
                {(onAddMating || onAddLaying) &&
                  !eventData?.eventsByType.has(EGG_STATUS.MATING) &&
                  !eventData?.eventsByType.has(EGG_STATUS.LAYING) &&
                  isEditable && (
                    <div className="flex flex-col gap-1 border-t border-gray-200 pt-1.5 dark:border-gray-600">
                      {onAddMating && (
                        <button
                          type="button"
                          onClick={() => onAddMating(dateKey)}
                          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        >
                          <Plus className="h-3 w-3" />
                          <span className="text-xs font-medium">메이팅 추가</span>
                        </button>
                      )}
                      {onAddLaying && (
                        <button
                          type="button"
                          onClick={() => onAddLaying(dateKey)}
                          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-amber-600 transition-colors hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/30"
                        >
                          <Plus className="h-3 w-3" />
                          <span className="text-xs font-medium">산란 추가</span>
                        </button>
                      )}
                    </div>
                  )}
              </div>
            );

            // 현재 월의 날짜만 클릭 가능
            if (!isCurrentMonth || (!hasEvent && !isEditable)) {
              return <div key={dateKey}>{cellContent}</div>;
            }

            // 메이팅 또는 산란만 있는 날짜는 바로 모달 열기
            const hasMatingOnly =
              eventTypeArray.length === 1 && eventTypeArray[0]?.[0] === EGG_STATUS.MATING;
            const hasLayingOnly =
              eventTypeArray.length === 1 && eventTypeArray[0]?.[0] === EGG_STATUS.LAYING;

            if (hasMatingOnly || hasLayingOnly) {
              const firstEvent = eventTypeArray[0]?.[1]?.[0];
              if (firstEvent) {
                return (
                  <div
                    key={dateKey}
                    onClick={() => handleEventClick(firstEvent)}
                    className="cursor-pointer"
                  >
                    {cellContent}
                  </div>
                );
              }
            }

            // 그 외: Popover (여러 이벤트 타입이 있거나, 추가 버튼이 필요한 경우)
            return (
              <Popover key={dateKey}>
                <PopoverTrigger asChild>{cellContent}</PopoverTrigger>
                <PopoverContent
                  side="top"
                  className="w-auto min-w-[140px] p-2 dark:bg-gray-800 dark:text-gray-200"
                >
                  {popoverContent}
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PairMiniCalendar;
