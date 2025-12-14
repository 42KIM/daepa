import {
  ParentLinkDetailJson,
  UserNotificationDto,
  UserNotificationDtoStatus,
} from "@repo/api-client";
import { Badge } from "@/components/ui/badge";
import NotiTitle from "./NotiTitle";
import { castDetailJson, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useCallback } from "react";
import { NOTIFICATION_TYPE } from "../../constants";
import StatusBadge from "./StatusBadge";
import { useNotificationRead } from "@/hooks/useNotificationRead";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

interface NotiItemProps {
  item: UserNotificationDto;
}

const NotiItem = ({ item }: NotiItemProps) => {
  const router = useRouter();
  const { notiId } = useParams();

  const detailJson = castDetailJson<ParentLinkDetailJson>(item.type, item?.detailJson);

  const { setNotificationRead } = useNotificationRead();

  const handleItemClick = useCallback(
    async (item: UserNotificationDto) => {
      if (!item) return;

      try {
        await setNotificationRead(item);
      } catch {
        toast.error("알림 읽음 처리에 실패했습니다.");
      } finally {
        router.push(`/noti/${item.id}`);
      }
    },
    [setNotificationRead, router],
  );

  return (
    <button
      type="button"
      key={item.id}
      className={cn(
        "m-2 flex flex-1 flex-col items-start gap-2 rounded-xl border bg-neutral-50 p-3 text-left text-sm shadow-sm transition-all duration-200 hover:scale-[1.01] hover:bg-white hover:shadow-md dark:hover:bg-neutral-800",
        item.id === Number(notiId) && "bg-white dark:bg-neutral-800",
      )}
      onClick={() => {
        handleItemClick(item);
      }}
    >
      <div className="flex w-full flex-1 flex-col gap-1">
        <div className="flex items-center">
          <div className="flex items-center gap-2">
            <Badge
              className={cn("my-1 px-2 text-sm font-semibold", NOTIFICATION_TYPE[item.type].color)}
            >
              {NOTIFICATION_TYPE[item.type].label}
            </Badge>
            <StatusBadge item={item} />

            {item.status === UserNotificationDtoStatus.UNREAD && (
              <span className="flex h-2 w-2 rounded-full bg-red-500" />
            )}
          </div>
          <div
            className={cn(
              "ml-auto text-xs",
              item.id === Number(notiId) ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {formatDistanceToNow(new Date(item.createdAt), {
              addSuffix: true,
              locale: ko,
            })}
          </div>
        </div>
        <NotiTitle
          leftLink={{
            href: detailJson?.parentPet?.id ? `/pet/${detailJson.parentPet.id}` : undefined,
            name: detailJson?.parentPet?.name,
          }}
          rightLink={{
            href: detailJson?.childPet?.id ? `/pet/${detailJson.childPet.id}` : undefined,
            name: detailJson?.childPet?.name,
          }}
        />
      </div>
      <div className="text-muted-foreground line-clamp-2 text-xs">
        {detailJson?.message?.substring(0, 300)}
      </div>
    </button>
  );
};

export default NotiItem;
