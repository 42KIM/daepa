import { ArrowLeftRight } from "lucide-react";
import LinkButton from "../../components/LinkButton";

const NotiTitle = ({
  displayText,
  label,
  href,
}: {
  displayText: string;
  label?: string;
  href?: string;
}) => {
  if (!displayText) return null;

  return (
    <div className="flex items-center gap-2">
      {href ? (
        <LinkButton href={href} label={label ?? ""} tooltip="프로필로 이동" />
      ) : (
        <div>{displayText}</div>
      )}
      <ArrowLeftRight className="h-4 w-4" />
      <div className="flex items-center">
        <div>{displayText}</div>
      </div>
    </div>
  );
};

export default NotiTitle;
