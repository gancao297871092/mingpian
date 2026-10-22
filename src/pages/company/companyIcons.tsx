import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { scaleSizeW } from '@/utils/screenUtils';

const PRIMARY = '#2962D4';

/** 经营地址定位图标（figma 1954:6273，16x16） */
export function AddressIcon({ size = 16, color = PRIMARY }: { size?: number; color?: string }) {
  return (
    <Svg width={scaleSizeW(size)} height={scaleSizeW(size)} viewBox="0 0 16 16" fill="none">
      <Path
        d="M8.205 14.4337C8.14493 14.4769 8.07336 14.5 8 14.5C7.92664 14.5 7.85507 14.4769 7.795 14.4337C4.59857 12.1379 3 9.86842 3 7.62459C3 4.18782 5.5 2.5 8 2.5C10.5 2.5 13 4.18782 13 7.62459C13 9.86842 11.4018 12.1379 8.205 14.4337ZM8 9.45479C8.56832 9.45479 9.11336 9.2234 9.51523 8.81153C9.91709 8.39965 10.1429 7.84102 10.1429 7.25854C10.1429 6.67606 9.91709 6.11744 9.51523 5.70556C9.11336 5.29368 8.56832 5.06229 8 5.06229C7.43168 5.06229 6.88663 5.29368 6.48477 5.70556C6.08291 6.11744 5.85714 6.67606 5.85714 7.25854C5.85714 7.84102 6.08291 8.39965 6.48477 8.81153C6.88663 9.2234 7.43168 9.45479 8 9.45479Z"
        fill={color}
      />
    </Svg>
  );
}

/** 拨号图标（figma 1964:6368，16.47x16.47） */
export function CallIcon({ size = 16.47, color = PRIMARY }: { size?: number; color?: string }) {
  return (
    <Svg width={scaleSizeW(size)} height={scaleSizeW(size)} viewBox="0 0 17 17" fill="none">
      <Path
        d="M15.3077 16.5366C14.0764 17.7837 9.47315 16.5852 4.93421 12.0669C0.380706 7.53037 -0.787419 2.93194 0.477848 1.70188C1.5464 0.633328 2.85903 -1.24636 4.80429 1.19918C6.74954 3.64471 5.8097 4.30892 4.67436 5.41026C3.89723 6.1716 5.53406 8.11443 7.20368 9.79984C8.90487 11.467 10.8343 13.1026 11.5957 12.3255C12.714 11.2084 13.3952 10.2685 15.7946 12.1968C18.2414 14.1724 16.3775 15.4996 15.3089 16.5366H15.3077Z"
        fill={color}
      />
    </Svg>
  );
}

/** 右侧箭头（figma 1954:6284，宽 9.24） */
export function ChevronRightIcon({ size = 9.24, color = '#6C6C6C' }: { size?: number; color?: string }) {
  return (
    <Svg width={scaleSizeW(size)} height={scaleSizeW(size * 1.6)} viewBox="0 0 9 14" fill="none">
      <Path
        d="M2 2L7 7L2 12"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
