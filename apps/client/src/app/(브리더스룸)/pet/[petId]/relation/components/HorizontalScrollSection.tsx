"use client";

import { useRef, useState, useEffect, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";

interface HorizontalScrollSectionProps {
  children: ReactNode;
  className?: string;
}

export default function HorizontalScrollSection({
  children,
  className,
}: HorizontalScrollSectionProps) {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      if (el) {
        el.removeEventListener("scroll", checkScroll);
      }
      window.removeEventListener("resize", checkScroll);
    };
  }, [children]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollAmount = 200;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("relative", className)}>
      {/* 왼쪽 그라데이션 + 화살표 */}
      {canScrollLeft && (
        <>
          <div className="pointer-events-none absolute left-0 top-0 z-[5] h-full w-12 bg-gradient-to-r from-gray-100 to-transparent" />
          {!isMobile && (
            <button
              type="button"
              onClick={() => scroll("left")}
              className="absolute -left-4 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-all hover:bg-gray-50 hover:shadow-lg"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </>
      )}

      {/* 스크롤 컨테이너 */}
      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-3 overflow-x-auto pb-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>

      {/* 오른쪽 그라데이션 + 화살표 */}
      {canScrollRight && (
        <>
          <div className="pointer-events-none absolute right-0 top-0 z-[5] h-full w-12 bg-gradient-to-l from-gray-100 to-transparent" />
          {!isMobile && (
            <button
              type="button"
              onClick={() => scroll("right")}
              className="absolute -right-4 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-all hover:bg-gray-50 hover:shadow-lg"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
