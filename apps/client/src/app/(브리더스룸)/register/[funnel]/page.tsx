"use client";

import { FORM_STEPS, GENDER_KOREAN_INFO, OPTION_STEPS, REGISTER_PAGE } from "../../constants";
import { FormHeader } from "../../components/Form/FormHeader";
import { useRegisterForm } from "../hooks/useRegisterForm";
import { useCallback, useEffect, use } from "react";
import { FormField } from "../../components/Form/FormField";

import { useSelect } from "../hooks/useSelect";
import { useMutation } from "@tanstack/react-query";
import { CreateParentDtoRole, CreatePetDto, petControllerCreate } from "@repo/api-client";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import Loading from "@/components/common/Loading";
import { isNil, pick, pickBy } from "es-toolkit";
import { BaseFormData } from "../../pet/store/base";
import { useRegisterPetStore } from "../../pet/store/register.pet";
import { overlay } from "overlay-kit";
import Dialog from "../../components/Form/Dialog";
import { cn } from "@/lib/utils";

const formatFormData = (formData: BaseFormData): CreatePetDto | undefined => {
  const data = { ...formData };
  if (data.sex && typeof data.sex === "string") {
    const genderEntry = Object.entries(GENDER_KOREAN_INFO).find(
      ([, koreanValue]) => koreanValue === data.sex,
    );
    if (genderEntry) {
      data.sex = genderEntry[0];
    }
  }

  const baseFields = pick(data, ["growth", "morphs", "name", "sex"]);

  const requestData = pickBy(
    {
      desc: data?.desc,
      hatchingDate: data?.hatchingDate,
      weight: data?.weight ? Number(data.weight) : undefined,
      father: data?.father?.petId
        ? {
            parentId: data.father.petId,
            role: CreateParentDtoRole.FATHER,
            isMyPet: false,
            message: data.father?.message,
          }
        : undefined,
      mother: data?.mother?.petId
        ? {
            parentId: data.mother.petId,
            role: CreateParentDtoRole.MOTHER,
            isMyPet: false,
            message: data.mother?.message,
          }
        : undefined,
      foods: data?.foods,
      traits: data?.traits,
      photos: data?.photos,
    },
    (value) => !isNil(value),
  );

  return {
    ...baseFields,
    ...requestData,
    species: data.species,
  };
};

export default function RegisterPage({ params }: { params: Promise<{ funnel: string }> }) {
  const router = useRouter();
  const { handleSelect } = useSelect();
  const { formData, step, setStep, setFormData, errors, setErrors, resetForm } =
    useRegisterPetStore();
  const resolvedParams = use(params);
  const funnel = Number(resolvedParams.funnel);
  const visibleSteps = FORM_STEPS.slice(-step - 1);

  const { mutateAsync: mutateCreatePet, isPending: isCreating } = useMutation({
    mutationFn: petControllerCreate,
  });

  useEffect(() => {
    if (funnel === REGISTER_PAGE.SECOND) return;

    const currentStep = FORM_STEPS[FORM_STEPS.length - step - 1];
    if (!currentStep) return;

    const { field } = currentStep;
    if (formData[field.name]) return;

    if (field.type === "select") {
      handleSelect({
        type: field.name,
        value: formData[field.name],
        handleNext,
      });
    } else if (field.type === "multipleSelect") {
      handleMultipleSelect(field.name);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  useEffect(() => {
    if (funnel === REGISTER_PAGE.SECOND) return;

    const currentStep = FORM_STEPS[FORM_STEPS.length - step - 1];
    if (!currentStep) return;

    const { field } = currentStep;
    if (field.type === "text") {
      const inputElement = document.querySelector(
        `input[name="${field.name}"]`,
      ) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }
  }, [step, funnel]);

  const handleSuccess = () => {
    toast.success("개체 등록이 완료되었습니다.");
    router.push(`/pet`);
    resetForm();
  };

  const createPet = async (formData: BaseFormData) => {
    try {
      const formattedData = formatFormData(formData);
      if (!formattedData) {
        toast.error("개체 등록에 실패했습니다.");
        return;
      }

      await mutateCreatePet(formattedData);
      handleSuccess();
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "개체 등록에 실패했습니다.");
      } else {
        toast.error("개체 등록에 실패했습니다.");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const { handleNext, goNext, handleMultipleSelect } = useRegisterForm({
    formStep: FORM_STEPS,
    formData,
    step,
    setErrors,
    setStep,
    setFormData,
    handleSubmit: createPet,
  });

  const handleReset = useCallback(() => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Dialog
        isOpen={isOpen}
        onCloseAction={close}
        onConfirmAction={() => {
          resetForm();
          void router.replace("/register/1");
          toast.success("입력 내용이 초기화되었습니다.");
          close();
        }}
        title="입력 내용 초기화"
        description="입력된 모든 내용이 사라집니다. 계속하시겠습니까?"
        onExit={unmount}
      />
    ));
  }, [resetForm, router]);

  if (isCreating) {
    return <Loading />;
  }

  return (
    <div className="relative mx-auto min-h-screen max-w-[640px] p-4 pb-20">
      <FormHeader funnel={funnel} />
      <form onSubmit={handleSubmit} className="space-y-4">
        {funnel === REGISTER_PAGE.FIRST && (
          <>
            {visibleSteps.map((step) => {
              const { title, field } = step;
              return (
                <div key={title}>
                  <h2 className="text-gray-500">{title}</h2>
                  <FormField
                    field={field}
                    handleChange={handleNext}
                    formData={formData}
                    errors={errors}
                    handleMultipleSelect={handleMultipleSelect}
                  />
                </div>
              );
            })}
          </>
        )}

        {funnel === REGISTER_PAGE.SECOND && (
          <>
            {OPTION_STEPS.map((step) => (
              <div key={step.title} className="mb-6 space-y-2">
                <div key={step.field.name}>
                  <FormField
                    field={step.field}
                    handleChange={handleNext}
                    formData={formData}
                    errors={errors}
                    label={step.title}
                    handleMultipleSelect={handleMultipleSelect}
                  />
                </div>
              </div>
            ))}
          </>
        )}
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-white p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] dark:bg-black">
          <div className="mx-auto flex max-w-[640px] items-center gap-2">
            <button
              type="submit"
              className={cn(
                "h-12 flex-1 cursor-pointer rounded-2xl bg-[#247DFE] text-lg font-bold text-white",
              )}
              onClick={() => goNext()}
            >
              {funnel === REGISTER_PAGE.SECOND ? "완료" : "다음"}
            </button>
            {formData.species && (
              <button
                type="button"
                onClick={handleReset}
                className={cn(
                  "flex w-fit shrink-0 items-center rounded-lg px-2 py-1 hover:bg-gray-100",
                )}
              >
                <span className="flex cursor-pointer items-center gap-1 px-2 py-1 text-[14px] font-[500] text-blue-600">
                  초기화
                </span>
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
