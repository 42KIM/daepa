"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// 닉네임 검증 스키마
const nicknameSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상 입력해주세요.")
    .max(10, "닉네임은 10자 이하로 입력해주세요.")
    .regex(/^[가-힣a-zA-Z0-9]+$/, "닉네임은 한글, 영문, 숫자만 사용 가능합니다.")
    .refine((value) => !/^\d+$/.test(value), {
      message: "닉네임은 숫자로만 구성될 수 없습니다.",
    }),
});

type NicknameFormData = z.infer<typeof nicknameSchema>;

const RegisterPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<NicknameFormData>({
    resolver: zodResolver(nicknameSchema),
    mode: "onChange",
  });

  const nickname = watch("nickname");

  const onSubmit = async (data: NicknameFormData) => {
    setIsSubmitting(true);

    try {
      // TODO: API 호출하여 닉네임 등록
      // const response = await registerNickname(data.nickname);

      // 임시로 성공 처리
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("닉네임이 성공적으로 등록되었습니다!");

      // TODO: 실제 리다이렉트 경로로 수정
      router.replace("/pet");
    } catch (error) {
      console.error("닉네임 등록 실패:", error);
      toast.error("닉네임 등록에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="m-2 flex min-h-screen w-full items-center justify-center">
      <div className="w-full max-w-md">
        {/* 메인 카드 */}
        <Card className="border-1 border-gray-100 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-800/80">
          <CardHeader className="pb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <User className="h-8 w-8 text-blue-400 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              닉네임 설정
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              서비스 이용을 위해 닉네임을 설정해주세요
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="nickname"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  닉네임
                </label>
                <div className="relative">
                  <Input
                    id="nickname"
                    type="text"
                    placeholder="닉네임을 입력해주세요"
                    className={cn(
                      "h-12 text-base focus:border-0 focus:border-transparent focus:outline-none focus:ring-0",
                      errors.nickname
                        ? "border-red-500 focus-visible:ring-red-500/50"
                        : nickname && !errors.nickname
                          ? "focus-visible:ring-green-500/50"
                          : "focus-visible:ring-blue-500/50",
                    )}
                    {...register("nickname")}
                  />
                  {nickname && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      {nickname.length}/10
                    </div>
                  )}
                </div>

                {errors.nickname && (
                  <p className="flex items-center gap-1 text-sm text-red-500">
                    <span className="h-1 w-1 rounded-full bg-red-500"></span>
                    {errors.nickname.message}
                  </p>
                )}

                {nickname && !errors.nickname && (
                  <p className="flex items-center gap-1 text-sm text-green-600">
                    <span className="h-1 w-1 rounded-full bg-green-500"></span>
                    사용 가능한 닉네임입니다
                  </p>
                )}
              </div>

              {/* 닉네임 규칙 안내 */}
              <div className="space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  닉네임 규칙
                </h4>
                <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>• 2~10자 사이로 입력해주세요</li>
                  <li>• 한글, 영문, 숫자만 사용 가능합니다</li>
                  <li>• 숫자로만 구성된 닉네임은 사용할 수 없습니다</li>
                  <li>• 한 번 설정하면 변경이 어려우니 신중하게 선택해주세요</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="h-12 w-full bg-blue-600 text-base font-bold transition-all duration-200 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    처리중...
                  </div>
                ) : (
                  "닉네임 설정 완료"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 추가 안내 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            문제가 있으시면 고객센터로 문의해주세요
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
