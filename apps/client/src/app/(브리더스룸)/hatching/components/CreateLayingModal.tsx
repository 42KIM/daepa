import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { useState } from "react";
import {
  CreateParentDtoRole,
  layingControllerCreateLaying,
  matingControllerFindAll,
  PetDtoSpecies,
  PetSummaryDto,
} from "@repo/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SPECIES_KOREAN_INFO } from "../../constants";

interface CreateLayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matingId: number;
  father?: PetSummaryDto;
  mother?: PetSummaryDto;
}

const CreateLayingModal = ({
  isOpen,
  onClose,
  matingId,
  father,
  mother,
}: CreateLayingModalProps) => {
  const queryClient = useQueryClient();

  const { mutate: createLaying } = useMutation({
    mutationFn: layingControllerCreateLaying,
    onSuccess: () => {
      toast.success("산란이 추가되었습니다.");
      queryClient.invalidateQueries({ queryKey: [matingControllerFindAll.name] });
    },
    onError: () => {
      toast.error("산란 추가에 실패했습니다.");
    },
  });

  const [formData, setFormData] = useState<{
    species: PetDtoSpecies;
    layingDate: string;
    clutchCount: string;
    temperature: string;
  }>({
    species: PetDtoSpecies.CRESTED,
    layingDate: new Date().toISOString(),
    clutchCount: "2",
    temperature: "25",
  });

  const handleSubmit = () => {
    if (!formData.species) {
      toast.error("종은 필수 입력 항목입니다.");
      return;
    }

    if (!formData.layingDate) {
      toast.error("산란일은 필수 입력 항목입니다.");
      return;
    }

    if (!formData.clutchCount) {
      toast.error("산란 수는 필수 입력 항목입니다.");
      return;
    }

    const layingDate = parseInt(formData.layingDate.replace(/-/g, ""), 10);

    createLaying({
      matingId,
      layingDate,
      temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
      species: formData.species,
      clutchCount: parseInt(formData.clutchCount, 10),
      father: father
        ? {
            parentId: father.petId,
            role: CreateParentDtoRole.FATHER,
          }
        : undefined,
      mother: mother
        ? {
            parentId: mother.petId,
            role: CreateParentDtoRole.MOTHER,
          }
        : undefined,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>산란 추가</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="species">종</Label>
            <Select
              value={formData.species}
              onValueChange={(value: PetDtoSpecies) =>
                setFormData((prev) => ({ ...prev, species: value }))
              }
            >
              <SelectTrigger className="col-span-3 w-full text-[16px]">
                <SelectValue placeholder="종을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(PetDtoSpecies).map((species) => (
                  <SelectItem key={species} value={species} className="text-[16px]">
                    {SPECIES_KOREAN_INFO[species]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="layingDate">산란일</Label>
            <div className="col-span-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    data-field-name="layingDate"
                    className={cn(
                      "flex w-full items-center justify-between",
                      formData.layingDate && "text-black",
                    )}
                  >
                    {formData.layingDate
                      ? format(new Date(formData.layingDate), "yyyy년 MM월 dd일")
                      : "산란일을 선택하세요"}
                    <CalendarIcon className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.layingDate ? new Date(formData.layingDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFormData((prev) => ({ ...prev, layingDate: date.toISOString() }));

                        const trigger = document.querySelector(
                          `button[data-field-name="layingDate"]`,
                        );
                        if (trigger) {
                          (trigger as HTMLButtonElement).click();
                        }
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clutchCount">산란 수</Label>
            <Input
              id="clutchCount"
              type="number"
              min="1"
              placeholder="산란 수를 입력하세요"
              value={formData.clutchCount}
              onChange={(e) => setFormData((prev) => ({ ...prev, clutchCount: e.target.value }))}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="temperature">온도</Label>
            <Input
              id="temperature"
              type="number"
              step="0.1"
              placeholder="온도를 입력하세요"
              value={formData.temperature}
              onChange={(e) => setFormData((prev) => ({ ...prev, temperature: e.target.value }))}
              className="col-span-3"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit}>추가</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLayingModal;
