import { ArrowLeftRight } from "lucide-react";
import LinkButton from "../../components/LinkButton";

const NotiTitle = ({
  leftLink,
  rightLink,
}: {
  leftLink: {
    href?: string;
    name?: string;
  };
  rightLink: {
    href?: string;
    name?: string;
  };
}) => {
  return (
    <div className="flex items-center gap-2">
      {leftLink.href && leftLink.name ? (
        <LinkButton href={leftLink.href} label={leftLink.name} tooltip="프로필로 이동" />
      ) : (
        <div>{leftLink.name ?? "알수없음"}</div>
      )}
      <ArrowLeftRight className="h-4 w-4" />
      {rightLink.href && rightLink.name ? (
        <LinkButton href={rightLink.href} label={rightLink.name} tooltip="프로필로 이동" />
      ) : (
        <div>{rightLink.name ?? "알수없음"}</div>
      )}
    </div>
  );
};

export default NotiTitle;
