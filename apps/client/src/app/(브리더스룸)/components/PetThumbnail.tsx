"use client";

import { buildR2TransformedUrl } from "@/lib/utils";
import Image from "next/image";

const PetThumbnail = ({ imageUrl, alt = "" }: { imageUrl?: string; alt?: string }) => {
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
        <div className="relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-gray-100 px-3 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700">
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-center opacity-[0.5] transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-700">
            <Image src="/assets/lizard.png" alt="기본 펫 이미지" fill />
          </div>
          <div className="text-[12px] text-gray-900/70">준비중</div>
        </div>
      )}
    </div>
  );
};

export default PetThumbnail;
