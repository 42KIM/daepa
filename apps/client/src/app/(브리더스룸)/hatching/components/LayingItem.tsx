import {
  brMatingControllerFindAll,
  LayingByDateDto,
  layingControllerUpdate,
  PetSummaryLayingDto,
} from "@repo/api-client";
import CalendarSelect from "./CalendarSelect";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { parse } from "date-fns";
import { toast } from "sonner";
import { AxiosError } from "axios";
import EggItem from "./EggItem";
import React, { useEffect, useState, useCallback } from "react";
import { ChevronDown } from "lucide-react";

interface LayingItemProps {
  layingDates: string[];
  layingData: LayingByDateDto;
  matingDate?: string;
  closeSignal?: number;
  father?: PetSummaryLayingDto;
  mother?: PetSummaryLayingDto;
}
const toDate = (s: string): Date => {
  if (/^\d{8}$/.test(s)) return parse(s, "yyyyMMdd", new Date());
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return parse(s, "yyyy-MM-dd", new Date());
  return new Date(s);
};

const normalizeDate = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const LayingItem = ({
  layingDates,
  layingData: { layingDate, layings, layingId },
  matingDate,
  closeSignal,
  father,
  mother,
}: LayingItemProps) => {
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);

  const { mutateAsync: updateLayingDate } = useMutation({
    mutationFn: ({ id, newLayingDate }: { id: number; newLayingDate: string }) =>
      layingControllerUpdate(id, { layingDate: newLayingDate }),
  });

  useEffect(() => {
    if (closeSignal !== undefined) {
      setIsOpen(false);
    }
  }, [closeSignal]);

  const getDisabledDates = useCallback(
    (currentLayingDate: string) => {
      const currentDate = normalizeDate(toDate(currentLayingDate));
      const matingDateObj = matingDate ? normalizeDate(toDate(matingDate)) : null;

      return (date: Date) => {
        const normalizedDate = normalizeDate(date);

        // 현재 산란일 자체는 비활성화 (편집 모드에서 현재 날짜는 선택 불가)
        return (
          normalizedDate.getTime() === currentDate.getTime() ||
          (matingDateObj !== null && normalizedDate.getTime() < matingDateObj.getTime())
        );
      };
    },
    [matingDate],
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
    <div className="rounded-xl border border-gray-200 pt-0 shadow-sm hover:bg-gray-50 hover:shadow-md">
      <div className="flex h-10 items-center justify-between gap-2 px-2">
        {!!layings?.[0] && (
          <span className="text-sm font-bold italic text-blue-500">
            {layings[0].clutch}차
          </span>
        )}
        <CalendarSelect
          type="edit"
          disabledDates={layingDates}
          triggerText={layingDate}
          confirmButtonText="산란 날짜 수정"
          onConfirm={(newLayingDate) => handleUpdateLayingDate(layingId, newLayingDate)}
          disabled={getDisabledDates(layingDate)}
        />
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex h-full flex-1 cursor-pointer items-center justify-end"
        >
          <ChevronDown
            className={`h-4 w-4 text-blue-600 transition-transform duration-300 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>
      </div>

      <div
        className={`grid grid-cols-2 gap-1 overflow-hidden pt-0 transition-all duration-300 ease-in-out md:grid-cols-3 ${
          isOpen ? "max-h-[1000px] p-2 pt-0 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {layings.map((pet) => (
          <EggItem
            key={pet.petId}
            pet={pet}
            layingDate={layingDate}
            fatherName={father?.name}
            motherName={mother?.name}
          />
        ))}
      </div>
    </div>
  );
};

export default LayingItem;
