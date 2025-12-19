import { MatingByParentsDto, PetDtoEggStatus, PetSummaryLayingDto } from "@repo/api-client";
import { cn } from "@/lib/utils";
import { Egg, Baby, CalendarCheck, CalendarHeart, CircleCheck, StickyNote } from "lucide-react";
import PetThumbnail from "../../components/PetThumbnail";
import { DateTime } from "luxon";

import { updatePairProps } from "./PairList";
interface PairCardProps {
  pair: MatingByParentsDto;
  onClickUpdateDesc: (data: updatePairProps) => void;
  onClick: () => void;
}

interface HatchingInfo {
  date: DateTime;
  matingIndex: number;
}

const ParentCard = ({ parent }: { parent: PetSummaryLayingDto | undefined }) => {
  if (!parent) {
    return (
      <div className="flex flex-1 flex-col items-center gap-2">
        <div className="h-20 w-20 rounded-lg bg-gray-200/50" />
        <span className="text-xs text-gray-400">정보없음</span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center gap-2">
      <div className="w-full">
        <PetThumbnail imageUrl="" alt={parent.name} bgColor="bg-gray-200/90" />
      </div>
      <div className="flex flex-col items-center gap-[2px] text-center">
        <span
          className={cn("text-sm font-semibold", parent.isDeleted && "text-red-500 line-through")}
        >
          {parent.name}
        </span>
        {parent.weight && (
          <span className="text-xs text-blue-600">{Number(parent.weight).toLocaleString()}g</span>
        )}
        {parent.morphs && parent.morphs.length > 0 && (
          <span className="text-[11px] text-gray-500">{parent.morphs.slice(0, 2).join(" · ")}</span>
        )}
      </div>
    </div>
  );
};

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

  // 가장 최근 산란 정보 찾기
  const latestLaying: { date: string; matingIndex: number } | null =
    pair.matingsByDate?.reduce<{ date: string; matingIndex: number } | null>(
      (latest, mating, matingIdx) => {
        return (
          mating.layingsByDate?.reduce<{ date: string; matingIndex: number } | null>(
            (innerLatest, laying) => {
              const layingDate = DateTime.fromFormat(laying.layingDate, "yyyy-MM-dd");

              if (!innerLatest) {
                return {
                  date: laying.layingDate,
                  matingIndex: matingIdx + 1,
                };
              }

              const currentLatest = DateTime.fromFormat(innerLatest.date, "yyyy-MM-dd");
              if (layingDate > currentLatest) {
                return {
                  date: laying.layingDate,
                  matingIndex: matingIdx + 1,
                };
              }

              return innerLatest;
            },
            latest,
          ) ?? latest
        );
      },
      null,
    ) ?? null;

  // 오늘과 가장 근접한 예상 해칭일 찾기 (산란일 + 60일)
  // TODO!: 온도에 따라 계산법 있음
  const today = DateTime.now();
  const closestHatching: HatchingInfo | null =
    pair.matingsByDate?.reduce<HatchingInfo | null>((closest, mating, matingIdx) => {
      return (
        mating.layingsByDate?.reduce<HatchingInfo | null>((innerClosest, laying) => {
          const expectedDate = DateTime.fromFormat(laying.layingDate, "yyyy-MM-dd").plus({
            days: 60,
          });
          const diff = Math.abs(expectedDate.diff(today).as("milliseconds"));

          if (!innerClosest) {
            return {
              date: expectedDate,
              matingIndex: matingIdx + 1,
            };
          }

          const currentDiff = Math.abs(innerClosest.date.diff(today).as("milliseconds"));
          if (diff < currentDiff) {
            return {
              date: expectedDate,
              matingIndex: matingIdx + 1,
            };
          }

          return innerClosest;
        }, closest) ?? closest
      );
    }, null) ?? null;

  // 진행률 계산 (산란이 있으면 50%, 알이 있으면 80%, 해칭 완료면 100%)
  // TODO!: 부화 게이지로 변경
  let progress = 0;
  if (totalLayings > 0) progress = 50;
  if (totalEggs > 0) progress = 80;

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
      className="group relative flex cursor-pointer flex-col gap-3 rounded-2xl border border-gray-200/50 bg-white p-2 shadow-lg transition-all hover:shadow-xl dark:border-gray-700 dark:bg-gray-800"
    >
      {/* 상태 배지 */}
      <div className="absolute left-1 top-1 z-10 flex items-center justify-between">
        <span className={cn("rounded-lg px-3 py-1 text-xs font-semibold text-white", status.color)}>
          {status.label}
        </span>
      </div>

      {/* 부모 정보 */}
      <div className="flex items-center gap-2">
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
                {DateTime.fromFormat(latestLaying.date, "yyyy-MM-dd").toFormat("yy년 M월 d일")}(
                {latestLaying.matingIndex}차)
              </span>
            </span>
          </div>
        )}
        {totalEggs > 0 && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Egg className="h-4 w-4" />
            <span>
              유정란:
              <span className="font-[600] text-gray-900">총 {totalEggs}개</span>
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
      {progress > 0 && (
        <div className="flex flex-col gap-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-yellow-100 to-yellow-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-right text-[10px] text-gray-500">{progress}%</span>
        </div>
      )}

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
        className="group/memo dark:to-gray-750 relative cursor-pointer rounded-lg border border-gray-200 bg-gradient-to-br from-amber-50/50 to-orange-50/30 p-3 transition-all hover:border-orange-300 hover:shadow-md dark:border-gray-700 dark:from-gray-800"
      >
        <div className="flex items-start gap-2">
          <StickyNote className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-500" />
          <div className="flex-1">
            {pair.desc ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {pair.desc}
              </p>
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
