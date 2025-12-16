import SingleSelect from "@/app/(브리더스룸)/components/SingleSelect";
import FormMultiSelect from "@/app/(브리더스룸)/components/FormMultiSelect";
import NumberField from "@/app/(브리더스룸)/components/Form/NumberField";
import FormItem from "../FormItem";
import {
  FOOD_KOREAN_INFO,
  MORPH_LIST_BY_SPECIES,
  TRAIT_LIST_BY_SPECIES,
} from "@/app/(브리더스룸)/constants";
import { PetDtoSpecies } from "@repo/api-client";
import { cn } from "@/lib/utils";

interface PetDetailInfoProps {
  formData: {
    species?: PetDtoSpecies;
    sex?: string;
    growth?: string;
    weight?: number | string;
    morphs?: string[];
    traits?: string[];
    foods?: string[];
  };
  isEditMode: boolean;
  onFieldChange: (field: string, value: any) => void;
}

export const PetDetailInfo = ({ formData, isEditMode, onFieldChange }: PetDetailInfoProps) => {
  return (
    <>
      <FormItem
        label="성별"
        content={
          <SingleSelect
            disabled={!isEditMode}
            type="sex"
            initialItem={formData.sex}
            onSelect={(item) => onFieldChange("sex", item)}
          />
        }
      />

      <FormItem
        label="크기"
        content={
          <SingleSelect
            disabled={!isEditMode}
            type="growth"
            initialItem={formData.growth}
            onSelect={(item) => onFieldChange("growth", item)}
          />
        }
      />

      <FormItem
        label="몸무게"
        content={
          <NumberField
            disabled={!isEditMode}
            field={{ name: "weight", type: "number", unit: "g" }}
            value={String(formData.weight ?? "")}
            setValue={(value) => onFieldChange("weight", value.value)}
            placeholder="몸무게"
            inputClassName={cn(
              "h-[32px] w-full rounded-md border border-gray-200 p-2 placeholder:font-[500]",
              !isEditMode && "border-none",
            )}
          />
        }
      />

      <FormItem
        label="모프"
        content={
          <FormMultiSelect
            disabled={!isEditMode}
            title="모프"
            displayMap={MORPH_LIST_BY_SPECIES[formData.species as PetDtoSpecies]}
            initialItems={formData.morphs}
            onSelect={(items) => onFieldChange("morphs", items)}
          />
        }
      />

      <FormItem
        label="형질"
        content={
          <FormMultiSelect
            disabled={!isEditMode}
            title="형질"
            displayMap={TRAIT_LIST_BY_SPECIES[formData.species as PetDtoSpecies]}
            initialItems={formData.traits}
            onSelect={(items) => onFieldChange("traits", items)}
          />
        }
      />

      <FormItem
        label="먹이"
        content={
          <FormMultiSelect
            disabled={!isEditMode}
            title="먹이"
            displayMap={FOOD_KOREAN_INFO}
            initialItems={formData.foods}
            onSelect={(items) => onFieldChange("foods", items)}
          />
        }
      />
    </>
  );
};
