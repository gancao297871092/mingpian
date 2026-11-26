import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../src/route/map';
import { useAgreementReturn } from '../src/pages/login/useAgreementReturn';

it('阅读协议关闭后导航，返回恢复一次，重复阅读仍能恢复', () => {
  let focus = () => {};
  const navigate = jest.fn();
  const unsubscribe = jest.fn();
  const navigation = {
    navigate,
    addListener: jest.fn((_event, listener) => { focus = listener; return unsubscribe; }),
  } as unknown as NativeStackNavigationProp<RootStackParamList>;
  const setVisible = jest.fn();
  let handlers: ReturnType<typeof useAgreementReturn>;
  function Harness() {
    handlers = useAgreementReturn(navigation, setVisible);
    return null;
  }
  let renderer: ReactTestRenderer;
  act(() => { renderer = create(<Harness />); });
  act(() => focus());
  expect(setVisible).not.toHaveBeenCalled();
  for (const type of ['userSure', 'privates'] as const) {
    navigate.mockClear();
    setVisible.mockClear();
    act(() => handlers.openAgreement(type));
    expect(setVisible).toHaveBeenLastCalledWith(false);
    expect(navigate).not.toHaveBeenCalled();
    act(() => { handlers.onDismiss(); handlers.onDismiss(); });
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('agreement', { type });
    setVisible.mockClear();
    act(() => { focus(); focus(); });
    expect(setVisible).toHaveBeenCalledTimes(1);
    expect(setVisible).toHaveBeenCalledWith(true);
  }
  act(() => renderer.unmount());
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
