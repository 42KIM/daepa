import { MatingByParentsDto, PetDtoEggStatus } from "@repo/api-client";
import { cn } from "@/lib/utils";
import { Egg, Baby, CalendarCheck, CalendarHeart, CircleCheck, StickyNote } from "lucide-react";
import { DateTime } from "luxon";

import { updatePairProps } from "./PairList";
import ParentCard from "./ParentCard";
import TooltipText from "../../components/TooltipText";
import { useMemo } from "react";
import { maxBy, orderBy } from "es-toolkit";
interface PairCardProps {
  pair: MatingByParentsDto;
  onClickUpdateDesc: (data: updatePairProps) => void;
  onClick: () => void;
}

interface HatchingInfo {
  date: DateTime;
  matingIndex: number;
}

const PairCard = ({ pair, onClick, onClickUpdateDesc }: PairCardProps) => {
  // 총 산란 횟수 계산
  const totalLayings =
    pair.matingsByDate?.reduce((acc, mating) => {
      return acc + (mating.layingsByDate?.length ?? 0);
    }, 0) ?? 0;

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

  // 가장 최근 메이팅 정보 (1차)
  const latestMating = pair.matingsByDate?.[0];
  const latestMatingDate = latestMating?.matingDate;
  const latestMatingIndex = pair.matingsByDate?.length ?? 1; // 배열의 첫 번째는 1차

  // 가장 최근 메이팅(시즌) 내에서 가장 최근 산란 정보 찾기
  const latestLaying = useMemo(() => {
    if (!latestMating?.layingsByDate || latestMating.layingsByDate.length === 0) {
      return null;
    }

    const layingsOrdersByDesc = orderBy(latestMating.layingsByDate, ["layingDate"], ["desc"]);
    const latestLayingDate = layingsOrdersByDesc[0]?.layingDate;
    const latestLayingIndex = layingsOrdersByDesc.length;

    return {
      date: latestLayingDate,
      layingIndex: latestLayingIndex,
    };
  }, [latestMating?.layingsByDate]);

  // 온도 기반 해칭 기간 계산 (일 단위)
  // 파충류(크레스티드 게코) 기준: 온도에 따라 부화 기간이 달라짐
  // 25°C 기준: 약 65일
  // 27-28°C: 약 55일
  // 22-24°C: 약 75일
  const getIncubationDays = (temperature = 25) => {
    if (temperature >= 27) return 55;
    if (temperature >= 25) return 65;
    if (temperature >= 22) return 75;
    return 65; // 기본값
  };

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
          const incubationDays = getIncubationDays(25);
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

  // 진행률 계산: 전체 알 개수 중 부화한 알의 퍼센테이지
  // (부화한 알 개수 / 전체 알 개수) * 100
  const progress = totalAllEggs > 0 ? Math.round((totalHatched / totalAllEggs) * 100) : 0;

  // 상태 결정 -> 해칭 대기중 , 첫 시즌
  const getStatus = () => {
    if (totalEggs > 0) return { label: "부화 대기", color: "bg-yellow-500" };
    if (totalLayings > 0) return { label: "산란 완료", color: "bg-blue-500" };
    return { label: "메이팅 완료", color: "bg-green-500" };
  };

  const status = getStatus();

  return (
    <div
      onClick={onClick}
      className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-gray-200/50 bg-white p-2 shadow-lg transition-all hover:border-gray-300 hover:bg-gray-100/20 hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
    >
      {/* 상태 배지 */}
      <div className="absolute left-1 top-1 z-10 flex items-center justify-between">
        <span className={cn("rounded-lg px-3 py-1 text-xs font-semibold text-white", status.color)}>
          {status.label}
        </span>
      </div>

      {/* 부모 정보 */}
      <div className="flex flex-1 items-center gap-2">
        <ParentCard parent={pair.father} />
        <ParentCard parent={pair.mother} />
      </div>

      {/* 구분선 */}
      <div className="h-px bg-gray-200 dark:bg-gray-700" />

      {/* 메이팅 정보 */}
      <div className="flex flex-col gap-2 text-xs">
        {latestMatingDate && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <CalendarHeart className="h-4 w-4" />
            <span>
              최근 메이팅:
              <span className="font-[600] text-gray-900">
                {" "}
                {DateTime.fromFormat(latestMatingDate, "yyyy-MM-dd").toFormat("yy년 M월 d일")} (
                {latestMatingIndex}시즌)
              </span>
            </span>
          </div>
        )}
        {latestLaying && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <CalendarCheck className="h-4 w-4" />
            <span>
              최근 산란:
              <span className="font-[600] text-gray-900">
                {" "}
                {DateTime.fromFormat(latestLaying.date ?? "", "yyyy-MM-dd").toFormat(
                  "yy년 M월 d일",
                )}{" "}
                ({latestLaying.layingIndex}차)
              </span>
            </span>
          </div>
        )}
        {totalEggs > 0 && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Egg className="h-4 w-4" />
            <span>
              유정란:
              <span className="font-[600] text-gray-900"> 총 {totalEggs}개</span>
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <CircleCheck className="h-4 w-4" />
          <span>
            해칭된 알 :
            {totalHatched > 0 ? (
              <span className="font-[600] text-gray-900"> 총 {totalHatched}개</span>
            ) : (
              <span> 없음</span>
            )}
          </span>
        </div>

        {closestHatching && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Baby className="h-4 w-4" />
            <span>
              해칭 임박:
              <span className="font-[600] text-gray-900">
                {" "}
                {closestHatching.date.toFormat("yy.MM.dd")} ({closestHatching.matingIndex}차)
              </span>
            </span>
          </div>
        )}
      </div>

      {/* 진행률 바 */}

      <div className="flex flex-col gap-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-yellow-100 to-yellow-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-right text-[10px] text-gray-500">{progress}%</span>
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
        className="group/memo dark:to-gray-750 relative cursor-pointer rounded-lg border border-gray-200 bg-gradient-to-br from-amber-50/50 to-orange-50/30 px-3 transition-all hover:border-orange-300 hover:shadow-md dark:border-gray-700 dark:from-gray-800"
      >
        <div className="flex items-center gap-2">
          <StickyNote className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="flex-1">
            {pair.desc ? (
              <TooltipText
                text={pair.desc}
                className="w-full py-3 text-sm"
                displayTextLength={50}
              />
            ) : (
              <p className="py-3 text-sm text-gray-400 dark:text-gray-500">
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
