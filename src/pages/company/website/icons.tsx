import React from 'react';
import Svg, { Path, Polygon } from 'react-native-svg';
import { scaleSizeW } from '@/utils/screenUtils';

interface IconProps {
  size?: number;
  color?: string;
}

/** 导航按钮定位图标（figma 2134:6660 浅色版蓝色 / 2136:6704 深色版白色） */
export function NavIcon({ size = 16, color = '#2962D4' }: IconProps) {
  const s = scaleSizeW(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8.205 14.4337C8.14493 14.4769 8.07336 14.5 8 14.5C7.92664 14.5 7.85507 14.4769 7.795 14.4337C4.59857 12.1379 3 9.86842 3 7.62459C3 4.18782 5.5 2.5 8 2.5C10.5 2.5 13 4.18782 13 7.62459C13 9.86842 11.4018 12.1379 8.205 14.4337ZM8 9.45479C8.56832 9.45479 9.11336 9.2234 9.51523 8.81153C9.91709 8.39965 10.1429 7.84102 10.1429 7.25854C10.1429 6.67606 9.91709 6.11744 9.51523 5.70556C9.11336 5.29368 8.56832 5.06229 8 5.06229C7.43168 5.06229 6.88663 5.29368 6.48477 5.70556C6.08291 6.11744 5.85714 6.67606 5.85714 7.25854C5.85714 7.84102 6.08291 8.39965 6.48477 8.81153C6.88663 9.2234 7.43168 9.45479 8 9.45479Z"
        fill={color}
      />
    </Svg>
  );
}

/** 相册视频播放三角（figma 2182:5738） */
export function PlayTriangleIcon({ size = 10, color = '#FFFFFF' }: IconProps) {
  const s = scaleSizeW(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 10 10" fill="none">
      <Polygon points="1,0.8 9.2,5 1,9.2" fill={color} />
    </Svg>
  );
}

/** 展开/收起 下箭头（figma 2139:6772 chevron） */
export function ChevronDownIcon({ size = 10, color = '#999999' }: IconProps) {
  const s = scaleSizeW(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 10 10" fill="none">
      <Path
        d="M1.5 3.2L5 6.7L8.5 3.2"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 分享图标（figma 2932:6776，头部右上角圆形按钮内 20x20） */
export function ShareIcon({ size = 20, color = '#000000' }: IconProps) {
  const s = scaleSizeW(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      <Path
        d="M19.015 9.0153C18.4451 9.0153 18.0306 9.48161 18.0306 9.99973C18.0306 14.4038 14.4556 17.9788 10.0515 17.9788C5.64752 17.9788 2.07248 14.4038 2.07248 9.99973C2.07248 5.59571 5.59571 2.02067 9.99973 2.02067C10.5697 2.02067 10.9842 1.55436 10.9842 1.03624C10.9842 0.518121 10.5697 -2.2263e-08 9.99973 0C4.50765 0 0 4.50765 0 9.99973C0 15.4918 4.50765 19.9995 9.99973 19.9995C15.4918 19.9995 19.9995 15.4918 19.9995 9.99973C19.9995 9.4298 19.5332 9.0153 19.015 9.0153Z"
        fill={color}
      />
      <Path
        d="M9.1704 10.7761L9.01497 11.1388C8.80772 11.6569 9.01496 12.2269 9.53309 12.4341C9.63671 12.4859 9.79215 12.5377 9.94758 12.5377C10.3103 12.5377 10.7248 12.3305 10.8802 11.916L11.0356 11.5533C12.0201 9.16996 13.7299 7.14929 15.8023 5.69855L15.6987 7.09747C15.6469 7.66741 16.0614 8.13372 16.6313 8.18553H16.6832C17.2013 8.18553 17.6158 7.77103 17.6676 7.25291L17.9266 3.98875C17.9785 3.15975 17.3567 2.43439 16.5277 2.38257L13.2636 2.12351C12.7454 2.0717 12.2273 2.4862 12.1755 3.05613C12.1237 3.62606 12.5382 4.09237 13.1081 4.14418L14.4034 4.24781C12.0719 5.85398 10.2585 8.13372 9.1704 10.7761Z"
        fill={color}
      />
    </Svg>
  );
}

/** 联系方式弹层：联系人头像占位（person） */
export function ContactPersonIcon({ size = 50 }: { size?: number }) {
  const s = scaleSizeW(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 50 50" fill="none">
      <Path
        d="M25 0C11.19 0 0 11.19 0 25s11.19 25 25 25 25-11.19 25-25S38.81 0 25 0z"
        fill="#E3EDFF"
      />
      <Path
        d="M25 9.6a7.4 7.4 0 110 14.8 7.4 7.4 0 010-14.8zM10.3 35.1c2.1-4.4 7.1-6.9 12-6.9h5.4c4.9 0 9.9 2.5 12 6.9A18.63 18.63 0 0125 43c-6.1 0-11.5-3.1-14.7-7.9z"
        fill="#2962D4"
      />
    </Svg>
  );
}

/** 联系方式弹层：拨打电话 */
export function CallPhoneIcon({ size = 20, color = '#2962D4' }: IconProps) {
  const s = scaleSizeW(size);
  return (
    <Svg width={s} height={s} viewBox="0 0 20 20" fill="none">
      <Path
        d="M17.76 13.94l-2.65-.27a1.24 1.24 0 00-1.02.35l-1.16 1.19a15.2 15.2 0 01-6.6-6.6l1.18-1.17c.28-.28.4-.67.35-1.04l-.27-2.66A1.25 1.25 0 006.34 2.5H3.4C2.72 2.5 2.13 3.08 2.2 3.76a16.63 16.63 0 0014.04 14.04c.68.07 1.26-.52 1.26-1.2v-2.94c0-.63-.48-1.15-1.1-1.22l2.65-.5z"
        fill={color}
      />
    </Svg>
  );
}
