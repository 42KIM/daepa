'use client";';

import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { userNotificationControllerFindAll, UserNotificationDto } from "@repo/api-client";
import { useInView } from "react-intersection-observer";
import { ScrollArea } from "@/components/ui/scroll-area";
import Loading from "@/components/common/Loading";
import NotiItem from "../../noti/components/NotiItem";

const NotificationList = () => {
  const [items, setItems] = useState<UserNotificationDto[]>([]);
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [userNotificationControllerFindAll.name],
    queryFn: ({ pageParam = 1 }) =>
      userNotificationControllerFindAll({
        page: pageParam,
        itemPerPage: 10,
        order: "DESC",
      }),
    enabled: true,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.meta.hasNextPage) {
        return lastPage.data.meta.page + 1;
      }
      return undefined;
    },
  });

  useEffect(() => {
    if (!data?.pages) return;
    setItems(data?.pages.flatMap((page) => page.data.data));
  }, [data?.pages]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <ScrollArea className="flex h-full flex-1 pb-[60px]">
      {items && items.length > 0 ? (
        <div className="flex flex-col">
          {items.map((item) => (
            <NotiItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-2 text-sm font-medium text-gray-900">알림이 없습니다</div>
          <div className="text-xs text-gray-500">새로운 알림이 도착하면 여기에 표시됩니다</div>
        </div>
      )}

      {hasNextPage && (
        <div ref={ref} className="h-20 text-center">
          {isFetchingNextPage ? (
            <div className="flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500" />
            </div>
          ) : (
            <Loading />
          )}
        </div>
      )}
    </ScrollArea>
  );
};

export default NotificationList;
