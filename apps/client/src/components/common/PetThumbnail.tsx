"use client";

import { buildR2TransformedUrl } from "@/lib/utils";
import { petImageControllerFindThumbnail } from "@repo/api-client";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

// 썸네일 크기 정의
const THUMBNAIL_SIZES = {
  small: {
    containerClass: "w-10 h-10",
    transform: "width=80,height=80,format=webp",
  },
  medium: {
    containerClass: "w-16 h-16",
    transform: "width=128,height=128,format=webp",
  },
  large: {
    containerClass: "w-24 h-24",
    transform: "width=192,height=192,format=webp",
  },
} as const;

type ThumbnailSize = keyof typeof THUMBNAIL_SIZES;

/** 썸네일 캐시 무효화를 위한 queryKey */
export const getPetThumbnailQueryKey = (petId: string) => [
  petImageControllerFindThumbnail.name,
  petId,
];

interface PetThumbnailProps {
  petId?: string;
  size?: ThumbnailSize;
  alt?: string;
  className?: string;
  /** 쿼리 비활성화 */
  enabled?: boolean;
}

/**
 * 펫 썸네일 컴포넌트
 *
 * - petId를 받아 썸네일 이미지를 조회하여 표시
 * - React Query를 통한 캐싱 전략 적용 (이미지 변경 전까지 캐시 유지)
 * - small, medium, large 크기 지원
 *
 * @example
 * // 기본 사용
 * <PetThumbnail petId="abc123" size="medium" />
 *
 * @example
 * // 이미지 변경 시 캐시 무효화
 * import { getPetThumbnailQueryKey } from "@/components/common/PetThumbnail";
 * queryClient.invalidateQueries({ queryKey: getPetThumbnailQueryKey(petId) });
 */
const PetThumbnail = ({
  petId,
  size = "medium",
  alt = "",
  className = "",
  enabled = true,
}: PetThumbnailProps) => {
  const { data: thumbnail, isLoading } = useQuery({
    queryKey: getPetThumbnailQueryKey(petId ?? ""),
    queryFn: () => petImageControllerFindThumbnail(petId ?? ""),
    select: (response) => response.data,
    enabled: !!petId && enabled,
    // 이미지 변경 전까지 캐시 영구 유지
    // 변경 시 queryClient.invalidateQueries로 수동 무효화
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const sizeConfig = THUMBNAIL_SIZES[size];
  const imageUrl = thumbnail?.url
    ? buildR2TransformedUrl(thumbnail.url, sizeConfig.transform)
    : null;

  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gray-100 ${sizeConfig.containerClass} ${className}`}
    >
      {isLoading ? (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      ) : imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes={sizeConfig.containerClass}
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center opacity-50">
          <Image
            src="/assets/lizard.png"
            alt="기본 펫 이미지"
            fill
            className="object-contain p-1"
          />
        </div>
      )}
    </div>
  );
};

export default PetThumbnail;
