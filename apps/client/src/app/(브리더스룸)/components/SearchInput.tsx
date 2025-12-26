import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder: string;
  onKeyDown: (value: string) => void;
}

const SearchInput = ({ placeholder, onKeyDown }: SearchInputProps) => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder={placeholder}
          className="h-8 rounded-lg bg-gray-100 pl-9"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onKeyDown(e.currentTarget.value);
            }
          }}
        />
      </div>
    </div>
  );
};

export default SearchInput;
