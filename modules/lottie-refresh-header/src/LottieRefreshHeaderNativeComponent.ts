import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

type ChangeOffsetEvent = {
  offset: CodegenTypes.Float;
};

type ChangeStateEvent = {
  state: CodegenTypes.Int32;
};

export interface NativeProps extends ViewProps {
  /** 请求结束置 false，原生端收起刷新头 */
  refreshing?: boolean;
  /** 触发刷新的下拉距离（pt），默认 100 */
  triggerHeight?: CodegenTypes.Float;
  /** 刷新中固定的头部高度（pt），默认 80 */
  headerHeight?: CodegenTypes.Float;
  onChangeOffset?: CodegenTypes.DirectEventHandler<ChangeOffsetEvent>;
  onChangeState?: CodegenTypes.DirectEventHandler<ChangeStateEvent>;
}

export default codegenNativeComponent<NativeProps>(
  'LottieRefreshHeader',
) as HostComponent<NativeProps>;
