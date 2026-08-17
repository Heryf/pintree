import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface Setting {
  value: any;
  type: string;
  group: string;
  description?: string;
}

/**
 * 客户端设置缓存：
 * - 模块级 Map + TTL，同一 group 在 TTL 内只请求一次；
 * - 并发请求去重（in-flight promise 共享）；
 * - 保存成功后通过 forceRefresh 强制刷新，保证后台修改立即可见。
 */
const CACHE_TTL = 60_000; // 60 秒
const cache = new Map<string, { data: Record<string, any>; expiresAt: number }>();
const inFlight = new Map<string, Promise<Record<string, any>>>();

async function fetchSettings(group?: string): Promise<Record<string, any>> {
  const key = group ?? '__all__';
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  // 并发去重：同一 key 的请求只发一次
  const pending = inFlight.get(key);
  if (pending) return pending;

  const promise = (async () => {
    const response = await fetch(`/api/settings${group ? `?group=${group}` : ''}`);
    if (!response.ok) throw new Error('Load settings failed');
    const data = await response.json();
    cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
    return data;
  })();

  inFlight.set(key, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(key);
  }
}

export function useSettings(group?: string) {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const groupRef = useRef(group);

  const loadSettings = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      if (forceRefresh) {
        const key = groupRef.current ?? '__all__';
        cache.delete(key);
      }
      const data = await fetchSettings(groupRef.current);
      setSettings(data);
    } catch (error) {
      toast.error('Load settings failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    groupRef.current = group;
    loadSettings();
  }, [group, loadSettings]);

  return {
    settings,
    loading,
    loadSettings,
  };
} 
