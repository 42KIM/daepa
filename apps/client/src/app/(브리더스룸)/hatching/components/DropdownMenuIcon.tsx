import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

interface DropdownMenuIconProps {
  selectedId: string | number;
  menuItems: {
    icon: React.ReactNode;
    label: string;
    onClick: (e: React.MouseEvent) => void;
  }[];
  triggerIcon?: React.ReactNode;
}
const DropdownMenuIcon = ({ selectedId, menuItems, triggerIcon }: DropdownMenuIconProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-8 rounded-lg hover:bg-gray-100">
          <span className="sr-only">Open menu</span>
          {triggerIcon || <MoreVertical />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {menuItems.map((item, index) => (
          <div key={`${selectedId}-${item.label}`}>
            <DropdownMenuItem onClick={item.onClick}>
              {item.icon}
              {item.label}
            </DropdownMenuItem>
            {index < menuItems.length - 1 && <DropdownMenuSeparator />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownMenuIcon;
