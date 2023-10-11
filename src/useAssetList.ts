import { Indexer } from '@ckb-lumos/lumos';
import { useQuery } from 'react-query';

import { useProvider } from './useProvider.ts';
import { useUnipass } from './useUnipass.ts';

export function useAssetList() {
  const { rpcUrl, lumosConfig } = useProvider();
  const { lock } = useUnipass();

  return useQuery({
    queryKey: ['assetList', { rpcUrl, lock }],
    queryFn: async () => {
      const indexer = new Indexer(rpcUrl);

      const cells = await indexer.getCells({
        script: lock!,
        scriptType: 'lock',
      });

      return cells.objects.filter((cell) => {
        if (!cell.cellOutput.type && cell.data === '0x') {
          return true;
        }

        const isSudt =
          cell.cellOutput.type?.codeHash === lumosConfig.SCRIPTS.SUDT.CODE_HASH;

        return isSudt;
      });
    },

    enabled: !!lock,
  });
}
