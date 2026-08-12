import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AxiosResponse } from 'axios';
import { PageList, FetchPageParams } from '@/utils/request';

type PagesListFn<R, P> = (params: P) => Promise<AxiosResponse<PageList<R>>>;

export function usePageList<T, P extends FetchPageParams>(
  fn: PagesListFn<T, P>,
  params?: Omit<P, 'pageSize' | 'pageNum'> | any,
  pageSize: number = 20,
  autoFetch: boolean = true,
) {
  const [isLastPage, setIsLastPage] = useState(false);
  const [pageNum] = useState(1);
  const [fetching, setFetching] = useState(false);
  const [total, setTotal] = useState(0);
  const [list, setList] = useState<T[]>([]);
  const listRef = useRef<T[]>([]);
  listRef.current = list;

  const getList = useCallback(
    (refresh?: boolean) => {
      if (!params || (!refresh && isLastPage) || fetching) return;

      const requestParams = { ...params };
      if (refresh) {
        requestParams.pageNum = 1;
      } else {
        requestParams.pageNum = Math.floor(listRef.current.length / pageSize) + 1;
      }
      requestParams.pageSize = pageSize;

      setFetching(true);
      fn(requestParams as P)
        .then(res => {
          const { data } = res.data;
          if (refresh || requestParams.pageNum === 1) {
            setList(data.list || []);
          } else {
            setList(prev => [...prev, ...(data.list || [])]);
          }
          setTotal(data.total);
          setIsLastPage(data.isLastPage);
        })
        .catch(() => {
          setIsLastPage(false);
        })
        .finally(() => {
          setFetching(false);
        });
    },
    [fn, params, isLastPage, fetching, pageSize],
  );

  const refresh = useCallback(() => {
    getList(true);
  }, [getList]);

  const loadMore = useCallback(() => {
    getList(false);
  }, [getList]);

  useEffect(() => {
    if (autoFetch) {
      getList(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return useMemo(
    () => ({
      list,
      setList,
      fetching,
      getList,
      refresh,
      loadMore,
      total,
      isLastPage,
      pageNum,
    }),
    [list, fetching, getList, refresh, loadMore, total, isLastPage, pageNum],
  );
}
