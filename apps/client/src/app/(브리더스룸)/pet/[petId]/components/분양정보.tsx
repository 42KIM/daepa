import {
  adoptionControllerUpdate,
  adoptionControllerCreateAdoption,
  CreateAdoptionDto,
  PetAdoptionDto,
  PetAdoptionDtoStatus,
  UpdateAdoptionDto,
  adoptionControllerGetAdoptionByPetId,
  PetAdoptionDtoMethod,
  UserProfilePublicDto,
} from "@repo/api-client";
import { AxiosError } from "axios";
import FormItem from "./FormItem";
import SingleSelect from "@/app/(브리더스룸)/components/SingleSelect";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePetStore } from "@/app/(브리더스룸)/pet/store/pet";
import { cn, getChangedFields } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import NumberField from "@/app/(브리더스룸)/components/Form/NumberField";
import CalendarInput from "@/app/(브리더스룸)/hatching/components/CalendarInput";
import { isNil, isNotNil, isUndefined, omitBy } from "es-toolkit";
import UserList from "@/app/(브리더스룸)/components/UserList";
import { overlay } from "overlay-kit";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import Loading from "@/components/common/Loading";
import { useRouter } from "next/navigation";
import { ADOPTION_METHOD_KOREAN_INFO } from "@/app/(브리더스룸)/constants";
import { useIsMyPet } from "@/hooks/useIsMyPet";

interface AdoptionInfoProps {
  petId: string;
  ownerId: string;
}

