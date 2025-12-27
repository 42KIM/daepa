import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { UpdatePetDtoEggStatus } from "@repo/api-client";

interface SelectProps {
  value: string;
  handleValueChange: (value: UpdatePetDtoEggStatus) => void;
  selectItems: Record<string, string>;
  triggerClassName?: string;
  iconClassName?: string;
}

const Select = ({
  value,
  handleValueChange,
  selectItems = {},
  triggerClassName,
  iconClassName,
}: SelectProps) => {
  return (
    <div className="flex items-center gap-1" data-stop-link="true">
      <ShadSelect value={value} onValueChange={handleValueChange}>
        <SelectTrigger
          size="sm"
          className={cn(
            "flex cursor-pointer items-center gap-0.5 rounded-lg border border-gray-300/60 pr-2 text-[12px] font-[500] text-gray-800",
            triggerClassName,
          )}
          iconClassName={iconClassName}
        >
          <SelectValue placeholder="알 상태" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          {Object.keys(selectItems).map((key) => {
            return (
              <SelectItem key={key} className="rounded-xl" value={key}>
                {selectItems[key]}
              </SelectItem>
            );
          })}
        </SelectContent>
      </ShadSelect>
    </div>
  );
};

export default Select;
