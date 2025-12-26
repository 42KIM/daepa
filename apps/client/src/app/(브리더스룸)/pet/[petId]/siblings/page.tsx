"use client";

import { petControllerGetSiblingsByPetId, SiblingPetDetailDto } from "@repo/api-client";
import { useQuery } from "@tanstack/react-query";
import { use, useMemo } from "react";
import SiblingPetCard from "./components/SiblingPetCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface PetDetailPageProps {
  params: Promise<{
    petId: string;
  }>;
}

function isVisiblePet(pet: unknown): pet is SiblingPetDetailDto {
  return typeof pet === "object" && pet !== null && !("hiddenStatus" in pet);
}

function SiblingsPage({ params }: PetDetailPageProps) {
  const { petId } = use(params);

  const { data: siblingsData, isLoading } = useQuery({
    queryKey: [petControllerGetSiblingsByPetId.name, petId],
    queryFn: () => petControllerGetSiblingsByPetId(petId),
    select: (response) => response.data.data,
  });

  const { myProfile, sameClutchSiblings, otherClutchSiblings } = useMemo(() => {
    if (!siblingsData?.siblings) {
      return { myProfile: null, sameClutchSiblings: [], otherClutchSiblings: [] };
    }

    // 자기 자신 찾기
    const me = siblingsData.siblings.find(
      (sibling) => isVisiblePet(sibling) && sibling.petId === petId,
    ) as SiblingPetDetailDto | undefined;

    // 자기 자신의 layingDate
    const myLayingDate = me?.laying?.layingDate;

    // siblings 분류 (자기 자신 제외)
    const others = siblingsData.siblings.filter((sibling) => sibling.petId !== petId);

    const sameClutch = others.filter((sibling) => {
      if (!isVisiblePet(sibling)) return false;
      return sibling.laying?.layingDate === myLayingDate;
    });

    const otherClutch = others.filter((sibling) => {
      if (!isVisiblePet(sibling)) return false;
      return sibling.laying?.layingDate !== myLayingDate;
    });

    return {
      myProfile: me ?? null,
      sameClutchSiblings: sameClutch,
      otherClutchSiblings: [...otherClutch],
    };
  }, [siblingsData, petId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!siblingsData) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">형제 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* 1. 부모 프로필 */}
      {(siblingsData.father || siblingsData.mother) && (
        <section>
          <h2 className="mb-3 text-[16px] font-bold text-gray-900">부모</h2>
          <div className="flex gap-3">
            {siblingsData.father && (
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-medium text-blue-600">부</span>
                <SiblingPetCard pet={siblingsData.father} />
              </div>
            )}
            {siblingsData.mother && (
              <div className="flex flex-col gap-1">
                <span className="text-[12px] font-medium text-red-600">모</span>
                <SiblingPetCard pet={siblingsData.mother} />
              </div>
            )}
          </div>
        </section>
      )}
      <div className="flex gap-6">
        {/* 2. 내 프로필 */}
        {myProfile && (
          <section>
            <h2 className="mb-3 text-[16px] font-bold text-gray-900">내 프로필</h2>
            <SiblingPetCard pet={myProfile} />
          </section>
        )}

        {/* 3. 클러치 메이트 */}
        {sameClutchSiblings.length > 0 && (
          <section className="min-w-0 flex-1 overflow-hidden">
            <h2 className="mb-3 text-[16px] font-bold text-gray-900">클러치 메이트</h2>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-3 pb-3">
                {sameClutchSiblings.map((sibling) => (
                  <SiblingPetCard key={sibling.petId} pet={sibling} />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </section>
        )}
      </div>

      {/* 4. 부모가 같은 펫 */}
      {otherClutchSiblings.length > 0 && (
        <section>
          <h2 className="mb-3 text-[16px] font-bold text-gray-900">부모가 같은 펫</h2>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-3">
              {otherClutchSiblings.map((sibling) => (
                <SiblingPetCard key={sibling.petId} pet={sibling} />
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      )}

      {/* 형제가 없는 경우 */}
      {sameClutchSiblings.length === 0 && otherClutchSiblings.length === 0 && (
        <div className="flex h-32 items-center justify-center text-gray-500">형제가 없습니다.</div>
      )}
    </div>
  );
}

export default SiblingsPage;
