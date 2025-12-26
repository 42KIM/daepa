import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CalendarSelect from "./CalendarSelect";
import { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { MatingByDateDto, MatingByParentsDto } from "@repo/api-client";
import { cn } from "@/lib/utils";
import { compact } from "es-toolkit";
import MatingItem from "./MatingItem";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useMobile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DateTime } from "luxon";

interface MatingDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matingGroup: MatingByParentsDto | null;
  onConfirmAdd: (matingDate: string) => void;
}

const MatingDetailDialog = ({
  isOpen,
  onClose,
  matingGroup,
  onConfirmAdd,
}: MatingDetailDialogProps) => {
  const isMobile = useIsMobile();
  const isEditable = !matingGroup?.father?.isDeleted && !matingGroup?.mother?.isDeleted;
  // 메이팅 날짜들을 추출하여 Calendar용 날짜 배열 생성
  const getMatingDates = useCallback((matingDates: MatingByDateDto[]) => {
    if (!matingDates) return [];

    return compact(matingDates.map((mating) => mating.matingDate));
  }, []);

  const matingDates = useMemo(
    () => getMatingDates(matingGroup?.matingsByDate ?? []),
    [matingGroup?.matingsByDate, getMatingDates],
  );

  const [selectedMatingId, setSelectedMatingId] = useState<number | null>(null);
  const prevMatingCountRef = useRef<number>(0);
  const isInitialOpenRef = useRef<boolean>(true);

  // 클릭 & 드래그 스크롤을 위한 상태
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, scrollLeft: 0, moved: false });

  // Dialog 오픈/클로즈 상태 감지
  useEffect(() => {
    if (isOpen && isInitialOpenRef.current) {
      // Dialog 최초 오픈 시 가장 최근 메이팅 선택
      if (matingGroup?.matingsByDate?.[0]) {
        setSelectedMatingId(matingGroup.matingsByDate[0].id);
      }
      isInitialOpenRef.current = false;
    } else if (!isOpen) {
      // Dialog 닫혔을 때 다시 초기화
      isInitialOpenRef.current = true;
    }
  }, [isOpen, matingGroup?.matingsByDate]);

  // 메이팅 개수 변화 감지 (새 메이팅 추가 시)
  useEffect(() => {
    const currentMatingCount = matingGroup?.matingsByDate?.length ?? 0;

    // 메이팅이 추가되었을 때 (개수가 증가했을 때)
    if (currentMatingCount > prevMatingCountRef.current && matingGroup?.matingsByDate?.[0]) {
      // 새로 추가된 메이팅 선택 (배열의 첫 번째 항목)
      setSelectedMatingId(matingGroup.matingsByDate[0].id);
    }

    prevMatingCountRef.current = currentMatingCount;
  }, [matingGroup?.matingsByDate, matingGroup]);

  // PC에서 클릭 & 드래그 스크롤 구현
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      dragStartRef.current = {
        x: e.pageX,
        scrollLeft: container.scrollLeft,
        moved: false,
      };
      setIsDragging(true);
      container.style.cursor = "grabbing";
      container.style.userSelect = "none";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const x = e.pageX;
      const walk = dragStartRef.current.x - x;

      if (Math.abs(walk) > 3) {
        dragStartRef.current.moved = true;
      }

      container.scrollLeft = dragStartRef.current.scrollLeft + walk;
    };

    const handleMouseUpOrLeave = () => {
      setIsDragging(false);
      container.style.cursor = "grab";
      container.style.userSelect = "";
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseup", handleMouseUpOrLeave);
    container.addEventListener("mouseleave", handleMouseUpOrLeave);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseup", handleMouseUpOrLeave);
      container.removeEventListener("mouseleave", handleMouseUpOrLeave);
    };
  }, [isDragging]);

  if (!matingGroup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn("p-13 flex w-full flex-col rounded-3xl sm:max-w-[860px]", isMobile && "p-4")}
      >
        <DialogTitle
          className={cn("flex items-center gap-1 text-[28px]", isMobile && "pt-3 text-[18px]")}
        >
          {matingGroup.father?.petId ? (
            matingGroup.father?.isDeleted ? (
              <>
                <span className="cursor-not-allowed line-through decoration-red-500">
                  {matingGroup.father?.name}
                </span>
                <span className="text-[12px] text-red-500">[삭제됨]</span>
              </>
            ) : (
              <Link href={`/pet/${matingGroup.father?.petId}`} className="text-blue-600 underline">
                {matingGroup.father?.name}
              </Link>
            )
          ) : (
            <span className="text-[14px] font-[500] text-gray-500">정보없음</span>
          )}
          x
          {matingGroup.mother?.petId ? (
            matingGroup.mother?.isDeleted ? (
              <>
                <span className="cursor-not-allowed line-through decoration-red-500">
                  {matingGroup.mother?.name}
                </span>
                <span className="text-[12px] text-red-500">[삭제됨]</span>
              </>
            ) : (
              <Link href={`/pet/${matingGroup.mother?.petId}`} className="text-blue-600 underline">
                {matingGroup.mother?.name}
              </Link>
            )
          ) : (
            <span className="text-[14px] font-[500] text-gray-500">정보없음</span>
          )}
        </DialogTitle>

        <div className={cn("flex flex-col gap-2", isMobile && "px-0")}>
          {matingGroup.matingsByDate && matingGroup.matingsByDate.length > 0 ? (
            <div className="flex flex-col gap-4">
              <Tabs
                value={String(selectedMatingId)}
                onValueChange={(v) => {
                  if (v === "add") return;

                  setSelectedMatingId(Number(v));
                }}
                className="flex flex-1 flex-col gap-4"
              >
                <div
                  ref={scrollContainerRef}
                  className="cursor-grab select-none overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  <TabsList className="inline-flex w-fit overflow-visible">
                    {isEditable && (
                      <TabsTrigger key="mating-add" value="add">
                        <CalendarSelect
                          triggerText="메이팅 추가"
                          confirmButtonText="메이팅 추가"
                          disabledDates={matingDates}
                          onConfirm={(matingDate) => onConfirmAdd(matingDate)}
                        />
                      </TabsTrigger>
                    )}

                    {matingGroup.matingsByDate.map((mating) => (
                      <TabsTrigger value={String(mating.id)} key={mating.id}>
                        {mating.matingDate
                          ? DateTime.fromFormat(mating.matingDate, "yyyy-MM-dd").toFormat("M월 d일")
                          : ""}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {matingGroup.matingsByDate.map((mating) => (
                  <TabsContent key={mating.id} value={String(mating.id)}>
                    <MatingItem
                      isEditable={isEditable}
                      mating={mating}
                      father={matingGroup.father}
                      mother={matingGroup.mother}
                      matingDates={matingDates}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          ) : (
            <div className="text-sm text-gray-500">메이팅이 없습니다.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MatingDetailDialog;
