import { useEffect, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';
import { API } from '@/api';

const COUNTDOWN_SECONDS = 60;

/** 短信验证码发送 + 60s 倒计时（接口字段预设，待联调） */
export function useSmsCode(scene: string) {
  const [authCode, setAuthCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(COUNTDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendCode = async (phone: string) => {
    try {
      const res = await API.setting.smsSend({ phone, scene });
      if (res.code === '200' && res.data?.authCode) {
        setAuthCode(res.data.authCode);
      }
    } catch {
      // TODO 联调后移除容错
    }
    startCountdown();
    Toast.show({ type: 'success', text1: '验证码已发送' });
  };

  return { authCode, countdown, sendCode };
}
