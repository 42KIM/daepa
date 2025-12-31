"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BadgeListProps {
  items?: string[];
  maxDisplay?: number;
  variant?: "default" | "secondary" | "outline" | "destructive";
  badgeClassName?: string;
}

const BadgeList = ({
  items,
  maxDisplay = 5,
  variant = "default",
  badgeClassName,
}: BadgeListProps) => {
  if (!items || items.length === 0) return null;

  const displayItems = items.slice(0, maxDisplay);
  const remaining = items.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1">
      {displayItems.map((item, index) => (
        <Badge key={`${item}-${index}`} variant={variant} className={cn(badgeClassName)}>
          {item}
        </Badge>
      ))}
      {remaining > 0 && <Badge variant="secondary">+{remaining}</Badge>}
    </div>
  );
};

export default BadgeList;
