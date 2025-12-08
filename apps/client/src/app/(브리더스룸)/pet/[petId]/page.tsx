"use client";

import { petControllerFindPetByPetId } from "@repo/api-client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";

import BreedingInfo from "./components/사육정보";
import Header from "./components/Header";
import AdoptionInfo from "./components/분양정보";
import Images from "./components/이미지";
import PedigreeInfo from "./components/혈통정보";
import Loading from "@/components/common/Loading";

interface PetDetailPageProps {
  params: Promise<{
    petId: string;
  }>;
}

function PetDetailPage({ params }: PetDetailPageProps) {
  const { petId } = use(params);

  const {
    data: pet,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [petControllerFindPetByPetId.name, petId],
    queryFn: () => petControllerFindPetByPetId(petId),
    select: (response) => response.data.data,
  });

  if (isLoading) return <Loading />;

  if (isError) {
    const status = (error as any)?.response?.status;
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center gap-2">
        <p className="text-lg font-semibold text-gray-700">
          {status === 404 ? "펫을 찾을 수 없습니다" : "펫 정보를 불러오는 중 오류가 발생했습니다"}
        </p>
        <p className="text-sm text-gray-500">
          {status === 404 ? "존재하지 않거나 삭제된 펫입니다" : "잠시 후 다시 시도해주세요"}
        </p>
      </div>
    );
  }

  if (!pet) return null;

  return (
    <div className="flex h-full flex-1 flex-col gap-3">
      <Header pet={pet} />

      <div className="flex flex-wrap gap-3 max-[960px]:flex-wrap">
        {/* 사육정보 (개체 이름, 종, 성별, 크기, 모프, 형질, 먹이) */}
        <BreedingInfo petId={petId} />
        {/* 분양 정보 */}
        <AdoptionInfo petId={petId} />

        {/* 사진 */}
        <Images pet={pet} />

        <PedigreeInfo species={pet.species} petId={petId} userId={pet.owner.userId} />
      </div>
    </div>
  );
}

export default PetDetailPage;
