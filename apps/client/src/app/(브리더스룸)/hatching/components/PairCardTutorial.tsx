"use client";

import { useEffect, useState, ReactNode } from "react";
import { X, Plus, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const TUTORIAL_STORAGE_KEY = "pair-card-tutorial-seen";

// 공통 스텝 레이아웃 컴포넌트
interface TutorialStepLayoutProps {
  visual: ReactNode;
  title: string;
  description: ReactNode;
}

function TutorialStepLayout({ visual, title, description }: TutorialStepLayoutProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {visual}
      <div className="text-center">
        <h4 className="mb-1 text-sm font-semibold text-white">{title}</h4>
        <p className="text-xs leading-relaxed text-white/80">{description}</p>
      </div>
    </div>
  );
}

// 모의 캘린더 셀 컴포넌트
function MockCalendarCell({ day, highlighted }: { day: number; highlighted?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 flex-col items-center justify-center rounded text-[11px]",
        highlighted
          ? "bg-blue-200 font-medium text-blue-700 ring-2 ring-white dark:bg-blue-300 dark:text-blue-800"
          : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
      )}
    >
      {day}
    </div>
  );
}

// 모의 팝오버 버튼 컴포넌트
function MockPopoverButton({
  label,
  color,
  highlighted,
}: {
  label: string;
  color: "blue" | "amber";
  highlighted?: boolean;
}) {
  const colorClasses = {
    blue: highlighted
      ? "bg-blue-50 text-blue-600 ring-2 ring-blue-400 dark:bg-blue-900/30 dark:text-blue-400"
      : "text-blue-600 dark:text-blue-400",
    amber: highlighted
      ? "bg-amber-50 text-amber-600 ring-2 ring-amber-400 dark:bg-amber-900/30 dark:text-amber-400"
      : "text-amber-600 dark:text-amber-400",
  };

  return (
    <div className={cn("flex items-center gap-1.5 rounded-md px-2 py-1.5", colorClasses[color])}>
      <Plus className="h-3 w-3" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

// 모의 팝오버 컴포넌트
function MockPopover({
  date,
  highlightMating,
  highlightLaying,
}: {
  date: string;
  highlightMating?: boolean;
  highlightLaying?: boolean;
}) {
  return (
    <div className="rounded-lg bg-white p-2 shadow-lg dark:bg-gray-800">
      <span className="mb-1.5 block text-xs font-semibold text-gray-800 dark:text-gray-200">
        {date}
      </span>
      <div className="flex flex-col gap-1 border-t border-gray-200 pt-1.5 dark:border-gray-600">
        <MockPopoverButton label="메이팅 추가" color="blue" highlighted={highlightMating} />
        <MockPopoverButton label="산란 추가" color="amber" highlighted={highlightLaying} />
      </div>
    </div>
  );
}

// 모의 부모 카드 컴포넌트
function MockParentCard({
  sex,
  label,
  highlighted,
}: {
  sex: "male" | "female";
  label: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg bg-white/20 p-2 dark:bg-white/10",
        highlighted && "ring-2 ring-white",
      )}
    >
      <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
        <Image src="/assets/lizard.png" alt="펫 이미지" fill className="object-cover" />
      </div>
      <span
        className={cn("text-[10px] font-medium", sex === "male" ? "text-blue-300" : "text-red-300")}
      >
        {sex === "male" ? "♂" : "♀"} {label}
      </span>
    </div>
  );
}

// 모의 메모 영역 컴포넌트
function MockMemoArea() {
  return (
    <div className="w-full max-w-[200px] rounded-lg border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 px-3 py-2 ring-2 ring-white dark:border-amber-700 dark:from-neutral-700 dark:to-neutral-800">
      <div className="flex items-center gap-2">
        <StickyNote className="h-4 w-4 flex-shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          메모를 추가하려면 클릭하세요
        </span>
      </div>
    </div>
  );
}

// 튜토리얼 스텝 정의
const TUTORIAL_STEPS = [
  {
    visual: (
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1">
          <MockCalendarCell day={14} />
          <MockCalendarCell day={15} highlighted />
          <MockCalendarCell day={16} />
        </div>
        <div className="animate-bounce text-white">↑</div>
      </div>
    ),
    title: "날짜를 클릭하세요",
    description: (
      <>
        색상이 있는 날짜를 클릭하면
        <br />
        상세 정보를 확인할 수 있어요
      </>
    ),
  },
  {
    visual: <MockPopover date="1월 15일" highlightMating />,
    title: "메이팅 추가",
    description: (
      <>
        빈 날짜를 클릭하면 팝업이 열리고
        <br />
        메이팅을 추가할 수 있어요
      </>
    ),
  },
  {
    visual: <MockPopover date="1월 20일" highlightLaying />,
    title: "산란 추가",
    description: (
      <>
        같은 방식으로 산란도 기록할 수 있어요
        <br />
        산란일에 맞춰 해칭 예정일이 계산됩니다
      </>
    ),
  },
  {
    visual: (
      <div className="flex gap-2">
        <MockParentCard sex="male" label="아빠" highlighted />
        <MockParentCard sex="female" label="엄마" />
      </div>
    ),
    title: "펫 상세 보기",
    description: (
      <>
        부모 이미지를 클릭하면
        <br />펫 상세 페이지로 이동해요
      </>
    ),
  },
  {
    visual: <MockMemoArea />,
    title: "메모 추가",
    description: (
      <>
        메모 영역을 클릭하면
        <br />
        페어에 대한 메모를 남길 수 있어요
      </>
    ),
  },
];

interface PairCardTutorialOverlayProps {
  onClose: () => void;
}

export function PairCardTutorialOverlay({ onClose }: PairCardTutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = TUTORIAL_STEPS.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    onClose();
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  };

  const currentStepData = TUTORIAL_STEPS[currentStep];

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-black/80 p-3 dark:bg-black/70">
      {/* 닫기 버튼 */}
      <button
        onClick={handleClose}
        className="absolute right-2 top-2 rounded-full p-1 text-white/70 hover:bg-white/20 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      {/* 스텝 인디케이터 (클릭 가능) */}
      <div className="mb-3 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={cn(
              "h-2 rounded-full transition-all",
              index === currentStep ? "w-5 bg-blue-400" : "w-2 bg-white/40 hover:bg-white/60",
            )}
          />
        ))}
      </div>

      {/* 스텝 콘텐츠 */}
      {currentStepData && (
        <TutorialStepLayout
          visual={currentStepData.visual}
          title={currentStepData.title}
          description={currentStepData.description}
        />
      )}

      {/* 버튼 */}
      <button
        onClick={handleNext}
        className="mt-4 rounded-lg bg-blue-500 px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600"
      >
        {currentStep < totalSteps - 1 ? "다음" : "시작하기"}
      </button>
    </div>
  );
}

// Legacy exports for backward compatibility
export function PairCardTutorial({ onClose: _onClose }: { onClose: () => void }) {
  void _onClose;
  return null;
}

export function usePairCardTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const openTutorial = () => {
    setShowTutorial(true);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  };

  return { showTutorial, openTutorial, closeTutorial };
}
