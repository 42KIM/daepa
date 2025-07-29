/**
 * 타입 가드 함수들
 */

export const isDetailData = (data: unknown): data is Record<string, any> => {
  return typeof data === "object" && data !== null;
};

export const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

export const isNumber = (value: unknown): value is number => {
  return typeof value === "number";
};

export const isBoolean = (value: unknown): value is boolean => {
  return typeof value === "boolean";
};

export const isArray = (value: unknown): value is any[] => {
  return Array.isArray(value);
};

export const isObject = (value: unknown): value is Record<string, any> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

export const isFunction = (value: unknown): value is Function => {
  return typeof value === "function";
};

export const isUndefined = (value: unknown): value is undefined => {
  return typeof value === "undefined";
};

export const isNull = (value: unknown): value is null => {
  return value === null;
};

export const isNullOrUndefined = (value: unknown): value is null | undefined => {
  return value === null || value === undefined;
};
