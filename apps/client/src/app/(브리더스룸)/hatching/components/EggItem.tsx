import {
  PetSummaryLayingDto,
  PetSummaryLayingDtoEggStatus,
  UpdatePetDtoEggStatus,
} from "@repo/api-client";
import { Edit, Trash2, CheckCircle2, XCircle, CircleOff, CircleAlert } from "lucide-react";
import DropdownMenuIcon from "./DropdownMenuIcon";
import { DateTime } from "luxon";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { GENDER_KOREAN_INFO } from "../../constants";
import { useRouter } from "next/navigation";
import Select from "./Select";
import { useIsMobile } from "@/hooks/useMobile";

interface EggItemProps {
  pet: PetSummaryLayingDto;
  layingDate: string;
  handleHatching: (e: React.MouseEvent) => void;
  handleDeleteEggClick: (e: React.MouseEvent) => void;
  handleEditEggClick: (e: React.MouseEvent) => void;
  handleUpdate: (value: UpdatePetDtoEggStatus) => Promise<void>;
}

const EggItem = ({
  pet,
  layingDate,
  handleHatching,
  handleDeleteEggClick,
  handleEditEggClick,
  handleUpdate,
}: EggItemProps) => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const isHatched = !!pet.hatchingDate;

  const getStatusIcon = () => {
    switch (pet.eggStatus) {
      case UpdatePetDtoEggStatus.FERTILIZED:
        return <CheckCircle2 className="h-4 w-4 text-yellow-600" />;
      case UpdatePetDtoEggStatus.UNFERTILIZED:
        return <XCircle className="h-4 w-4 text-orange-600" />;
      case UpdatePetDtoEggStatus.DEAD:
        return <CircleOff className="h-4 w-4 text-red-600" />;
      default:
        return <CircleAlert className="h-4 w-4 text-gray-900" />;
    }
  };

  const getExpectedDate = (temperature = 25) => {
    // 온도 기반 해칭일 계산 (기본 25°C)
    const incubationDay = 60 - (temperature - 25) * 10;
    const expectedDate = DateTime.fromFormat(layingDate, "yyyy-MM-dd").plus({
      days: incubationDay,
    });

    return expectedDate.setLocale("ko").toFormat("M월 d일(ccc)");
  };

  return (
    <div
      key={pet.petId}
      className={cn(
        "flex w-full items-center justify-between p-1 pl-0 text-[14px] hover:rounded-xl hover:bg-gray-100",
        isHatched && "cursor-pointer",
      )}
      onClick={() => {
        if (isHatched) {
          router.push(`/pet/${pet.petId}`);
        }
      }}
    >
      <div className="flex">
        <div
          className={cn(
            "flex w-[56px] items-center justify-center font-semibold text-gray-500",
            isMobile && "w-[30px]",
          )}
        />

        <div className="flex flex-col px-1 py-1.5">
          <div className="flex items-center gap-1 font-semibold">
            <div className="text-gray-800">
              {pet?.name ?? `${pet.clutch ?? "@"}차-${pet.clutchOrder ?? "@"}`}
            </div>
            {pet.temperature && (
              <span className="text-[12px] font-[500] text-gray-600">| {pet.temperature}℃</span>
            )}

            {pet.sex && (
              <span className="text-[12px] font-[500] text-gray-600">
                | {GENDER_KOREAN_INFO[pet.sex]}
              </span>
            )}
          </div>
          {!isHatched && pet.eggStatus === PetSummaryLayingDtoEggStatus.FERTILIZED && (
            <div className="text-xs font-[500] text-blue-600">
              <span className="font-[400]">예상 해칭일: </span>
              {getExpectedDate(pet.temperature)}
            </div>
          )}
        </div>
      </div>

      {!isHatched ? (
        <div className="flex">
          {!isMobile ? (
            <Select
              value={pet.eggStatus}
              handleValueChange={handleUpdate}
              selectItems={{ FERTILIZED: "유정란", UNFERTILIZED: "무정란", DEAD: "중지" }}
              triggerClassName={
                pet.eggStatus === "FERTILIZED" ? "bg-yellow-100 text-yellow-700 border-none " : ""
              }
            />
          ) : (
            <>
              {/* 상태 변경 드롭다운 */}
              <DropdownMenuIcon
                selectedId={`${pet.petId}-status`}
                triggerIcon={getStatusIcon()}
                menuItems={[
                  {
                    icon: <CheckCircle2 className="h-4 w-4 text-yellow-600" />,
                    label: "유정란",
                    onClick: (e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleUpdate(UpdatePetDtoEggStatus.FERTILIZED);
                    },
                  },
                  {
                    icon: <XCircle className="h-4 w-4 text-orange-600" />,
                    label: "무정란",
                    onClick: (e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleUpdate(UpdatePetDtoEggStatus.UNFERTILIZED);
                    },
                  },
                  {
                    icon: <CircleOff className="h-4 w-4 text-red-600" />,
                    label: "중지",
                    onClick: (e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleUpdate(UpdatePetDtoEggStatus.DEAD);
                    },
                  },
                ]}
              />
            </>
          )}

          {/* 수정/삭제 드롭다운 */}
          <DropdownMenuIcon
            selectedId={pet.petId}
            menuItems={[
              {
                icon: <Edit className="h-4 w-4 text-blue-600" />,
                label: "해칭 완료",
                onClick: handleHatching,
              },
              {
                icon: <Edit className="h-4 w-4 text-blue-600" />,
                label: "수정",
                onClick: handleEditEggClick,
              },
              {
                icon: <Trash2 className="h-4 w-4 text-red-600" />,
                label: "삭제",
                onClick: handleDeleteEggClick,
              },
            ]}
          />
        </div>
      ) : (
        <div className="font-[600] text-blue-700">
          {pet.hatchingDate
            ? DateTime.fromISO(pet.hatchingDate).toFormat("MM/dd 해칭")
            : "해칭 완료"}
        </div>
      )}
    </div>
  );
};

export default memo(EggItem);
