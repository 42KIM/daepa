import NameDuplicateCheckInput from "@/app/(브리더스룸)/components/NameDuplicateCheckInput";
import CalendarInput from "@/app/(브리더스룸)/hatching/components/CalendarInput";
import SingleSelect from "@/app/(브리더스룸)/components/selector/SingleSelect";
import FormItem from "../FormItem";
import { format } from "date-fns";
import { PetDtoSpecies } from "@repo/api-client";

interface PetBasicInfoProps {
  formData: {
    name?: string;
    hatchingDate?: string;
    species?: PetDtoSpecies;
    morphs?: string[];
    traits?: string[];
  };
  errors: {
    name?: string;
  };
  isEditMode: boolean;
  isEgg: boolean;
  onNameChange: (name: string) => void;
  onHatchingDateChange: (date: string) => void;
  onSpeciesChange: (species: PetDtoSpecies) => void;
}

export const PetBasicInfo = ({
  formData,
  errors,
  isEditMode,
  isEgg,
  onNameChange,
  onHatchingDateChange,
  onSpeciesChange,
}: PetBasicInfoProps) => {
  return (
    <>
      <FormItem
        label="개체 이름"
        content={
          <NameDuplicateCheckInput
            errorMessage={errors.name || ""}
            disabled={!isEditMode}
            value={String(formData.name || "")}
            placeholder="미정"
            onChange={(e) => onNameChange(e.target.value)}
          />
        }
      />

      {!isEgg && (
        <FormItem
          label="생년월일"
          content={
            <CalendarInput
              editable={isEditMode}
              placeholder="-"
              value={formData.hatchingDate}
              onSelect={(date) => {
                if (!date) return;
                onHatchingDateChange(format(date, "yyyy-MM-dd"));
              }}
            />
          }
        />
      )}

      <FormItem
        label="종"
        content={
          <SingleSelect
            disabled
            type="species"
            initialItem={formData.species}
            onSelect={(item) => onSpeciesChange(item as PetDtoSpecies)}
          />
        }
      />
    </>
  );
};
