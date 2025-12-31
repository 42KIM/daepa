"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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
  const remainingItems = items.slice(maxDisplay);
  const remaining = remainingItems.length;

  return (
    <div className="flex flex-wrap gap-1">
      {displayItems.map((item, index) => (
        <Badge key={`${item}-${index}`} variant={variant} className={cn(badgeClassName)}>
          {item}
        </Badge>
      ))}
      {remaining > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="cursor-pointer">
              +{remaining}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-1">
              {remainingItems.map((item, index) => (
                <span key={`remaining-${item}-${index}`}>{item}</span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default BadgeList;
