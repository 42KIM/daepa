import { ArrowLeftRight } from "lucide-react";
import LinkButton from "../../components/LinkButton";
import { ParentRequestDetailJsonDto } from "../../register/types";

const NotiTitle = ({
  detailData,
  hasLink = false,
}: {
  detailData?: ParentRequestDetailJsonDto;
  hasLink?: boolean;
}) => {
  if (!detailData) return null;

  return (
    <div className="flex items-center gap-2">
      {hasLink && "parentPetId" in detailData ? (
        <LinkButton
          href={`/pet/${detailData?.parentPet?.id}`}
          label={detailData?.parentPet?.name as string}
          tooltip="프로필로 이동"
        />
      ) : (
        <div>{detailData?.parentPet?.name as string}</div>
      )}
      <ArrowLeftRight className="h-4 w-4" />
      <div className="flex items-center">
        <div>{detailData?.childPet?.name as string}</div>
      </div>
    </div>
  );
};

export default NotiTitle;
