import { MatingByParentsDto, PetDtoEggStatus } from "@repo/api-client";
import { getIncubationDays } from "@/lib/utils";
import { StickyNote } from "lucide-react";
import { DateTime } from "luxon";

import { updatePairProps } from "./PairList";
import ParentCard from "./ParentCard";
import TooltipText from "../../components/TooltipText";
import PairMiniCalendar from "./PairMiniCalendar";

interface PairCardProps {
  pair: MatingByParentsDto;
  onClickUpdateDesc: (data: updatePairProps) => void;
  onClick: () => void;
  onDateClick?: (matingId: number) => void;
}

interface HatchingInfo {
  date: DateTime;
  matingIndex: number;
}

const PairCard = ({ pair, onClick, onClickUpdateDesc, onDateClick }: PairCardProps) => {
  // 총 유정란 개수 계산 (eggStatus가 'FERTILIZED'인 경우만)
  const totalEggs =
    pair.matingsByDate?.reduce((acc, mating) => {
      const eggCount =
        mating.layingsByDate?.reduce((sum, laying) => {
          const fertilizedCount =
            laying.layings?.filter((egg) => egg.eggStatus === PetDtoEggStatus.FERTILIZED).length ??
            0;
          return sum + fertilizedCount;
        }, 0) ?? 0;
      return acc + eggCount;
    }, 0) ?? 0;

  // 전체 알 개수 계산 (모든 eggStatus 포함)
  const totalAllEggs =
    pair.matingsByDate?.reduce((acc, mating) => {
      const eggCount =
        mating.layingsByDate?.reduce((sum, laying) => {
          return sum + (laying.layings?.length ?? 0);
        }, 0) ?? 0;
      return acc + eggCount;
    }, 0) ?? 0;

  // 총 부화 개수 계산 (eggStatus가 'HATCHED'인 경우만)
  const totalHatched =
    pair.matingsByDate?.reduce((acc, mating) => {
      const hatchedCount =
        mating.layingsByDate?.reduce((sum, laying) => {
          const hatched =
            laying.layings?.filter((egg) => egg.eggStatus === PetDtoEggStatus.HATCHED).length ?? 0;
          return sum + hatched;
        }, 0) ?? 0;
      return acc + hatchedCount;
    }, 0) ?? 0;

  // 해칭 임박한 알 찾기: 아직 부화하지 않은 유정란 중 가장 가까운 예상 해칭일
  const today = DateTime.now();
  const closestHatching: HatchingInfo | null =
    pair.matingsByDate?.reduce<HatchingInfo | null>((closest, mating, matingIdx) => {
      return (
        mating.layingsByDate?.reduce<HatchingInfo | null>((innerClosest, laying) => {
          // 아직 부화하지 않은 유정란이 있는지 확인
          const hasFertilizedEggs = laying.layings?.some(
            (egg) => egg.eggStatus === PetDtoEggStatus.FERTILIZED,
          );

          if (!hasFertilizedEggs) return innerClosest;

          // 온도 기반 해칭일 계산 (기본 25°C)
          const incubationDays = getIncubationDays(laying.layings[0]?.temperature);
          const expectedDate = DateTime.fromFormat(laying.layingDate, "yyyy-MM-dd").plus({
            days: incubationDays,
          });

          // 미래 날짜만 고려 (이미 지난 예상 해칭일은 제외)
          if (expectedDate < today) return innerClosest;

          const diff = expectedDate.diff(today).as("milliseconds");

          if (!innerClosest) {
            return {
              date: expectedDate,
              matingIndex: matingIdx + 1,
            };
          }

          const currentDiff = innerClosest.date.diff(today).as("milliseconds");
          if (diff < currentDiff && diff >= 0) {
            return {
              date: expectedDate,
              matingIndex: matingIdx + 1,
            };
          }

          return innerClosest;
        }, closest) ?? closest
      );
    }, null) ?? null;
  console.log("🚀 ~ PairCard ~ closestHatching:", closestHatching);

  return (
    <div className="group relative flex flex-col rounded-2xl border border-gray-200/50 bg-white p-2 shadow-lg transition-all hover:border-gray-300 hover:bg-gray-100/20 hover:shadow-xl dark:border-gray-700 dark:bg-neutral-800">
      {/* 부모 정보 */}
      <div className="flex flex-1 items-center gap-2">
        <ParentCard parent={pair.father} />
        <ParentCard parent={pair.mother} />
      </div>

      {/* 미니 캘린더 */}
      <PairMiniCalendar
        matingsByDate={pair.matingsByDate ?? []}
        onDateClick={(matingId) => {
          onClick();
          onDateClick?.(matingId);
        }}
      />

      {/* 요약 정보 */}
      <div className="mt-1 flex flex-col items-center gap-1">
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <span>유정란/전체</span>

            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {totalEggs}/{totalAllEggs}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span>
              해칭{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">{totalHatched}</span>
            </span>
          </div>
        </div>

        {closestHatching && (
          <div className="flex w-full items-center justify-between rounded-lg bg-green-100 px-3 py-2 dark:bg-green-900/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-green-700 dark:text-green-300">
                해칭 예정일
              </span>
              <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                {closestHatching.date.toFormat("M월 d일")}
              </span>
            </div>
            <span className="text-xs font-bold text-green-600 dark:text-green-400">
              {Math.ceil(closestHatching.date.diff(today, "days").days) === 0
                ? "D-Day"
                : `D-${Math.ceil(closestHatching.date.diff(today, "days").days)}`}
            </span>
          </div>
        )}
      </div>

      {/* 메모 영역 */}
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClickUpdateDesc({
            pairId: pair.pairId,
            desc: pair.desc,
          });
        }}
        className="group/memo relative mt-3 cursor-pointer rounded-lg border border-gray-200 bg-gradient-to-br from-amber-50/50 to-orange-50/30 px-3 transition-all hover:border-orange-300 hover:shadow-md dark:border-gray-700 dark:from-neutral-800 dark:to-neutral-800"
      >
        <div className="flex items-center gap-2">
          <StickyNote className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="flex-1 py-3">
            {pair.desc ? (
              <TooltipText text={pair.desc} className="w-full text-sm" displayTextLength={50} />
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">
                메모를 추가하려면 클릭하세요
              </p>
            )}
          </div>
          <div className="flex-shrink-0 opacity-0 transition-opacity group-hover/memo:opacity-100">
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">편집</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PairCard;
