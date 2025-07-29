import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CalendarInput from "./CalendarInput";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  brMatingControllerFindAll,
  petControllerUpdate,
  PetDtoGrowth,
  UpdatePetDto,
  UpdatePetDtoGrowth,
} from "@repo/api-client";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useState } from "react";
import { format, isBefore } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GROWTH_KOREAN_INFO } from "../../constants";

interface CompleteHatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId: string;
  layingDate: string;
}

const CompleteHatchingModal = ({
  isOpen,
  onClose,
  petId,
  layingDate,
}: CompleteHatchingModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<UpdatePetDto>({
    hatchingDate: format(new Date(), "yyyy-MM-dd"),
    growth: UpdatePetDtoGrowth.BABY,
    name: "",
    desc: "",
  });

  const { mutate: mutateHatched } = useMutation({
    mutationFn: (formData: UpdatePetDto) => petControllerUpdate(petId, formData),
    onSuccess: (response) => {
      if (response?.data) {
        toast.success("해칭 완료");
        queryClient.invalidateQueries({ queryKey: [brMatingControllerFindAll.name] });
        onClose();
      }
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Failed to hatch egg:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("펫 등록에 실패했습니다.");
      }
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!formData.hatchingDate) {
      toast.error("해칭일을 선택해주세요.");
      return;
    }

    if (!formData.name) {
      toast.error("이름을 입력해주세요.");
      return;
    }

    mutateHatched(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>해칭 완료</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label>산란일</Label>
            <div className="col-span-3">
              <CalendarInput
                placeholder="해칭일을 선택하세요"
                value={formData.hatchingDate}
                onSelect={(date) => {
                  if (!date) return;
                  setFormData((prev) => ({ ...prev, hatchingDate: format(date, "yyyy-MM-dd") }));
                }}
                disabled={(date) => isBefore(date, new Date(layingDate))}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="species">크기</Label>
            <Select
              value={formData.growth}
              onValueChange={(value: PetDtoGrowth) =>
                setFormData((prev) => ({ ...prev, growth: value }))
              }
            >
              <SelectTrigger className="col-span-3 w-full text-[16px]">
                <SelectValue placeholder="크기를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PetDtoGrowth).map((growth) => (
                  <SelectItem key={growth} value={growth} className="text-[16px]">
                    {GROWTH_KOREAN_INFO[growth]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clutch">이름</Label>
            <div className="col-span-3 flex flex-col gap-1">
              <Input
                id="name"
                type="text"
                placeholder="이름을 입력하세요"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clutch">메모</Label>
            <div className="col-span-3 flex flex-col gap-1">
              <Textarea
                id="desc"
                placeholder="메모를 입력하세요"
                value={formData.desc}
                onChange={(e) => setFormData((prev) => ({ ...prev, desc: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit}>해칭 완료</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteHatchingModal;
