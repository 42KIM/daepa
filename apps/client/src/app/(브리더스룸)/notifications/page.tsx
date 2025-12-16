"use client";

import { userNotificationControllerFindAll } from "@repo/api-client";
import { ScrollArea } from "@/components/ui/scroll-area";

import Loading from "@/components/common/Loading";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import { useInfiniteQuery } from "@tanstack/react-query";
import NotificationItem from "./components/NotificationItem";

const NotificationsPage = () => {
  const { ref, inView } = useInView();

  const {
    data = [],
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
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
    select: (response) => response.pages.flatMap((page) => page.data.data),
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      <ScrollArea className={"h-full w-full max-w-[500px] py-2"}>
        <div className="flex flex-col items-center gap-2 px-2 pt-0">
          {data.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground">알림이 없습니다.</p>
            </div>
          )}

          <div className="flex w-full flex-col gap-2">
            {data.map((item) => (
              <NotificationItem key={item.id} item={item} />
            ))}
          </div>

          {/* 무한 스크롤 로더 */}
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
        </div>
      </ScrollArea>
    </div>
  );
};

export default NotificationsPage;
