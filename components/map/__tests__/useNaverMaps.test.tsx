import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useNaverMaps } from '@/lib/hooks/useNaverMaps';

const NAVER_SDK_URL = 'https://oapi.map.naver.com/openapi/v3/maps.js';

describe('useNaverMaps hook', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    delete (window as any).naver;
    vi.stubEnv('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID', 'test-client');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete (window as any).naver;
  });

  const getSdkScript = () =>
    document.querySelector(`script[src^="${NAVER_SDK_URL}"]`) as HTMLScriptElement | null;

  it('loads the Naver Maps SDK and resolves when the script succeeds', async () => {
    const { result } = renderHook(() => useNaverMaps());

    const script = getSdkScript();
    expect(script).toBeTruthy();
    expect(script?.src).toContain('ncpKeyId=test-client');

    await act(async () => {
      (window as any).naver = { maps: {} };
      script?.dispatchEvent(new Event('load'));
    });

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.error).toBeNull();
  });

  it('captures script loading errors when the SDK fails to load', async () => {
    const { result } = renderHook(() => useNaverMaps());
    const script = getSdkScript();

    await act(async () => {
      const errorEvent = new Event('error');
      script?.dispatchEvent(errorEvent);
    });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.isLoaded).toBe(false);
  });

  it('flags as loaded immediately when the SDK is already on the page', async () => {
    (window as any).naver = { maps: {} };
    const { result } = renderHook(() => useNaverMaps());

    expect(result.current.isLoaded).toBe(true);
    expect(result.current.error).toBeNull();
    expect(getSdkScript()).toBeNull();
  });
});
