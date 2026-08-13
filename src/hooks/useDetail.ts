import { useCallback, useEffect, useMemo, useState } from 'react';
import { ResponseResult } from '@/utils/request';

type DetailFn<R, P> = (params: P) => Promise<ResponseResult<R>>;

export function useDetail<T, P>(
  fn: DetailFn<T, P>,
  params?: P,
  autoFetch: boolean = true,
) {
  const [detail, setDetail] = useState<T | null>(null);
  const [fetching, setFetching] = useState(false);

  const getDetail = useCallback(() => {
    if (!params) return;
    setFetching(true);
    fn(params)
      .then(res => {
        if (res.code === '200') {
          setDetail(res.data);
        }
      })
      .finally(() => {
        setFetching(false);
      });
  }, [fn, params]);

  useEffect(() => {
    if (autoFetch) {
      getDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return useMemo(
    () => ({ detail, setDetail, fetching, getDetail }),
    [detail, fetching, getDetail],
  );
}
