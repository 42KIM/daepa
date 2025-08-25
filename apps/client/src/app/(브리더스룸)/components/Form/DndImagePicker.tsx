import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { buildTransformedUrl, cn, resizeImageFile } from "@/lib/utils";
import { X, Plus, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { usePetStore } from "../../register/store/pet";
import { useState } from "react";

interface DndImagePickerProps {
  max?: number;
  disabled?: boolean;
}

export default function DndImagePicker({ max = 3, disabled }: DndImagePickerProps) {
  const { formData, setFormData } = usePetStore();
  const [isLoading, setIsLoading] = useState(false);
  const photos: string[] = formData.photos ?? [];
  const ids = photos.map((p, idx) => `${idx}:${p}`);

  const ACCEPT: Record<string, string[]> = {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "image/webp": [".webp"],
    "image/avif": [".avif"],
  };

  const onAdd = async (files: File[]) => {
    if (!files || files.length === 0 || isLoading) return;

    const currentPhotos: string[] = (formData.photos ?? []) as string[];
    const remain = Math.max(0, 3 - currentPhotos.length);
    const picked = files.slice(0, remain);

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const targetFiles = picked.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`이미지 용량이 너무 큽니다 (최대 5MB): ${f.name}`);
        return false;
      }
      return true;
    });

    const promises = targetFiles.map((file) => resizeImageFile(file, 1280, 0.82));
    const results = await Promise.all(promises);
    setFormData((prev: { photos?: string[]; photoFiles?: File[] }) => ({
      ...prev,
      photos: [...(prev?.photos ?? []), ...results].slice(0, 3),
      photoFiles: [...(prev?.photoFiles ?? []), ...targetFiles],
    }));
  };

  const onDragEnd = (event: DragEndEvent) => {
    if (disabled || isLoading) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    // indices 매핑 반환
    const orderIndices = arrayMove(
      photos.map((_, i) => i),
      oldIndex,
      newIndex,
    );
    onReorder(orderIndices);
  };

  const onReorder = (order: number[]) => {
    if (disabled || isLoading) return;

    const photos = [...(formData.photos ?? [])];
    const files = [...(formData.photoFiles ?? [])];
    const nextPhotos = order.map((i) => photos[i]);
    const nextFiles = order.filter((i) => i < files.length).map((i) => files[i]);
    setFormData({ ...formData, photos: nextPhotos, photoFiles: nextFiles });
  };

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    accept: ACCEPT,
    multiple: true,
    noClick: true,
    onDropAccepted: async (accepted) => {
      const remain = Math.max(0, max - photos.length);
      if (remain <= 0) return;
      setIsLoading(true);
      await onAdd(accepted.slice(0, remain));
      setIsLoading(false);
    },
    onDropRejected: (rejections) => {
      const names = rejections.map((r) => r.file.name).join(", ");
      toast.error(`허용되지 않는 이미지 형식입니다: ${names}`);
    },
  });

  return (
    <div>
      <p className="text-sm text-blue-500">
        최대 3장까지 업로드 가능합니다. (jpg, jpeg, png, gif, webp, avif, heic, heif)
      </p>
      <div className="mb-2 flex items-center gap-1 text-gray-600">
        <Info className="h-3 w-3" />
        <p className="text-xs">사진을 눌러 순서를 변경할 수 있습니다.</p>
      </div>

      <div {...getRootProps()} className="relative">
        <input {...getInputProps()} />
        <DndContext onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <div className={cn("grid grid-cols-3 gap-2", isDragActive && "ring-2 ring-blue-400")}>
              {photos.map((u, index) => {
                const url: string = typeof u === "string" ? u : "";
                return (
                  <SortableThumb
                    key={String(ids[index])}
                    id={String(ids[index])}
                    src={url}
                    disabled={disabled}
                    index={index}
                    isLoading={isLoading}
                  />
                );
              })}
              {!disabled &&
                photos.length < max &&
                (!isLoading ? (
                  <button
                    type="button"
                    onClick={open}
                    className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                ) : (
                  <div className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function SortableThumb({
  id,
  src,
  disabled,
  index,
  isLoading,
}: {
  id: string;
  src: string;
  disabled?: boolean;
  index: number;
  isLoading?: boolean;
}) {
  const { formData, setFormData } = usePetStore();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as const;

  const onDelete = () => {
    const updatedPhotos = [...(formData.photos ?? [])];
    updatedPhotos.splice(index, 1);
    const updatedFiles = [...(formData.photoFiles ?? [])];
    if (index < updatedFiles.length) updatedFiles.splice(index, 1);
    setFormData({ ...formData, photos: updatedPhotos, photoFiles: updatedFiles });
  };

  return (
    <div ref={setNodeRef} style={style} className="relative h-24 w-full select-none">
      <div
        {...attributes}
        {...listeners}
        className="absolute inset-0 cursor-grab overflow-hidden rounded-xl"
      >
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <Image src={buildTransformedUrl(src)} alt="photo" fill className="object-cover" />
        )}
      </div>
      {!disabled && !isLoading && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
          aria-label="삭제"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
