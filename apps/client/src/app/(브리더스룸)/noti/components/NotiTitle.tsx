import { ArrowLeftRight } from "lucide-react";
import LinkButton from "../../components/LinkButton";
import { UserNotificationDtoDetailJson } from "@repo/api-client";

const NotiTitle = ({
  detailData,
  hasLink = false,
}: {
  detailData?: UserNotificationDtoDetailJson;
  hasLink?: boolean;
}) => {
  if (!detailData) return null;

  return (
    <div className="flex items-center gap-2">
      {hasLink && "parentPetId" in detailData ? (
        <LinkButton
          href={`/pet/${detailData?.parentPetId}`}
          label={detailData?.parentPetName as string}
          tooltip="프로필로 이동"
        />
      ) : (
        <div>{detailData?.parentPetName as string}</div>
      )}
      <ArrowLeftRight className="h-4 w-4" />
      <div className="flex items-center">
        <div>{detailData?.childPetName as string}</div>
      </div>
    </div>
  );
};

export default NotiTitle;
