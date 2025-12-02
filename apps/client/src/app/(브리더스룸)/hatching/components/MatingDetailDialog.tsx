import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CalendarSelect from "./CalendarSelect";
import { useCallback, useMemo, useState, useEffect } from "react";
import { MatingByDateDto, MatingByParentsDto } from "@repo/api-client";
import { cn } from "@/lib/utils";
import { compact } from "es-toolkit";
import MatingItem from "./MatingItem";
import Link from "next/link";

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
  // 메이팅 날짜들을 추출하여 Calendar용 날짜 배열 생성
  const getMatingDates = useCallback((matingDates: MatingByDateDto[]) => {
    if (!matingDates) return [];

    return compact(matingDates.map((mating) => mating.matingDate));
  }, []);

  const matingDates = useMemo(
    () => getMatingDates(matingGroup?.matingsByDate ?? []),
    [matingGroup?.matingsByDate, getMatingDates],
  );

  const [selectedMatingId, setSelectedMatingId] = useState<number | null>(
    matingGroup?.matingsByDate?.[0]?.id ?? null,
  );

  // matingGroup의 matingsByDate가 변경되면 첫 번째 메이팅을 자동으로 선택
  useEffect(() => {
    if (!!matingGroup?.matingsByDate?.[0] && matingGroup.matingsByDate.length > 0) {
      setSelectedMatingId(matingGroup.matingsByDate[0].id);
    }
  }, [matingGroup?.matingsByDate]);

  const selectedMating = useMemo(
    () => matingGroup?.matingsByDate?.find((m) => m.id === selectedMatingId) ?? null,
    [matingGroup?.matingsByDate, selectedMatingId],
  );

  if (!matingGroup) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-15 flex w-full flex-col rounded-3xl sm:max-w-[860px]">
        <DialogTitle className="flex items-center gap-1 text-[32px]">
          {matingGroup.father?.petId ? (
            <Link
              href={`/pet/${matingGroup.father?.petId}`}
              className="text-blue-600 hover:underline"
            >
              {matingGroup.father?.name}
            </Link>
          ) : (
            <span className="text-[14px] font-[500] text-gray-500">정보없음</span>
          )}
          x
          {matingGroup.mother?.petId ? (
            <Link
              href={`/pet/${matingGroup.mother?.petId}`}
              className="text-blue-600 hover:underline"
            >
              {matingGroup.mother?.name}
            </Link>
          ) : (
            <span className="text-[14px] font-[500] text-gray-500">정보없음</span>
          )}
        </DialogTitle>

        <div className="flex flex-col gap-2 px-1">
          <CalendarSelect
            triggerText="메이팅 날짜 추가"
            confirmButtonText="메이팅 추가"
            disabledDates={matingDates}
            onConfirm={(matingDate) => onConfirmAdd(matingDate)}
          />
          {matingGroup.matingsByDate && matingGroup.matingsByDate.length > 0 ? (
            <div>
              <div className="flex gap-1 overflow-x-auto whitespace-nowrap">
                {matingGroup.matingsByDate.map((mating) => {
                  const isActive = selectedMatingId === mating.id;
                  return (
                    <div
                      key={mating.id}
                      onClick={() => setSelectedMatingId(mating.id)}
                      className={cn(
                        "cursor-pointer rounded-full px-3 py-1 text-[12px] transition-colors",
                        isActive
                          ? "border border-blue-600 bg-blue-100 text-blue-600"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-200",
                      )}
                    >
                      {mating.matingDate}
                    </div>
                  );
                })}
              </div>

              <div className="mt-2">
                {selectedMating ? (
                  <MatingItem
                    mating={selectedMating}
                    father={matingGroup.father}
                    mother={matingGroup.mother}
                    matingDates={matingDates}
                  />
                ) : (
                  <div className="text-sm text-gray-500">날짜를 선택하세요.</div>
                )}
              </div>
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
