import { ParentLinkDetailJson } from "@repo/api-client";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import PetThumbnail from "../../components/PetThumbnail";

interface PetLinkCardProps {
  detailData?: ParentLinkDetailJson | null;
}

const PetLinkCard = ({ detailData }: PetLinkCardProps) => {
  if (!detailData) return null;

  return (
    <>
      <div className="flex items-center gap-1">
        {detailData?.childPet?.id && (
          <Link
            href={`/pet/${detailData.childPet.id}`}
            className="group flex flex-1 flex-col items-center gap-2 transition-all dark:hover:bg-gray-800"
          >
            {detailData.childPet.photos?.[0]?.url && (
              <PetThumbnail
                imageUrl={detailData.childPet.photos[0].url}
                alt={detailData.childPet.name}
              />
            )}
            <span className="text-sm font-semibold">{detailData.childPet.name}</span>
          </Link>
        )}

        <ArrowRight className="h-4 w-4" />

        {detailData?.parentPet?.id && (
          <Link
            href={`/pet/${detailData.parentPet.id}`}
            className="group flex flex-1 flex-col items-center gap-2 transition-all dark:hover:bg-gray-800"
          >
            {detailData.parentPet.photos?.[0]?.url && (
              <PetThumbnail
                imageUrl={detailData.parentPet.photos[0].url}
                alt={detailData.parentPet.name}
              />
            )}
            <span className="text-sm font-semibold">{detailData.parentPet.name}</span>
          </Link>
        )}
      </div>

      {/* 안내 문구 */}
      <div className="flex gap-1">
        <Info size={14} color="blue" />
        <span className="text-xs text-blue-700">
          개체 사진 및 이름을 클릭하면 상세 페이지로 이동합니다.
        </span>
      </div>
    </>
  );
};

export default PetLinkCard;
