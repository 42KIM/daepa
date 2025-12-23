import SingleSelect from "@/app/(브리더스룸)/components/selector/SingleSelect";
import NumberField from "@/app/(브리더스룸)/components/Form/NumberField";
import FormItem from "../FormItem";
import { cn } from "@/lib/utils";

interface EggInfoProps {
  formData: {
    eggStatus?: string;
    temperature?: number | string;
  };
  isEditMode: boolean;
  onFieldChange: (field: string, value: any) => void;
}

export const EggInfo = ({ formData, isEditMode, onFieldChange }: EggInfoProps) => {
  return (
    <>
      <FormItem
        label="알 상태"
        content={
          <SingleSelect
            disabled={!isEditMode}
            type="eggStatus"
            initialItem={formData.eggStatus}
            onSelect={(item) => onFieldChange("eggStatus", item)}
          />
        }
      />

      <FormItem
        label="해칭 온도"
        content={
          <NumberField
            disabled={!isEditMode}
            field={{ name: "temperature", type: "number", unit: "°C" }}
            value={String(formData.temperature ?? "")}
            setValue={(value) => onFieldChange("temperature", value.value)}
            inputClassName={cn(
              "h-[32px] w-full rounded-md border border-gray-200 p-2 placeholder:font-[500]",
              !isEditMode && "border-none",
            )}
          />
        }
      />
    </>
  );
};
