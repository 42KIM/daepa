import { PetSummaryLayingDto, UpdatePetDtoEggStatus } from "@repo/api-client";
import { Edit, Trash2 } from "lucide-react";
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
  handleHatching: (e: React.MouseEvent) => void;
  handleDeleteEggClick: (e: React.MouseEvent) => void;
  handleEditEggClick: (e: React.MouseEvent) => void;
  handleUpdate: (value: UpdatePetDtoEggStatus) => Promise<void>;
}

const EggItem = ({
  pet,
  handleHatching,
  handleDeleteEggClick,
  handleEditEggClick,
  handleUpdate,
}: EggItemProps) => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const isHatched = !!pet.hatchingDate;

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
              <span className="text-[12px] font-[500] text-green-700">| {pet.temperature}℃</span>
            )}

            {pet.sex && (
              <span className="text-[12px] font-[500] text-blue-600">
                | {GENDER_KOREAN_INFO[pet.sex]}
              </span>
            )}
          </div>
        </div>
      </div>

      {!isHatched ? (
        <div className="flex">
          <Select
            value={pet.eggStatus}
            handleValueChange={handleUpdate}
            selectItems={{ FERTILIZED: "유정란", UNFERTILIZED: "무정란", DEAD: "중지" }}
            triggerClassName={
              pet.eggStatus === "FERTILIZED" ? "bg-yellow-100 text-yellow-700 border-none " : ""
            }
          />

          <button
            type="button"
            className="ml-1 rounded-lg bg-blue-100/60 px-2 text-xs font-[600] text-blue-500 hover:bg-blue-200/60"
            onClick={handleHatching}
          >
            해칭 완료
          </button>
          <DropdownMenuIcon
            selectedId={pet.petId}
            menuItems={[
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
