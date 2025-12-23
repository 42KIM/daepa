import Loading from "@/components/common/Loading";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  brMatingControllerFindAll,
  matingControllerCreateMating,
  PetDtoSpecies,
  UpdatePairDto,
} from "@repo/api-client";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { memo, useEffect, useState } from "react";
import CreateMatingForm from "./CreateMatingForm";
import { AxiosError } from "axios";
import { useInView } from "react-intersection-observer";
import Filters from "./Filters";
import { useMatingFilterStore } from "../../store/matingFilter";
import { format } from "date-fns";
import { isNil, omitBy } from "es-toolkit";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import MatingDetailDialog from "./MatingDetailDialog";
import PairCard from "./PairCard";
import { overlay } from "overlay-kit";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UpdatePairModal from "./UpdatePairModal";

export interface updatePairProps extends UpdatePairDto {
  pairId: number;
}

const PairList = memo(() => {
  const { ref, inView } = useInView();
  const { species, father, mother, startDate, endDate, eggStatus } = useMatingFilterStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPairIndex, setSelectedPairIndex] = useState<number | null>(null);
  const itemPerPage = 10;

  const hasFilter =
    !!species || !!father?.petId || !!mother?.petId || !!startDate || !!endDate || !!eggStatus;

  // 메이팅 조회 (무한 스크롤)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch } =
    useInfiniteQuery({
      queryKey: [
        brMatingControllerFindAll.name,
        species,
        father?.petId,
        mother?.petId,
        startDate,
        endDate,
        eggStatus,
      ],
      queryFn: ({ pageParam = 1 }) => {
        const startYmd = startDate ? format(startDate, "yyyy-MM-dd") : undefined;
        const endYmd = endDate ? format(endDate, "yyyy-MM-dd") : undefined;
        const filter = omitBy(
          {
            species: species ?? undefined,
            fatherId: father?.petId,
            motherId: mother?.petId,
            startYmd,
            endYmd,
            eggStatus: eggStatus ?? undefined,
          },
          isNil,
        );

        return brMatingControllerFindAll({
          page: pageParam,
          itemPerPage,
          order: "DESC",
          ...filter,
        });
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        if (lastPage.data.meta.hasNextPage) {
          return lastPage.data.meta.page + 1;
        }
        return undefined;
      },
      select: (resp) => ({
        items: resp.pages.flatMap((p) => p.data.data),
        totalCount: resp.pages[0]?.data.meta.totalCount,
      }),
    });

  const pair = selectedPairIndex !== null ? (data?.items[selectedPairIndex] ?? null) : null;

  // 메이팅 추가
  const { mutateAsync: createMating } = useMutation({
    mutationFn: matingControllerCreateMating,
  });

  const handleClickUpdateDesc = (pair: updatePairProps) => {
    if (!pair?.pairId) return toast.error("오류가 발생했습니다. 잠시후에 다시 시도해주세요.");

    overlay.open(({ isOpen, close }) => (
      <UpdatePairModal
        pair={pair}
        isOpen={isOpen}
        close={close}
        onSuccess={async () => {
          await refetch();
        }}
      />
    ));
  };

  // 무한 스크롤 처리
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) return <Loading />;

  const handleOpenCreateForm = () => {
    overlay.open(({ isOpen, close }) => (
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>새 페어 추가</DialogTitle>
          </DialogHeader>
          <CreateMatingForm onClose={close} />
        </DialogContent>
      </Dialog>
    ));
  };

  if (data?.items && data.items.length === 0 && !hasFilter) {
    return (
      <div className="flex flex-col items-center space-y-4 px-2">
        <Card
          className="flex w-full cursor-pointer flex-col items-center justify-center bg-blue-50 p-10 hover:bg-blue-100 dark:bg-gray-900 dark:text-gray-200"
          onClick={handleOpenCreateForm}
        >
          <div
            className={cn(
              "flex w-fit cursor-pointer flex-col items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100",
            )}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[14px] font-[500] text-blue-600">
              <Plus className="h-3 w-3" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 text-[14px] font-[500] text-blue-600">
              페어 추가하기
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const handleAddPairClick = async ({
    species,
    fatherId,
    motherId,
    matingDate,
  }: {
    species?: PetDtoSpecies;
    fatherId?: string;
    motherId?: string;
    matingDate: string;
  }) => {
    if (!species) {
      toast.error("종을 선택해주세요.");
      return;
    }

    if (!matingDate) {
      toast.error("메이팅 날짜를 선택해주세요.");
      return;
    }

    try {
      await createMating({
        species,
        matingDate,
        fatherId,
        motherId,
      });

      toast.success("페어 정보가 추가되었습니다.");
      const result = await refetch();

      // 새로운 데이터에서 현재 pair와 동일한 페어를 찾아서 index 업데이트
      if (result.data?.items && pair) {
        const updatedIndex = result.data.items.findIndex(
          (item) =>
            item.father?.petId === pair.father?.petId && item.mother?.petId === pair.mother?.petId,
        );
        if (updatedIndex !== -1) {
          setSelectedPairIndex(updatedIndex);
        }
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "페어 정보 추가에 실패했습니다.");
      } else {
        toast.error("페어 정보 추가에 실패했습니다.");
      }
    }
  };

  return (
    <div className="flex flex-col px-2">
      {/* 헤더 영역 */}
      <div
        className={cn(
          "flex w-fit cursor-pointer items-center rounded-lg px-2 py-1 hover:bg-gray-100",
        )}
        onClick={handleOpenCreateForm}
      >
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[14px] font-[500] text-blue-600">
          <Plus className="h-3 w-3" />
        </div>
        <div className="flex items-center gap-1 px-2 py-1 text-[14px] font-[500] text-blue-600">
          페어 추가하기
        </div>
      </div>
      {/* 필터 */}
      <Filters />
      <div className="m-2 text-sm text-gray-600 dark:text-gray-400">
        검색된 페어 {data?.totalCount ?? "?"}쌍
      </div>

      <ScrollArea>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-5">
          {data?.items.map((pair, index) => (
            <PairCard
              key={index}
              pair={pair}
              onClickUpdateDesc={handleClickUpdateDesc}
              onClick={() => {
                setIsOpen(true);
                setSelectedPairIndex(index);
              }}
            />
          ))}
        </div>

        {hasNextPage && (
          <div ref={ref} className="h-20 text-center">
            {isFetchingNextPage && <Loading />}
          </div>
        )}
        <div className="h-10" />
      </ScrollArea>

      <MatingDetailDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        matingGroup={pair}
        onConfirmAdd={async (matingDate) => {
          if (!pair?.father || !pair?.mother) {
            toast.error("부모 개체가 없습니다.");
            return;
          }
          await handleAddPairClick({
            species: pair.father?.species,
            fatherId: pair.father?.petId,
            motherId: pair.mother?.petId,
            matingDate,
          });
        }}
      />
    </div>
  );
});

PairList.displayName = "PairList";

export default PairList;
