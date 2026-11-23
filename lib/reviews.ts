export const REVIEW_MIN_LENGTH = 10;
export const REVIEW_MAX_LENGTH = 2000;
export const REVIEW_TITLE_MAX_LENGTH = 100;
export const REVIEW_RATINGS = [1, 2, 3, 4, 5] as const;

export function cleanReviewText(value: string) {
  return value.replace(/\\s+/g, " ").trim();
}