const AdoptionInfo = ({ petId, ownerId }: AdoptionInfoProps) => {
  const router = useRouter();

  const { formData, setFormData } = usePetStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isViewingMyPet = useIsMyPet(ownerId);

  const { data: adoption, refetch } = useQuery({
    queryKey: [adoptionControllerGetAdoptionByPetId.name, petId],
    queryFn: () => adoptionControllerGetAdoptionByPetId(petId),
    enabled: !!petId,
    select: (response) => response.data.data,
  });

  const adoptionData = useMemo<Partial<PetAdoptionDto>>(
    () => formData?.adoption ?? {},
    [formData?.adoption],
  );

  const { mutateAsync: updateAdoption } = useMutation({
    mutationFn: ({ adoptionId, data }: { adoptionId: string; data: UpdateAdoptionDto }) =>
      adoptionControllerUpdate(adoptionId, data),
  });

  const { mutateAsync: createAdoption } = useMutation({
    mutationFn: (data: CreateAdoptionDto) => adoptionControllerCreateAdoption(data),
  });

  // 변경된 필드 추출을 위한 설정
  const getChangedFieldsForAdoption = useCallback(
    (original: typeof adoption, current: typeof adoptionData): UpdateAdoptionDto => {
      if (!original) {
        // 기존 데이터가 없으면 현재 데이터 전체를 변경된 것으로 간주
        return omitBy(
          {
            price: current.price ? Number(current.price) : undefined,
            adoptionDate: current.adoptionDate,
            memo: current.memo,
            method: current.method,
            buyerId: current.buyer?.userId,
            status: current.status,
          },
          isUndefined,
        );
      }

      const changedFields = getChangedFields(
        original as unknown as Record<string, unknown>,
        current as unknown as Record<string, unknown>,
        {
          fields: ["price", "adoptionDate", "memo", "method", "status", "buyer"],
          convertUndefinedToNull: true, // undefined를 null로 변환하여 서버에서 업데이트되도록 함
        },
      );

      if ("buyer" in changedFields) {
        const buyer = changedFields["buyer"] as UserProfilePublicDto | null;
        changedFields["buyerId"] = buyer?.userId ?? null;
        delete changedFields["buyer"];
      }

      return changedFields as UpdateAdoptionDto;
    },
    [],
  );

  const resetAdoption = useCallback(() => {
    if (isNil(adoption)) {
      setFormData((prev) => ({
        ...prev,
        adoption: {
          status: PetAdoptionDtoStatus.ON_SALE,
          method: PetAdoptionDtoMethod.PICKUP,
          price: 0,
          adoptionDate: new Date().toISOString(),
          memo: "",
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, adoption }));
    }
  }, [adoption, setFormData]);

  useEffect(() => {
    resetAdoption();
  }, [resetAdoption]);

  const handleSave = useCallback(async () => {
    if (!petId) {
      toast.error("펫 정보를 찾을 수 없습니다. 다시 선택해주세요.");
      return;
    }

    const adoptionId = adoptionData?.adoptionId;

    try {
      setIsProcessing(true);

      if (adoptionId) {
        // 업데이트 경우: 변경된 필드만 추출
        const changedFields = getChangedFieldsForAdoption(adoption, adoptionData);

        // 변경사항이 없으면 API 호출하지 않음
        if (Object.keys(changedFields).length === 0) {
          toast.info("변경된 사항이 없습니다.");
          setIsEditMode(false);
          return;
        }

        if (adoptionData.status === PetAdoptionDtoStatus.SOLD) {
          // 판매완료 확인 모달
          const confirmed = await new Promise<boolean>((resolve) => {
            overlay.open(({ isOpen, close }) => (
              <Dialog
                open={isOpen}
                onOpenChange={() => {
                  resolve(false);
                  close();
                }}
              >
                <DialogContent className="rounded-3xl p-6">
                  <DialogTitle className="text-sm font-semibold text-red-500">주의!</DialogTitle>
                  <div className="flex flex-col py-2 text-gray-600">
                    <span className={"font-semibold"}>정말 분양완료 처리하시겠습니까?</span>
                    <span className={"text-sm"}>
                      - 분양완료 후에는 개체의 소유권이 완전히 이전됩니다.
                    </span>
                    <span className={"text-sm"}>
                      - 더이상 개체 정보를 수정하거나 삭제할 수 없습니다.
                    </span>
                    <span className={"text-sm text-red-500 underline"}>
                      - 이 펫과 관련된 처리되지 않은 부모 요청이 있는 경우, 완료 처리가
                      불가능합니다.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      variant="outline"
                      onClick={() => {
                        resolve(false);
                        close();
                      }}
                    >
                      취소
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      onClick={() => {
                        resolve(true);
                        close();
                      }}
                    >
                      확인
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ));
          });

          if (!confirmed) {
            setIsProcessing(false);
            return;
          }
        }

        await updateAdoption({ adoptionId, data: changedFields });
      } else {
        // 생성 경우: 모든 필드 포함
        const newAdoptionDto = omitBy(
          {
            petId,
            price: adoptionData.price ? Number(adoptionData.price) : undefined,
            adoptionDate: adoptionData.adoptionDate,
            memo: adoptionData.memo,
            method: adoptionData.method,
            buyerId: adoptionData.buyer?.userId,
            status: adoptionData.status,
          },
          isUndefined,
        );
        await createAdoption({ ...newAdoptionDto, petId });
      }

      setIsEditMode(false);

      // 판매완료인 경우, 더 이상 본인 펫이 아님
      if (adoptionData.status === PetAdoptionDtoStatus.SOLD) {
        toast.success("분양 완료! 분양룸으로 이동합니다.");
        void router.replace("/adoption");
      } else {
        await refetch();
        toast.success("분양 정보가 성공적으로 업데이트되었습니다.");
      }
    } catch (error: unknown) {
      console.error("분양 정보 수정 실패:", error);

      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;
        const errorMessage = Array.isArray(message) ? message[0] : message;
        toast.error(errorMessage || "분양 정보 수정에 실패했습니다. 다시 시도해주세요.");
      } else {
        toast.error("분양 정보 수정에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsProcessing(false);
    }
  }, [
    updateAdoption,
    createAdoption,
    adoptionData,
    petId,
    refetch,
    router,
    adoption,
    getChangedFieldsForAdoption,
  ]);

  const handleSelectBuyer = useCallback(() => {
    if (!isEditMode) return;

    overlay.open(({ isOpen, close }) => (
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent className="rounded-3xl p-4">
          <DialogTitle className="h-4 text-base font-semibold text-gray-800">
            입양자를 선택해주세요.
          </DialogTitle>
          <UserList
            selectedUserId={adoptionData.buyer?.userId}
            onSelect={(user) => {
              setFormData((prev) => ({
                ...prev,
                adoption: { ...(prev.adoption ?? {}), buyer: user },
              }));
              close();
            }}
          />
        </DialogContent>
      </Dialog>
    ));
  }, [adoptionData.buyer?.userId, setFormData, isEditMode]);

  const showAdoptionInfo = useMemo(() => {
    return !(isNil(adoption) && !isEditMode);
  }, [adoption, isEditMode]);

  const isAdoptionReservedOrSold = useMemo(() => {
    return (
      adoptionData.status === PetAdoptionDtoStatus.ON_RESERVATION ||
      adoptionData.status === PetAdoptionDtoStatus.SOLD
    );
  }, [adoptionData.status]);

  return (
    <div className="shadow-xs flex min-h-[480px] min-w-[300px] flex-1 flex-col gap-2 rounded-2xl bg-white p-3">
      <div className="text-[14px] font-[600] text-gray-600">분양정보</div>

      {!showAdoptionInfo && (
        <div className="flex h-full items-center justify-center text-[14px] text-gray-600">
          분양 정보를 등록해 관리를 시작해보세요!
        </div>
      )}

      {showAdoptionInfo && (
        <>
          {/* 분양 상태, 가격, 날짜, 입양자, 거래 방식, 메모 */}
          <FormItem
            label="분양 상태"
            content={
              <SingleSelect
                disabled={!isEditMode}
                type="adoptionStatus"
                initialItem={!isEditMode && isNil(adoption) ? undefined : adoptionData.status}
                onSelect={(item) => {
                  setFormData((prev) => {
                    const nextStatus = item as PetAdoptionDtoStatus;
                    const isNextStatusReservedOrSold =
                      nextStatus === PetAdoptionDtoStatus.ON_RESERVATION ||
                      nextStatus === PetAdoptionDtoStatus.SOLD;
                    return {
                      ...prev,
                      adoption: {
                        ...(prev.adoption ?? {}),
                        status: nextStatus,
                        buyer: isNextStatusReservedOrSold ? prev.adoption?.buyer : undefined,
                        adoptionDate: isNextStatusReservedOrSold
                          ? prev.adoption?.adoptionDate
                          : undefined,
                      },
                    };
                  });
                }}
              />
            }
          />

          <FormItem
            label="가격"
            content={
              <NumberField
                disabled={!isEditMode}
                value={
                  isNotNil(adoptionData.price) ? String(adoptionData.price) : isEditMode ? "" : "-"
                }
                setValue={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    adoption: {
                      ...(prev.adoption ?? {}),
                      price: value.value === "" ? undefined : Number(value.value),
                    },
                  }));
                }}
                inputClassName={cn(
                  " h-[32px]  w-full rounded-md border border-gray-200  placeholder:font-[500] pl-2",
                  !isEditMode && "border-none",
                )}
                field={{ name: "adoption.price", unit: "원", type: "number" }}
                stepAmount={10000}
              />
            }
          />

          <FormItem
            label="분양 날짜"
            content={
              !isEditMode || isAdoptionReservedOrSold ? (
                <CalendarInput
                  placeholder="-"
                  editable={isEditMode && isAdoptionReservedOrSold}
                  value={adoptionData.adoptionDate}
                  onSelect={(date) => {
                    setFormData((prev) => ({
                      ...prev,
                      adoption: { ...(prev.adoption ?? {}), adoptionDate: date?.toISOString() },
                    }));
                  }}
                />
              ) : (
                isEditMode && (
                  <div className="flex h-[32px] w-fit items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[12px] font-[500] text-gray-400">
                    예약중・분양 완료 시 선택 가능
                  </div>
                )
              )
            }
          />

          <FormItem
            label="입양자"
            content={
              <>
                {!(isNil(adoptionData.buyer?.userId) && isEditMode) && (
                  <div
                    className={cn(
                      "flex h-[32px] w-fit items-center gap-1 rounded-lg px-2 py-1 text-[14px] font-[500]",
                      adoptionData.buyer?.userId
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-800",
                    )}
                  >
                    {isNil(adoptionData.buyer?.userId) ? (
                      "-"
                    ) : (
                      <div className="flex items-center gap-1">{adoptionData.buyer?.name}</div>
                    )}
                  </div>
                )}

                {isEditMode &&
                  (adoptionData.status === PetAdoptionDtoStatus.ON_RESERVATION ||
                  adoptionData.status === PetAdoptionDtoStatus.SOLD ? (
                    <Button
                      className="ml-1 h-8 cursor-pointer rounded-lg px-2 text-[12px] text-white"
                      onClick={handleSelectBuyer}
                    >
                      {isNil(adoptionData.buyer?.userId) ? "입양자 선택" : "변경"}
                    </Button>
                  ) : (
                    <div className="flex h-[32px] w-fit items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[12px] font-[500] text-gray-400">
                      예약중・분양 완료 시 선택 가능
                    </div>
                  ))}
              </>
            }
          />

          <FormItem
            label="거래 방식"
            content={
              <div className="flex h-[32px] items-center gap-1 rounded-lg bg-gray-100 p-1">
                {Object.values(PetAdoptionDtoMethod).map((method) => (
                  <button
                    key={method}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        adoption: {
                          ...(prev.adoption ?? {}),
                          method: prev.adoption?.method === method ? undefined : method,
                        },
                      }))
                    }
                    className={cn(
                      "h-full cursor-pointer rounded-md px-2 text-sm font-semibold text-gray-800",
                      adoptionData.method === method
                        ? "bg-blue-100 text-blue-600 shadow-sm"
                        : "text-gray-600",
                      !isEditMode && "cursor-not-allowed",
                    )}
                    disabled={!isEditMode}
                  >
                    {ADOPTION_METHOD_KOREAN_INFO[method]}
                  </button>
                ))}
              </div>
            }
          />

          <FormItem
            label="메모"
            content={
              <div className="relative w-full pt-2">
                <textarea
                  className={`min-h-[100px] w-full rounded-xl bg-gray-100 p-3 text-left text-[14px] focus:outline-none focus:ring-0 dark:bg-gray-600/50 dark:text-white`}
                  value={String(adoptionData.memo || "")}
                  maxLength={500}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      adoption: { ...(prev.adoption ?? {}), memo: e.target.value },
                    }))
                  }
                  disabled={!isEditMode}
                  style={{ height: "auto" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
                {isEditMode && (
                  <div className="absolute bottom-4 right-4 text-[12px] text-gray-500">
                    {adoptionData.memo?.length ?? 0}/{500}
                  </div>
                )}
              </div>
            }
          />
        </>
      )}

      {isViewingMyPet && (
        <div className="mt-2 flex w-full flex-1 items-end gap-2">
          {isEditMode && (
            <Button
              disabled={isProcessing}
              className="h-10 flex-1 cursor-pointer rounded-lg font-bold"
              onClick={() => {
                resetAdoption();
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
            onClick={() => {
              if (isEditMode) {
                handleSave();
              } else {
                setIsEditMode(true);
              }
            }}
          >
            {isProcessing ? (
              <Loading />
            ) : !isEditMode ? (
              !showAdoptionInfo ? (
                "분양 정보 등록"
              ) : (
                "수정하기"
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

export default AdoptionInfo;
