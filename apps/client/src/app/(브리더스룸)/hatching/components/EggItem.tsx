import { PetSummaryLayingDto, UpdatePetDtoEggStatus } from "@repo/api-client";
import { CheckSquare, Edit, Trash2 } from "lucide-react";
import DropdownMenuIcon from "./DropdownMenuIcon";
import { DateTime } from "luxon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { GENDER_KOREAN_INFO } from "../../constants";
import { useRouter } from "next/navigation";

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
        <div className="flex w-[56px] items-center justify-center font-semibold text-gray-500" />

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
          {!isHatched && (
            <div className="flex items-center">
              {pet.temperature && (
                <div className="flex items-center gap-1" data-stop-link="true">
                  <Select value={pet.eggStatus} onValueChange={handleUpdate}>
                    <SelectTrigger
                      size="sm"
                      className={cn(
                        "flex cursor-pointer items-center gap-0.5 rounded-lg border-none pr-2 text-[12px] font-[500]",
                        pet.eggStatus === "FERTILIZED"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-800",
                      )}
                    >
                      <SelectValue placeholder="알 상태" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem className="rounded-xl" value="FERTILIZED">
                        유정란
                      </SelectItem>
                      <SelectItem className="rounded-xl" value="UNFERTILIZED">
                        무정란
                      </SelectItem>
                      <SelectItem className="rounded-xl" value="DEAD">
                        중지
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={cn("text-gray-600", isHatched && "text-blue-700")}>
        {isHatched
          ? pet.hatchingDate
            ? DateTime.fromISO(pet.hatchingDate).toFormat("MM/dd 해칭")
            : "해칭 완료"
          : ""}
      </div>

      {!pet.hatchingDate && (
        <DropdownMenuIcon
          selectedId={pet.petId}
          menuItems={[
            {
              icon: <CheckSquare className="h-4 w-4 text-green-600" />,
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
      )}
    </div>
  );
};

export default memo(EggItem);
