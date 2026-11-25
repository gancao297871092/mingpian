import { useEffect, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';
import { API } from '@/api';

const COUNTDOWN_SECONDS = 60;

/** 短信发送成功后才开始倒计时；凭证与接收手机号一起保存。 */
export function useSmsCode(scene: string) {
  const [authCode, setAuthCode] = useState('');
  const [sentPhone, setSentPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const pendingRef = useRef(false);
  const retryAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const sendCode = async (phone: string) => {
    if (pendingRef.current || Date.now() < retryAtRef.current) return;
    if (!/^1\d{10}$/.test(phone)) {
      Toast.show({ type: 'info', text1: '请输入正确的手机号' });
      return;
    }
    pendingRef.current = true;
    setSending(true);
    try {
      const res = await API.setting.smsSend({ phone, scene });
      if (res.code !== '200' || !res.data?.authCode) {
        Toast.show({ type: 'error', text1: '未获取到验证码凭证，请重试' });
        return;
      }
      setAuthCode(res.data.authCode);
      setSentPhone(phone);
      retryAtRef.current = Date.now() + COUNTDOWN_SECONDS * 1000;
      setCountdown(COUNTDOWN_SECONDS);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((retryAtRef.current - Date.now()) / 1000));
        setCountdown(remaining);
        if (!remaining && timerRef.current) clearInterval(timerRef.current);
      }, 1000);
      Toast.show({ type: 'success', text1: '验证码已发送' });
    } catch (error: any) {
      // 业务错误由请求拦截器提示；网络错误在此兜底。
      if (!error?.msg) Toast.show({ type: 'error', text1: '验证码发送失败，请重试' });
    } finally {
      pendingRef.current = false;
      setSending(false);
    }
  };

  return { authCode, sentPhone, sending, countdown, sendCode };
}
