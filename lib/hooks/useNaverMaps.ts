import { useCallback, useEffect, useState } from 'react';
import type { NaverMapsGlobal } from '@/components/map/types';

const NAVER_SDK_URL = 'https://oapi.map.naver.com/openapi/v3/maps.js';

type UseNaverMapsState = {
  isLoaded: boolean;
  error: Error | null;
};

export const useNaverMaps = () => {
  const [state, setState] = useState<UseNaverMapsState>({ isLoaded: false, error: null });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if ((window as Window & { naver?: NaverMapsGlobal }).naver?.maps) {
      setState({ isLoaded: true, error: null });
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
    if (!clientId) {
      setState({ isLoaded: false, error: new Error('NEXT_PUBLIC_NAVER_MAP_CLIENT_ID is not configured') });
      return;
    }

    let script = document.querySelector<HTMLScriptElement>('script[data-navermap-sdk="true"]');
    const sdkUrl = `${NAVER_SDK_URL}?ncpKeyId=${clientId}`;

    if (!script) {
      script = document.createElement('script');
      script.src = sdkUrl;
      script.async = true;
      script.defer = true;
      script.dataset.navermapSdk = 'true';
      document.head.appendChild(script);
    }

    const handleLoad = () => {
      if ((window as Window & { naver?: NaverMapsGlobal }).naver?.maps) {
        setState({ isLoaded: true, error: null });
      } else {
        setState({ isLoaded: false, error: new Error('Naver Maps SDK loaded but window.naver.maps is unavailable') });
      }
    };

    const handleError = () => {
      setState({ isLoaded: false, error: new Error('Failed to load Naver Maps SDK') });
    };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    return () => {
      script?.removeEventListener('load', handleLoad);
      script?.removeEventListener('error', handleError);
      const shouldRemoveScript = !(window as Window & { naver?: NaverMapsGlobal }).naver?.maps && script?.parentNode;
      if (shouldRemoveScript && script?.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [reloadKey]);

  const retry = useCallback(() => {
    setState({ isLoaded: false, error: null });
    setReloadKey((key) => key + 1);
  }, []);

  return { ...state, retry };
};
