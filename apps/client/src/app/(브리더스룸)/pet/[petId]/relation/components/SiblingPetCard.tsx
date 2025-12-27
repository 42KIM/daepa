"use client";

import {
  PetHiddenStatusDto,
  PetHiddenStatusDtoHiddenStatus,
  SiblingPetDetailDto,
  SiblingPetDetailDtoSex,
} from "@repo/api-client";
import { DateTime } from "luxon";
import { EyeOff, Lock, ScanFace } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/app/(브리더스룸)/store/user";
import { cn } from "@/lib/utils";

type PetData = SiblingPetDetailDto | PetHiddenStatusDto;

interface SiblingPetCardProps {
  pet: PetData;
}

function isHiddenPet(pet: PetData): pet is PetHiddenStatusDto {
  return "hiddenStatus" in pet;
}

function getSexLabel(sex?: SiblingPetDetailDtoSex) {
  switch (sex) {
    case SiblingPetDetailDtoSex.MALE:
      return "♂";
    case SiblingPetDetailDtoSex.FEMALE:
      return "♀";
    default:
      return null;
  }
}

export default function SiblingPetCard({ pet }: SiblingPetCardProps) {
  const { user } = useUserStore();

  if (isHiddenPet(pet)) {
    return (
      <div className="flex w-[160px] shrink-0 flex-col items-center gap-2 rounded-xl bg-gray-50 p-2">
        <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-gray-200">
          {pet.hiddenStatus === PetHiddenStatusDtoHiddenStatus.DELETED ? (
            <EyeOff className="h-8 w-8 text-gray-400" />
          ) : (
            <Lock className="h-8 w-8 text-gray-400" />
          )}
        </div>
        <span className="text-[12px] text-gray-500">
          {pet.hiddenStatus === PetHiddenStatusDtoHiddenStatus.DELETED ? "삭제됨" : "비공개"}
        </span>
      </div>
    );
  }

  const sexLabel = getSexLabel(pet.sex);
  const isMyPet = pet.owner.userId === user?.userId;
  const isDeleted = pet.isDeleted;

  return (
    <Link
      href={`/pet/${pet.petId}`}
      className={cn(
        "flex w-[160px] shrink-0 flex-col gap-2 rounded-xl bg-white p-2 shadow-sm transition-shadow hover:shadow-md",
        isDeleted && "cursor-not-allowed bg-red-100/50",
      )}
    >
      <div className={cn("relative aspect-square w-full rounded-xl bg-gray-100")}>
        {pet.petId ? (
          <Image
            src="/assets/lizard.png"
            alt={pet.name ?? "펫 이미지"}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Image src="/assets/lizard.png" alt="기본 이미지" fill className="opacity-50" />
          </div>
        )}

        <div className="absolute left-0 top-0 flex items-center gap-1.5 rounded-lg bg-blue-100 px-1.5 py-0.5">
          <span className="text-[11px] font-semibold text-blue-600">
            {!isMyPet && <ScanFace className="mr-0.5 inline-block h-3 w-3" />}
            {isMyPet ? "My Pet" : pet.owner.name}
          </span>
        </div>

        {isDeleted ? (
          <div className="absolute bottom-1 right-1 flex flex-col items-center justify-center gap-2 rounded-md bg-red-600 px-1 py-0.5 text-[10px] font-bold text-white">
            삭제됨
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-0.5 px-1">
        <div className="flex items-center gap-1">
          <span className="truncate text-[13px] font-[600] text-gray-600">
            {pet.name ?? "이름 없음"}
          </span>
          {sexLabel && (
            <span
              className={`text-[13px] font-bold ${pet.sex === SiblingPetDetailDtoSex.MALE ? "text-blue-600" : "text-red-600"}`}
            >
              {sexLabel}
            </span>
          )}
        </div>

        <div className="text-[14px] font-bold">
          {pet.morphs && pet.morphs.length > 0 && pet.morphs.join(" ")}
        </div>

        {pet.traits && pet.traits.length > 0 && (
          <div className="flex flex-wrap gap-0.5">
            {pet.traits.map((trait) => (
              <Badge variant="outline" size="sm" key={trait}>
                {trait}
              </Badge>
            ))}
          </div>
        )}

        {pet.hatchingDate && (
          <span className="mt-2 text-[11px] font-[600] text-gray-500">
            {DateTime.fromISO(pet.hatchingDate).toFormat("yy년 M월 d일")}
          </span>
        )}
      </div>
    </Link>
  );
}
