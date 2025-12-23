const FormItem = ({
  label,
  content,
  subContent,
}: {
  label: string;
  content: React.ReactNode;
  subContent?: React.ReactNode;
}) => {
  return (
    <div className="flex gap-3 text-[14px]">
      <div className="flex min-w-[60px] pt-[6px]">{label}</div>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1">{content}</div>
        {subContent}
      </div>
    </div>
  );
};

export default FormItem;
