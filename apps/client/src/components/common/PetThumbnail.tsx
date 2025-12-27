"use client";

import { buildR2TransformedUrl } from "@/lib/utils";
import { petImageControllerFindThumbnail } from "@repo/api-client";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

// 썸네일 크기 정의 (레티나 2x 대응)
const THUMBNAIL_TRANSFORMS = {
  sm: "width=320,height=320,format=webp", // 160px 이하 표시용
  lg: "width=800,height=800,format=webp", // 400px 이하 표시용
} as const;

/** 표시 크기에 따라 적절한 transform 선택 */
const getTransform = (width: number, height: number) => {
  const maxSize = Math.max(width, height);
  // 레티나 2x 기준: 160px 이하면 sm(320px), 초과면 lg(800px)
  return maxSize <= 160 ? THUMBNAIL_TRANSFORMS.sm : THUMBNAIL_TRANSFORMS.lg;
};

/** 썸네일 캐시 무효화를 위한 queryKey */
export const getPetThumbnailQueryKey = (petId: string) => [
  petImageControllerFindThumbnail.name,
  petId,
];

interface PetThumbnailProps {
  petId?: string;
  /** 표시할 너비 (px) */
  width: number;
  /** 표시할 높이 (px) */
  height: number;
  alt?: string;
  className?: string;
  /** 쿼리 비활성화 */
  enabled?: boolean;
}

/**
 * 펫 썸네일 컴포넌트
 *
 * - petId를 받아 썸네일 이미지를 조회하여 표시
 * - width, height에 따라 최적의 이미지 크기 자동 선택 (sm: 320px, lg: 800px)
 * - React Query를 통한 캐싱 전략 적용 (이미지 변경 전까지 캐시 유지)
 *
 * @example
 * <PetThumbnail petId="abc123" width={72} height={72} />
 *
 * @example
 * // 이미지 변경 시 캐시 무효화
 * import { getPetThumbnailQueryKey } from "@/components/common/PetThumbnail";
 * queryClient.invalidateQueries({ queryKey: getPetThumbnailQueryKey(petId) });
 */
const PetThumbnail = ({
  petId,
  width,
  height,
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

  const transform = getTransform(width, height);
  const imageUrl = thumbnail?.url
    ? buildR2TransformedUrl(thumbnail.url, transform)
    : null;

  return (
    <div
      style={{ width, height }}
      className={`relative overflow-hidden rounded-lg bg-gray-100 ${className}`}
    >
      {isLoading ? (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      ) : imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes={`${Math.max(width, height)}px`}
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
