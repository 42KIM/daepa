import { cn } from "@/lib/utils";

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const SectionCard = ({ title, children, className }: SectionCardProps) => {
  return (
    <div
      className={cn(
        "shadow-xs flex flex-1 flex-col gap-2 rounded-2xl bg-white p-3 dark:bg-neutral-900",
        className,
      )}
    >
      <div className="text-[14px] font-[600] text-gray-600 dark:text-gray-300">{title}</div>
      {children}
    </div>
  );
};

export default SectionCard;
