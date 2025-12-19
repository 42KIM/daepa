"use client";

import { buildR2TransformedUrl, cn } from "@/lib/utils";
import Image from "next/image";

const PetThumbnail = ({
  imageUrl,
  alt = "",
  bgColor = "bg-gray-200/50",
}: {
  imageUrl?: string;
  alt?: string;
  bgColor?: string;
}) => {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 text-center text-gray-400 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700">
      {imageUrl ? (
        <Image
          src={buildR2TransformedUrl(imageUrl)}
          alt={alt}
          fill
          className="object-cover transition-opacity"
        />
      ) : (
        <div
          className={cn(
            "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg text-center text-[12px] text-gray-400 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700",
            bgColor,
          )}
        >
          준비중
        </div>
      )}
    </div>
  );
};

export default PetThumbnail;
