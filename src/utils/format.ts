/**
 * 数字转 K/M/B 缩写
 */
export function numTokw(num: number | string, fixed?: number, noFixedNum?: number): string | number {
  if (!num || (Number(num) < 0 && Number.isNaN(Number(num)))) return 0;
  const nums = Number(num);
  if (isNaN(nums)) return 0;
  if (nums >= 1000 && nums < 1000000) {
    if (nums % 1000 === 0) {
      return nums / 1000 + 'K';
    }
    return (nums / 1000).toFixed(noFixedNum && nums < noFixedNum ? 0 : fixed ?? 1) + 'K';
  }
  if (nums >= 1000000 && nums < 100000000) {
    if (nums % 1000000 === 0) {
      return nums / 1000000 + 'M';
    }
    return (nums / 1000000).toFixed(noFixedNum && nums < noFixedNum ? 0 : fixed ?? 1) + 'M';
  }
  if (nums >= 100000000) {
    if (nums % 100000000 === 0) {
      return nums / 100000000 + 'B';
    }
    return (nums / 100000000).toFixed(noFixedNum && nums < noFixedNum ? 0 : fixed ?? 1) + 'B';
  }
  return nums.toFixed(noFixedNum && nums < noFixedNum ? 0 : fixed ?? 0);
}
