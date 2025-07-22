import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";

interface CalendarInputProps {
  placeholder: string;
  value: string;
  onSelect: (date: string) => void;
  disabled?: (date: Date) => boolean;
}

const CalendarInput = ({ placeholder, value, onSelect, disabled }: CalendarInputProps) => {
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Date 객체를 yyyyMMdd 형태의 숫자로 변환
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      onSelect(dateString);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          data-field-name="layingDate"
          className={cn("flex w-full items-center justify-between", value && "text-black")}
        >
          {value ? format(new Date(value), "yyyy년 MM월 dd일") : placeholder}
          <CalendarIcon className="h-4 w-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ? new Date(value) : undefined}
          onSelect={handleDateSelect}
          disabled={disabled}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default CalendarInput;
