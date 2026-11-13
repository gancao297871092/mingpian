/**
 * 省市区展示拼接：省名与市名相同（直辖市，如「重庆市-重庆市-九龙坡区」）
 * 或市为「市辖区」时去重，展示为「重庆市九龙坡区」。
 */
export function formatRegionText(
  province?: string | null,
  city?: string | null,
  district?: string | null,
): string {
  const skipCity = !city || city === province || city === '市辖区';
  return `${province || ''}${skipCity ? '' : city}${district || ''}`;
}

/** 完整地址展示：省市区（去重）+ 详细地址 */
export function formatFullAddress(
  data?: { province?: string | null; city?: string | null; district?: string | null; address?: string | null } | null,
): string {
  return `${formatRegionText(data?.province, data?.city, data?.district)}${data?.address || ''}`;
}
