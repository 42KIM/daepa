import { PetParentDtoWithMessage } from "@/app/(브리더스룸)/pet/store/parentLink";
import { useUserStore } from "@/app/(브리더스룸)/store/user";
import { Badge } from "@/components/ui/badge";
import { PetDtoSex, petImageControllerFindThumbnail } from "@repo/api-client";
import { Send } from "lucide-react";
import { useState } from "react";
import PetThumbnail from "../../PetThumbnail";
import { useQuery } from "@tanstack/react-query";
import FloatingButton from "../../FloatingButton";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";

interface LinkStepProps {
  selectedPet: PetParentDtoWithMessage;
  onSelect: (pet: PetParentDtoWithMessage) => void;
  onClose: () => void;
}

const LinkStep = ({ selectedPet, onSelect, onClose }: LinkStepProps) => {
  const [message, setMessage] = useState<string | null>(null);
  const { user } = useUserStore();
  const isMobile = useIsMobile();

  const { data: thumbnail } = useQuery({
    queryKey: [petImageControllerFindThumbnail.name, selectedPet.petId],
    queryFn: async () => petImageControllerFindThumbnail(selectedPet.petId),
    select: (response) => response.data,
    enabled: !!selectedPet.petId,
  });

  const defaultMessage = (pet: PetParentDtoWithMessage) => {
    return `안녕하세요, ${pet.owner?.name}님.\n${pet.name}를 ${
      pet.sex?.toString() === PetDtoSex.MALE ? "부" : "모"
    } 개체로 등록하고 싶습니다.`;
  };

  return (
    <div className="pb-20">
      {selectedPet && (
        <div className="space-y-6">
          {/* 상단 정보 영역 */}
          <div className={cn("gap-6", !isMobile && "flex")}>
            <div
              className={cn(
                "relative mb-2 aspect-square overflow-hidden rounded-xl",
                !isMobile && "w-60",
              )}
            >
              <PetThumbnail imageUrl={thumbnail?.url} alt={selectedPet.name} />
            </div>

            <div className="flex-1">
              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-bold">{selectedPet.name}</span>
                  <Badge variant="outline" className="bg-blue-50 text-black">
                    {selectedPet.sex?.toString() === PetDtoSex.MALE ? "수컷" : "암컷"}
                  </Badge>
                </div>
                <p className="text-[14px] font-[500] text-gray-800">
                  소유자:{" "}
                  <span className="decoration-1px font-[700] text-blue-500 underline decoration-gray-400">
                    {selectedPet.owner?.name}
                  </span>
                </p>
              </div>

              <div className="space-y-1">
                <div>
                  <h4 className="mb-1.5 text-[12px] font-medium text-gray-500">모프</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedPet.morphs?.map((morph) => (
                      <Badge key={morph} className="bg-blue-800 text-white">
                        {morph}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-1.5 text-[12px] font-medium text-gray-500">특성</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedPet.traits?.map((trait) => (
                      <Badge
                        variant="outline"
                        key={trait}
                        className="bg-white text-black dark:bg-blue-100"
                      >
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 요청 메시지 영역 */}
          {selectedPet?.owner?.userId &&
          user?.userId &&
          selectedPet.owner.userId !== user.userId ? (
            <div className="space-y-2 rounded-xl">
              <div>
                <div className="flex items-center gap-1">
                  <h4 className="text-[14px] font-[600]">부모 개체 연결 요청</h4>
                  <Send className="h-3 w-3" />
                </div>
                <p className="text-xs text-gray-500">
                  <span className="decoration-1px font-[700] text-blue-500 underline decoration-gray-400">
                    {selectedPet.owner?.name}
                  </span>{" "}
                  님에게 부모 개체 연결을 요청합니다.
                </p>
              </div>

              <div className="space-y-1">
                <textarea
                  className="w-full rounded-lg bg-gray-100 p-3 text-sm focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:placeholder:text-gray-500"
                  rows={3}
                  value={message ?? defaultMessage(selectedPet)}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <p className="text-xs font-[700] text-blue-500">
                  * 요청이 수락되면 해당 개체가 부모로 등록됩니다.
                </p>
              </div>

              <FloatingButton
                leftButton={{
                  title: "취소",
                  onClick: onClose,
                }}
                rightButton={{
                  title: "연결 요청하기",
                  onClick: () =>
                    onSelect({ ...selectedPet, message: message ?? defaultMessage(selectedPet) }),
                }}
              />
            </div>
          ) : (
            <FloatingButton
              rightButton={{
                title: "연결",
                onClick: () => onSelect(selectedPet),
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default LinkStep;
