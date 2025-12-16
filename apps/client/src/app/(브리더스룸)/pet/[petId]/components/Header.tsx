import { Dog } from "lucide-react";
import QRCode from "./QR코드";
import Image from "next/image";
import { buildR2TransformedUrl, cn } from "@/lib/utils";
import { PetAdoptionDtoStatus, PetDto, petImageControllerFindOne } from "@repo/api-client";
import { SPECIES_KOREAN_ALIAS_INFO } from "@/app/(브리더스룸)/constants";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DeletePetDialog } from "./DeletePetDialog";
import { useAdoptionStore } from "@/app/(브리더스룸)/pet/store/adoption";
import { useBreedingInfoStore } from "../../store/breedingInfo";
import { useEffect, useState } from "react";

type TabType = "breeding" | "adoption" | "images" | "pedigree";

interface HeaderProps {
  pet: PetDto;
  tabs: { id: string; label: string; ref: React.RefObject<HTMLDivElement | null> }[];
  activeTab: TabType;
  onTabClick: (tabId: TabType, ref: React.RefObject<HTMLDivElement>) => void;
}

const Header = ({ pet, tabs, activeTab, onTabClick }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { data: photos = [] } = useQuery({
    queryKey: [petImageControllerFindOne.name, pet.petId],
    queryFn: () => petImageControllerFindOne(pet.petId),
    select: (response) => response.data,
  });

  const { breedingInfo } = useBreedingInfoStore();
  const breedingData = breedingInfo?.petId === pet?.petId ? breedingInfo : null;
  const { adoption } = useAdoptionStore();
  const adoptionData = adoption?.petId === pet?.petId ? adoption : null;

  if (!pet) return null;

  return (
    <div
      className={cn(
        "sticky top-0 z-10 flex flex-col gap-2 bg-gray-100 transition-all",
        isScrolled ? "py-1" : "",
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "relative flex items-center justify-center rounded-2xl transition-all",
            isScrolled ? "h-12 w-12" : "h-18 w-18",
          )}
        >
          {photos[0]?.url ? (
            <Image
              src={buildR2TransformedUrl(photos[0]?.url)}
              alt={pet.petId}
              fill
              className="rounded-2xl object-cover"
            />
          ) : (
            <Dog
              className={cn("text-gray-500 transition-all", isScrolled ? "h-8 w-8" : "h-12 w-12")}
            />
          )}
        </div>
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-2">
            {pet.name ? (
              <div
                className={cn(
                  "flex font-bold transition-all max-[480px]:text-[14px]",
                  isScrolled ? "text-[14px]" : "text-[16px]",
                )}
              >
                {pet.name}
              </div>
            ) : (
              <div
                className={cn(
                  "flex items-center gap-1 font-bold transition-all",
                  isScrolled ? "text-[14px]" : "text-[16px]",
                )}
              >
                {pet.father && "petId" in pet.father && "name" in pet.father ? (
                  <Link
                    href={`/pet/${pet.father?.petId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {pet.father?.name}
                  </Link>
                ) : (
                  "-"
                )}
                x
                {pet.mother && "petId" in pet.mother && "name" in pet.mother ? (
                  <Link
                    href={`/pet/${pet.mother?.petId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {pet.mother?.name}
                  </Link>
                ) : (
                  "-"
                )}
              </div>
            )}
            <div
              className={cn(
                "flex-1 text-gray-500 transition-all max-[480px]:text-xs",
                isScrolled ? "text-xs" : "text-sm",
              )}
            >
              {SPECIES_KOREAN_ALIAS_INFO[pet.species]}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div
              className={cn(
                "flex w-fit items-center justify-center rounded-md px-2 font-semibold text-white transition-all max-[480px]:h-[22px] max-[480px]:text-xs",
                isScrolled ? "h-[22px] text-xs" : "h-[26px] text-sm",
                breedingData?.isPublic ? "bg-neutral-800" : "bg-yellow-500 text-neutral-700",
              )}
            >
              {breedingData?.isPublic ? "공개" : "비공개"}
            </div>
            {adoptionData?.status === PetAdoptionDtoStatus.NFS && (
              <div
                className={cn(
                  "flex w-fit items-center justify-center rounded-md bg-pink-500 px-2 font-semibold text-white transition-all max-[480px]:h-[22px] max-[480px]:text-xs",
                  isScrolled ? "h-[22px] text-xs" : "h-[26px] text-sm",
                )}
              >
                NFS
              </div>
            )}
          </div>

          <div
            className={cn(
              "font-semibold text-gray-800 transition-all max-[480px]:text-[16px]",
              isScrolled ? "text-[16px]" : "text-[18px]",
            )}
          >
            {adoptionData?.price && `${adoptionData.price.toLocaleString()}원`}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DeletePetDialog petId={pet.petId} petName={pet.name} />
          <QRCode petId={pet.petId} isScrolled={isScrolled} />
        </div>
      </div>

      {/* Tab Navigation - Only visible on screens 580px or smaller */}
      <div className="sticky top-[72px] z-10 hidden gap-2 overflow-x-auto border-b border-gray-200 bg-white p-2 px-1 max-[580px]:flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              onTabClick(tab.id as TabType, tab.ref as React.RefObject<HTMLDivElement>)
            }
            className={cn(
              "whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-neutral-800 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Header;
