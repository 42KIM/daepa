import {
  brMatingControllerFindAll,
  layingControllerUpdate,
  MatingByDateDto,
  PetSummaryLayingDto,
} from "@repo/api-client";
import { Trash2, NotebookPen } from "lucide-react";
import { overlay } from "overlay-kit";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { orderBy } from "es-toolkit";
import { ScrollArea } from "@/components/ui/scroll-area";
import CreateLayingModal from "./CreateLayingModal";
import EditMatingModal from "./EditMatingModal";
import DeleteMatingModal from "./DeleteMatingModal";

import LayingItem from "./LayingItem";
import { DateTime } from "luxon";
import CalendarSelect from "./CalendarSelect";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { cn } from "@/lib/utils";

interface MatingItemProps {
  mating: MatingByDateDto;
  father?: PetSummaryLayingDto;
  mother?: PetSummaryLayingDto;
  matingDates: string[];
  isEditable?: boolean;
}

const MatingItem = ({
  mating,
  father,
  mother,
  matingDates,
  isEditable = true,
}: MatingItemProps) => {
  const queryClient = useQueryClient();

  const { mutateAsync: updateLayingDate } = useMutation({
    mutationFn: ({ id, newLayingDate }: { id: number; newLayingDate: string }) =>
      layingControllerUpdate(id, { layingDate: newLayingDate }),
  });

  const layingDates = useMemo(
    () => mating.layingsByDate?.map((laying) => laying.layingDate) ?? [],
    [mating.layingsByDate],
  );

  const sortedLayingsByDate = useMemo(() => {
    if (!mating.layingsByDate) return [];
    return orderBy(
      mating.layingsByDate,
      [(laying) => DateTime.fromFormat(laying.layingDate, "yyyy-MM-dd").toMillis()],
      ["desc"], // 최근 날짜가 맨 앞에 오도록 내림차순 정렬
    );
  }, [mating.layingsByDate]);

  const [selectedLayingId, setSelectedLayingId] = useState<number | null>(
    sortedLayingsByDate[0]?.layingId ?? null,
  );
  const layingRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const prevLayingCountRef = useRef<number>(sortedLayingsByDate.length);

  const scrollToLaying = useCallback((layingId: number) => {
    const element = layingRefs.current.get(layingId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setSelectedLayingId(layingId);
    }
  }, []);

  // 새로운 산란이 추가되면 해당 차수로 자동 포커스
  useEffect(() => {
    const currentCount = sortedLayingsByDate.length;

    // 산란이 추가되었을 때 (개수가 증가했을 때)
    if (currentCount > prevLayingCountRef.current && currentCount > 0) {
      // 가장 최근 날짜의 laying (첫 번째 요소, 내림차순 정렬이므로)으로 스크롤
      const latestLaying = sortedLayingsByDate[0];
      if (latestLaying) {
        // 약간의 지연을 주어 DOM이 렌더링된 후 스크롤
        setTimeout(() => {
          scrollToLaying(latestLaying.layingId);
        }, 100);
      }
    }

    prevLayingCountRef.current = currentCount;
  }, [sortedLayingsByDate, scrollToLaying]);

  const handleAddLayingClick = () => {
    overlay.open(({ isOpen, close }) => (
      <CreateLayingModal
        isOpen={isOpen}
        onClose={close}
        matingId={mating.id}
        matingDate={mating.matingDate}
        layingData={mating.layingsByDate}
        fatherId={father?.petId}
        motherId={mother?.petId}
      />
    ));
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    overlay.open(({ isOpen, close }) => (
      <EditMatingModal
        isOpen={isOpen}
        onClose={close}
        matingId={mating.id}
        currentData={{
          fatherId: father?.petId,
          motherId: mother?.petId,
          matingDate: mating.matingDate ?? "",
        }}
        matingDates={matingDates}
      />
    ));
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    overlay.open(({ isOpen, close }) => (
      <DeleteMatingModal
        isOpen={isOpen}
        onClose={close}
        matingId={mating.id}
        matingDate={mating.matingDate}
      />
    ));
  };

  const getDisabledDates = useCallback(
    (currentLayingDate: string) => {
      const currentDate = DateTime.fromFormat(currentLayingDate, "yyyy-MM-dd").startOf("day");
      const matingDateObj = mating.matingDate
        ? DateTime.fromFormat(mating.matingDate, "yyyy-MM-dd").startOf("day")
        : null;

      return (date: Date) => {
        const normalizedDate = DateTime.fromJSDate(date).startOf("day");

        // 현재 산란일 자체는 비활성화 (편집 모드에서 현재 날짜는 선택 불가)
        return (
          normalizedDate.toMillis() === currentDate.toMillis() ||
          (matingDateObj !== null && normalizedDate.toMillis() < matingDateObj.toMillis())
        );
      };
    },
    [mating.matingDate],
  );

  const handleUpdateLayingDate = useCallback(
    async (layingId: number, newLayingDate: string) => {
      try {
        await updateLayingDate({
          id: layingId,
          newLayingDate,
        });
        toast.success("산란일 수정에 성공했습니다.");
        await queryClient.invalidateQueries({ queryKey: [brMatingControllerFindAll.name] });
      } catch (error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.message ?? "산란일 수정에 실패했습니다.");
        } else {
          toast.error("산란일 수정에 실패했습니다.");
        }
      }
    },
    [updateLayingDate, queryClient],
  );

  return (
    <div className="relative flex h-[calc(100vh-300px)] w-full flex-col">
      <div className="flex flex-col justify-center gap-1">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-gray-700 dark:text-gray-200">
            {mating.matingDate
              ? DateTime.fromFormat(mating.matingDate, "yyyy-MM-dd").toFormat("yyyy년 MM월 dd일 ")
              : "-"}
            <span className="text-sm font-[400] text-gray-500">메이팅</span>
          </div>
          {isEditable && (
            <div className="flex items-center gap-1">
              <button type="button" aria-label="교배 정보 수정" onClick={handleEditClick}>
                <NotebookPen className="h-4 w-4 text-blue-600" />
              </button>
              <button type="button" aria-label="교배 정보 삭제" onClick={handleDeleteClick}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>
            </div>
          )}
        </div>
        <div className="sticky top-0 z-20 flex items-center gap-2 overflow-x-auto bg-white pb-2">
          <button
            type="button"
            onClick={handleAddLayingClick}
            className="flex w-fit shrink-0 items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[14px] text-blue-600"
          >
            <div className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-100 text-[10px] text-blue-600">
              +
            </div>
            <span className={"font-medium text-blue-600"}>산란 추가</span>
          </button>
          {sortedLayingsByDate && sortedLayingsByDate.length > 0 && (
            <div className="flex gap-1">
              {sortedLayingsByDate.map((layingData) => (
                <button
                  key={layingData.layingId}
                  type="button"
                  onClick={() => scrollToLaying(layingData.layingId)}
                  className={cn(
                    "shrink-0 rounded-lg px-2 py-0.5 text-[14px] font-medium transition-colors",
                    selectedLayingId === layingData.layingId
                      ? "bg-blue-500 font-[700] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                  )}
                >
                  {layingData.layings[0]?.clutch}차
                  {/* {DateTime.fromFormat(layingData.layingDate, "yyyy-MM-dd").toFormat("M/d")} */}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="relative flex h-[calc(100vh-350px)] w-full flex-col px-2">
        {sortedLayingsByDate &&
          sortedLayingsByDate.length > 0 &&
          sortedLayingsByDate.map((layingData) => (
            <div
              key={layingData.layingId}
              ref={(el) => {
                if (el) {
                  layingRefs.current.set(layingData.layingId, el);
                } else {
                  layingRefs.current.delete(layingData.layingId);
                }
              }}
              className="mb-7"
            >
              <div className="sticky top-0 mb-1 flex bg-white text-[15px] font-semibold text-gray-700">
                <span className="mr-1 text-blue-500">{layingData.layings[0]?.clutch}차</span>

                <CalendarSelect
                  type="edit"
                  triggerTextClassName="text-gray-600 text-sm"
                  disabledDates={layingDates}
                  triggerText={DateTime.fromFormat(layingData.layingDate, "yyyy-MM-dd").toFormat(
                    "M월 d일",
                  )}
                  confirmButtonText="산란 날짜 수정"
                  onConfirm={(newLayingDate) =>
                    handleUpdateLayingDate(layingData.layingId, newLayingDate)
                  }
                  disabled={getDisabledDates(layingData.layingDate)}
                />
              </div>
              <div
                className={cn(
                  selectedLayingId === layingData.layingId &&
                    "rounded-xl border-[1.5px] border-blue-200 shadow-md",
                )}
              >
                <LayingItem
                  key={layingData.layingId}
                  layingData={layingData}
                  father={father}
                  mother={mother}
                />
              </div>
            </div>
          ))}
        <div className="h-30" />
      </ScrollArea>
    </div>
  );
};

export default memo(MatingItem);
