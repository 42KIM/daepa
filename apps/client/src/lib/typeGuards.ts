/**
 * 타입 가드 함수들
 */

export const isNumber = (value: unknown): value is number => {
  return typeof value === "number";
};
