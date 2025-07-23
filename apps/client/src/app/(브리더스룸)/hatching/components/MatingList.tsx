import Loading from "@/components/common/Loading";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CommonResponseDto,
  MatingByDateDto,
  matingControllerCreateMating,
  matingControllerFindAll,
} from "@repo/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import MatingItem from "./MatingItem";
import { toast } from "sonner";
import { getNumberToDate } from "@/lib/utils";
import { useCallback } from "react";
import { AxiosError } from "axios";
import Link from "next/link";
import CalendarSelect from "./CalendarSelect";

const MatingList = () => {
  const queryClient = useQueryClient();
  const { data: matings, isPending } = useQuery({
    queryKey: [matingControllerFindAll.name],
    queryFn: matingControllerFindAll,
    select: (data) => data.data,
  });

  // 메이팅 날짜들을 추출하여 Calendar용 날짜 배열 생성
  const matingDates = useCallback((matingDates: MatingByDateDto[]) => {
    if (!matingDates) return [];

    return matingDates.map((mating) => getNumberToDate(mating.matingDate));
  }, []);

  const { mutate: createMating } = useMutation({
    mutationFn: matingControllerCreateMating,
    onSuccess: () => {
      toast.success("메이팅이 추가되었습니다.");
      queryClient.invalidateQueries({ queryKey: [matingControllerFindAll.name] });
    },
    onError: (error: AxiosError<CommonResponseDto>) => {
      toast.error(error.response?.data?.message ?? "메이팅 추가에 실패했습니다.");
    },
  });

  if (isPending) {
    return <Loading />;
  }

  if (!matings || matings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            메이팅 현황
          </CardTitle>
          <CardDescription>등록된 메이팅이 없습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleAddMatingClick = ({
    fatherId,
    motherId,
    matingDate,
  }: {
    fatherId?: string;
    motherId?: string;
    matingDate: string;
  }) => {
    if (!matingDate) {
      toast.error("메이팅 날짜를 선택해주세요.");
      return;
    }

    const matingDateNumber = parseInt(matingDate.replace(/-/g, ""), 10);

    createMating({
      matingDate: matingDateNumber,
      fatherId,
      motherId,
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-500" />
            메이팅 현황
          </CardTitle>
          <CardDescription>최근 메이팅 정보를 확인하세요</CardDescription>
        </CardHeader>
      </Card>

      <ScrollArea className="h-[700px]">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {matings.map((matingGroup, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-lg border-2 border-pink-100 px-2 py-4 shadow-md"
            >
              <div>
                <div className="flex flex-1 gap-2">
                  {matingGroup.father && (
                    <Link
                      href={`/pet/${matingGroup.father.petId}`}
                      className="flex flex-1 items-center justify-center rounded-md bg-blue-100 p-1 text-blue-800 hover:bg-blue-200"
                    >
                      {matingGroup.father.name}
                    </Link>
                  )}
                  {matingGroup.mother && (
                    <Link
                      href={`/pet/${matingGroup.mother.petId}`}
                      className="flex flex-1 items-center justify-center rounded-md bg-pink-100 p-1 text-pink-800 hover:bg-pink-200"
                    >
                      {matingGroup.mother.name}
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 px-1">
                <div className="flex w-full items-center justify-center gap-2 rounded-lg bg-yellow-100 p-2 text-sm font-semibold text-yellow-800 transition-colors hover:bg-yellow-200">
                  <CalendarSelect
                    triggerText="메이팅을 추가하려면 날짜를 선택하세요"
                    disabledDates={matingDates(matingGroup?.matingsByDate ?? [])}
                    onConfirm={(matingDate) =>
                      handleAddMatingClick({
                        fatherId: matingGroup.father?.petId,
                        motherId: matingGroup.mother?.petId,
                        matingDate,
                      })
                    }
                  />
                </div>
                {matingGroup.matingsByDate.map((mating) => (
                  <MatingItem
                    key={mating.id}
                    mating={mating}
                    father={matingGroup.father}
                    mother={matingGroup.mother}
                    matingDates={matingDates(matingGroup?.matingsByDate ?? [])}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MatingList;
