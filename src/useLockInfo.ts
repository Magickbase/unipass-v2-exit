import { helpers, Script } from '@ckb-lumos/lumos';
import { useMemo } from 'react';

import { useProvider } from './useProvider.ts';

export function useLockInfo(lock?: Script) {
  const config = useProvider();
  const lumosConfig = config.lumosConfig;

  const address = useMemo(() => {
    if (!lock) return null;

    return helpers.encodeToAddress(lock, { config: lumosConfig });
  }, [lock, lumosConfig]);

  return { lock, address };
}
