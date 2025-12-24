import {
  UserNotificationDto,
  UserNotificationDtoStatus,
  UserNotificationDtoType,
  UpdateParentRequestDtoStatus,
} from "@repo/api-client";
import { ParentLinkDetailJson } from "@repo/api-client";
import { castDetailJson, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { NOTIFICATION_MESSAGE, STATUS_MAP } from "../../constants";
import { ChevronDown } from "lucide-react";
import PetThumbnail from "../../components/PetThumbnail";

interface NotificationHeaderProps {
  item: UserNotificationDto;
  isOpen: boolean;
}

const NotificationHeader = ({ item, isOpen }: NotificationHeaderProps) => {
  const detailData = castDetailJson<ParentLinkDetailJson>(item.type, item?.detailJson);

  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-2">
          <div className="h-15 w-15 relative">
            <PetThumbnail
              imageUrl={detailData?.childPet?.photos?.[0]?.url}
              alt="알림 페이지 자식 펫 썸네일"
              className="rounded-full"
            />
          </div>
        </div>
        <div className="text-left text-sm">
          {item.type === UserNotificationDtoType.PARENT_REQUEST && (
            <div
              className={cn(
                STATUS_MAP[detailData?.status ?? UpdateParentRequestDtoStatus.PENDING]?.color,
                "mb-1 flex h-5 w-fit items-center rounded-sm px-1 text-xs font-[600] text-white",
              )}
            >
              {STATUS_MAP[detailData?.status ?? UpdateParentRequestDtoStatus.PENDING]?.label}
            </div>
          )}

          <span className="font-bold">{detailData?.childPet?.name}</span>
          {NOTIFICATION_MESSAGE[item.type]}
          <span className="text-muted-foreground pl-1">
            {formatDistanceToNow(new Date(item.createdAt), {
              addSuffix: true,
              locale: ko,
            })}
          </span>
          {item.status === UserNotificationDtoStatus.UNREAD && (
            <span className="ml-1 inline-block h-2 w-2 rounded-full bg-red-500" />
          )}
        </div>
      </div>

      <div className="h-7 w-7">
        <ChevronDown
          className={cn(
            "text-gray-500 transition-transform duration-300 dark:text-neutral-400",
            isOpen && "rotate-180",
          )}
        />
      </div>
    </div>
  );
};

export default NotificationHeader;
