import DndImagePicker from "@/app/(브리더스룸)/components/Form/DndImagePicker";
import Loading from "@/components/common/Loading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  petImageControllerFindOne,
  PetImageItem,
  petImageControllerSavePetImages,
} from "@repo/api-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isEqual } from "es-toolkit";
import { ImageUp } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useIsMyPet } from "@/hooks/useIsMyPet";

const Images = ({ petId, ownerId }: { petId: string; ownerId: string }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // 편집 중일 때만 임시 상태 사용 (null이면 photos 사용)
  const [editingImages, setEditingImages] = useState<PetImageItem[] | null>(null);

  const isViewingMyPet = useIsMyPet(ownerId);

  const { data: photos = [], refetch } = useQuery({
    queryKey: [petImageControllerFindOne.name, petId],
    queryFn: () => petImageControllerFindOne(petId),
    select: (response) => response.data,
  });

  // 현재 표시할 이미지 (편집 중이면 editingImages, 아니면 photos)
  const displayImages = editingImages ?? photos;

  const { mutateAsync: mutateSaveImages } = useMutation({
    mutationFn: (updateFiles: PetImageItem[]) =>
      petImageControllerSavePetImages(petId, { files: updateFiles }),
  });

  const handleSave = useCallback(async () => {
    try {
      setIsProcessing(true);

      // fileName만 비교하여 변경 여부 확인
      const originalFileNames = photos.map((p) => p.fileName);
      const currentFileNames = displayImages.map((p) => p.fileName);

      if (isEqual(originalFileNames, currentFileNames)) {
        toast.info("변경된 사항이 없습니다.");
        setEditingImages(null);
        setIsEditMode(false);
        return;
      }

      await mutateSaveImages(displayImages);
      await refetch();

      toast.success("이미지 수정이 완료되었습니다.");
      setEditingImages(null);
      setIsEditMode(false);
    } catch (error) {
      console.error("이미지 수정 실패:", error);
      toast.error("이미지 수정에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  }, [mutateSaveImages, displayImages, photos, refetch]);

  return (
    <div className="shadow-xs flex min-h-[480px] min-w-[340px] flex-1 flex-col gap-2 rounded-2xl bg-white p-3">
      <div className="text-[14px] font-[600] text-gray-600">이미지</div>

      {!isEditMode && photos.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center">
          <ImageUp className="h-[20%] w-[20%] text-blue-500/70" />
        </div>
      )}
      <DndImagePicker disabled={!isEditMode} images={displayImages} onChange={setEditingImages} />

      {isViewingMyPet && (
        <div className="mt-2 flex w-full flex-1 items-end gap-2">
          {isEditMode && (
            <Button
              disabled={isProcessing}
              className="h-10 flex-1 cursor-pointer rounded-lg font-bold"
              onClick={() => {
                setEditingImages(null);
                setIsEditMode(false);
              }}
            >
              취소
            </Button>
          )}
          <Button
            disabled={isProcessing}
            className={cn(
              "flex-2 h-10 cursor-pointer rounded-lg font-bold",
              isEditMode && "bg-red-600 hover:bg-red-600/90",
              isProcessing && "bg-gray-300",
            )}
            onClick={async () => {
              if (isEditMode) {
                await handleSave();
              } else {
                setEditingImages([...photos]);
                setIsEditMode(true);
              }
            }}
          >
            {isProcessing ? (
              <Loading />
            ) : !isEditMode ? (
              photos.length === 0 ? (
                "이미지 등록"
              ) : (
                "이미지 수정"
              )
            ) : (
              "수정된 사항 저장하기"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Images;
