import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}

const StatCard = ({ label, value, valueClassName }: StatCardProps) => {
  return (
    <div className="rounded-lg p-4 text-center">
      <div className="text-sm font-[500] text-gray-600">{label}</div>
      <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
    </div>
  );
};

export default StatCard;
