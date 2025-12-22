import {
  brMatingControllerFindAll,
  layingControllerUpdate,
  MatingByDateDto,
  PetSummaryLayingDto,
} from "@repo/api-client";
import { Trash2, NotebookPen } from "lucide-react";
import { overlay } from "overlay-kit";
import { memo, useCallback, useMemo } from "react";
import { sortBy } from "es-toolkit/compat";
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
    return sortBy(mating.layingsByDate, [
      (laying) => DateTime.fromFormat(laying.layingDate, "yyyy-MM-dd").toMillis(),
    ]);
  }, [mating.layingsByDate]);

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
    <ScrollArea className="relative flex h-[calc(100vh-400px)] w-full flex-col">
      <div className="mb-5 flex flex-col justify-center gap-1">
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
        <button
          type="button"
          onClick={handleAddLayingClick}
          className="flex w-fit items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[14px] text-blue-600"
        >
          <div className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-100 text-[10px] text-blue-600">
            +
          </div>
          <span className={"font-medium text-blue-600"}>산란 정보 추가</span>
        </button>
      </div>

      {sortedLayingsByDate &&
        sortedLayingsByDate.length > 0 &&
        sortedLayingsByDate.map((layingData) => (
          <div key={layingData.layingId} className="mb-7">
            <div className="sticky top-0 z-10 flex text-[15px] font-semibold text-gray-700">
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
            <LayingItem
              key={layingData.layingId}
              layingData={layingData}
              father={father}
              mother={mother}
            />
          </div>
        ))}
    </ScrollArea>
  );
};

export default memo(MatingItem);
