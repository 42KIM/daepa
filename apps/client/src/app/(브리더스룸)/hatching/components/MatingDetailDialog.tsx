import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CalendarSelect from "./CalendarSelect";
import { useCallback, useMemo, useState, useEffect } from "react";
import { MatingByDateDto, MatingByParentsDto } from "@repo/api-client";
import { cn } from "@/lib/utils";
import { compact } from "es-toolkit";
import MatingItem from "./MatingItem";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useMobile";
import { DateTime } from "luxon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Pencil } from "lucide-react";
import { overlay } from "overlay-kit";
import EditMatingModal from "./EditMatingModal";
import DeleteMatingModal from "./DeleteMatingModal";

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

  // Dialog 오픈/클로즈 상태 감지
  useEffect(() => {
    if (isOpen && matingGroup?.matingsByDate?.[0]) {
      setSelectedMatingId(matingGroup.matingsByDate[0].id);
    }
  }, [isOpen, matingGroup?.matingsByDate]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedMatingId) return;

    const selectedMating = matingGroup?.matingsByDate.find((m) => m.id === selectedMatingId);
    if (!selectedMating) return;

    overlay.open(({ isOpen, close }) => (
      <EditMatingModal
        isOpen={isOpen}
        onClose={close}
        matingId={selectedMating.id}
        currentData={{
          fatherId: matingGroup?.father?.petId,
          motherId: matingGroup?.mother?.petId,
          matingDate: selectedMating.matingDate ?? "",
        }}
        matingDates={matingDates}
      />
    ));
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedMatingId) return;

    const selectedMating = matingGroup?.matingsByDate.find((m) => m.id === selectedMatingId);
    if (!selectedMating) return;

    overlay.open(({ isOpen, close }) => (
      <DeleteMatingModal
        isOpen={isOpen}
        onClose={close}
        matingId={selectedMating.id}
        matingDate={selectedMating.matingDate}
      />
    ));
  };

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
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {/* 메이팅 날짜 선택 Select */}
                  <Select
                    value={String(selectedMatingId)}
                    onValueChange={(v) => setSelectedMatingId(Number(v))}
                  >
                    <SelectTrigger className="rounded-none border-0 border-b-[1.5px] border-b-gray-300 p-0 text-[18px] font-[600]">
                      {selectedMatingId ? (
                        <div className="flex items-center gap-1 pl-1">
                          {(() => {
                            const selectedIndex = matingGroup.matingsByDate.findIndex(
                              (m) => m.id === selectedMatingId,
                            );
                            const season = matingGroup.matingsByDate.length - selectedIndex;
                            const selectedMating = matingGroup.matingsByDate[selectedIndex];

                            return (
                              <>
                                <span className="rounded-lg bg-gray-100 p-1 px-2 text-[12px] text-gray-700">
                                  {season}시즌
                                </span>
                                {selectedMating?.matingDate
                                  ? DateTime.fromFormat(
                                      selectedMating.matingDate,
                                      "yyyy-MM-dd",
                                    ).toFormat("M월 d일")
                                  : ""}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <SelectValue placeholder="메이팅 날짜 선택" />
                      )}
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {matingGroup.matingsByDate.map((mating) => (
                        <SelectItem
                          key={mating.id}
                          value={String(mating.id)}
                          className="rounded-xl text-[16px]"
                        >
                          {mating.matingDate
                            ? DateTime.fromFormat(mating.matingDate, "yyyy-MM-dd").toFormat(
                                "M월 d일",
                              )
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* 수정/삭제 버튼 */}
                  {isEditable && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100"
                        aria-label="교배 정보 수정"
                        onClick={handleEditClick}
                      >
                        <Pencil className="h-4 w-4 text-blue-500" />
                      </button>
                      <button
                        type="button"
                        className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-100"
                        aria-label="교배 정보 삭제"
                        onClick={handleDeleteClick}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  )}
                </div>

                {/* 메이팅 추가 */}
                {isEditable && (
                  <CalendarSelect
                    triggerText="메이팅 추가"
                    confirmButtonText="메이팅 추가"
                    disabledDates={matingDates}
                    onConfirm={(matingDate) => onConfirmAdd(matingDate)}
                  />
                )}
              </div>

              {/* 선택된 메이팅 아이템 */}
              {(() => {
                const selectedMating = matingGroup.matingsByDate.find(
                  (m) => m.id === selectedMatingId,
                );
                if (!selectedMating) return null;

                return (
                  <MatingItem
                    mating={selectedMating}
                    father={matingGroup.father}
                    mother={matingGroup.mother}
                  />
                );
              })()}
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
