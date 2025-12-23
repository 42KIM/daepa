import { cn } from "@/lib/utils";

interface ToggleButtonProps {
  isActive: boolean;
  isDisabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const ToggleButton = ({ isActive, isDisabled, onClick, children }: ToggleButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-full cursor-pointer rounded-md px-2 text-sm font-semibold text-gray-800",
        isActive ? "bg-white shadow-sm" : "text-gray-600",
        isDisabled && "cursor-not-allowed",
      )}
      disabled={isDisabled}
    >
      {children}
    </button>
  );
};
