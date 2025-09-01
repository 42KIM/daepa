import { cn } from "@/lib/utils";
import { UserDto } from "@repo/api-client";

interface UserItemProps {
  item: UserDto;
  isSelected: boolean | undefined;
  onSelect: (user: UserDto) => void;
}

const UserItem = ({ item, isSelected, onSelect }: UserItemProps) => {
  return (
    <div
      className={cn(
        "flex items-center rounded-lg p-2 pl-4 text-gray-800 hover:cursor-pointer hover:bg-gray-100 hover:font-semibold",
        isSelected && "bg-gray-800 font-semibold text-white hover:bg-gray-800 hover:font-semibold",
      )}
      onClick={() => onSelect(item)}
    >
      {item.name}
    </div>
  );
};

export default UserItem;
