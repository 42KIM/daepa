import { Dog } from "lucide-react";
import QRCode from "./QR코드";
import Image from "next/image";
import { buildR2TransformedUrl, cn } from "@/lib/utils";
import { PetAdoptionDtoStatus, PetDto, petImageControllerFindOne } from "@repo/api-client";
import { SPECIES_KOREAN_INFO } from "@/app/(브리더스룸)/constants";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { DeletePetDialog } from "./DeletePetDialog";
import { useAdoptionStore } from "@/app/(브리더스룸)/pet/store/adoption";
import { useBreedingInfoStore } from "../../store/breedingInfo";

const Header = ({ pet }: { pet: PetDto }) => {
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
    <div className="flex items-center gap-2 pb-3">
      <div className="h-18 w-18 relative flex items-center justify-center rounded-2xl bg-yellow-200">
        {photos[0]?.url ? (
          <Image
            src={buildR2TransformedUrl(photos[0]?.url)}
            alt={pet.petId}
            fill
            className="rounded-2xl object-cover"
          />
        ) : (
          <Dog className="h-12 w-12 text-gray-500" />
        )}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2">
          {pet.name ? (
            <div className="text-[16px] font-bold">{pet.name}</div>
          ) : (
            <div className="flex items-center gap-1 text-[16px] font-bold">
              {pet.father && "petId" in pet.father && "name" in pet.father ? (
                <Link href={`/pet/${pet.father?.petId}`} className="text-blue-600 hover:underline">
                  {pet.father?.name}
                </Link>
              ) : (
                "-"
              )}
              x
              {pet.mother && "petId" in pet.mother && "name" in pet.mother ? (
                <Link href={`/pet/${pet.mother?.petId}`} className="text-blue-600 hover:underline">
                  {pet.mother?.name}
                </Link>
              ) : (
                "-"
              )}
            </div>
          )}
          <div className="text-sm text-gray-500">{SPECIES_KOREAN_INFO[pet.species]}</div>
        </div>

        <div className="flex items-center gap-1">
          <div
            className={cn(
              "flex h-[26px] w-fit items-center justify-center rounded-md px-2 text-sm font-semibold text-white",
              breedingData?.isPublic ? "bg-neutral-800" : "bg-yellow-500 text-neutral-700",
            )}
          >
            {breedingData?.isPublic ? "공개" : "비공개"}
          </div>
          {adoptionData?.status === PetAdoptionDtoStatus.NFS && (
            <div className="flex h-[26px] w-fit items-center justify-center rounded-md bg-pink-500 px-2 text-sm font-semibold text-white">
              NFS
            </div>
          )}
        </div>

        <div className="text-[18px] font-semibold text-gray-800">
          {adoptionData?.price && `${adoptionData.price.toLocaleString()}원`}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DeletePetDialog petId={pet.petId} petName={pet.name} />
        <QRCode petId={pet.petId} />
      </div>
    </div>
  );
};

export default Header;
