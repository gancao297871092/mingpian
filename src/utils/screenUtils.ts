import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DESIGN_WIDTH = 375;
const DESIGN_HEIGHT = 812;

export const scaleSizeW = (size: number): number => {
  const scale = SCREEN_WIDTH / DESIGN_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const scaleSizeH = (size: number): number => {
  const scale = SCREEN_HEIGHT / DESIGN_HEIGHT;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const setSpText = (size: number): number => {
  const scale = Math.min(SCREEN_WIDTH / DESIGN_WIDTH, SCREEN_HEIGHT / DESIGN_HEIGHT);
  return Math.round(size * scale);
};

export const themeColor = '#1EA3B5';
export const themeColor1 = '#1EA3B5';

export const isIOS = Platform.OS === 'ios';

export const getStatusBarHeight = (): number => {
  return isIOS ? 44 : (StatusBar.currentHeight ?? 0);
};

export const getBottomSpaces = (): number => {
  return isIOS && SCREEN_HEIGHT >= 812 ? 34 : 0;
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };
