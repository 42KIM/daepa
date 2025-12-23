import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface SelectItemProps {
  item: {
    key: string | null;
    value: string;
  };
  isSelected: boolean;
  onClick: (key: string | null) => void;
}

export const SelectItem = ({ item, isSelected, onClick }: SelectItemProps) => {
  return (
    <button
      className={cn(
        "flex w-full cursor-pointer items-center justify-between rounded-xl px-2 py-2 text-gray-600 hover:bg-gray-100",
        isSelected && "text-blue-700",
      )}
      onClick={() => onClick(item.key)}
    >
      {item.value}
      {isSelected && <Check className="h-4 w-4 text-blue-600" />}
    </button>
  );
};
