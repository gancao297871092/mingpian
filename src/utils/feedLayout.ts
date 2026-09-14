export type FeedCoverRatio = '3:4' | '16:9';

export const FEED_COVER_MIN_RATIO = 9 / 16;
export const FEED_COVER_MAX_RATIO = 4 / 3;

export const getFeedCoverHeight = (cardWidth: number, ratio: FeedCoverRatio = '3:4'): number => {
  const h = cardWidth * (ratio === '16:9' ? 9 / 16 : 4 / 3);
  return Math.min(Math.max(h, cardWidth * FEED_COVER_MIN_RATIO), cardWidth * FEED_COVER_MAX_RATIO);
};

export const clampFeedCoverHeight = (cardWidth: number, width: number, height: number): number => {
  if (width <= 0 || height <= 0) return getFeedCoverHeight(cardWidth);
  const h = (cardWidth * height) / width;
  return Math.min(Math.max(h, cardWidth * FEED_COVER_MIN_RATIO), cardWidth * FEED_COVER_MAX_RATIO);
};
