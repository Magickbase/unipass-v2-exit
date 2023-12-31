import { Cell } from '@ckb-lumos/base';
import { Indexer } from '@ckb-lumos/lumos';
import { useQuery } from 'react-query';

import { useSender } from './useConnector.ts';
import { useProvider } from './useProvider.ts';

export function useAssetList() {
  const { rpcUrl, lumosConfig } = useProvider();
  const { lock } = useSender();

  return useQuery({
    queryKey: ['assetList', { rpcUrl, lock }],
    queryFn: async () => {
      const indexer = new Indexer(rpcUrl);

      const cells: Cell[] = [];

      const collector = indexer.collector({
        lock: lock!,
        scriptSearchMode: 'exact',
      });
      for await (const cell of collector.collect()) {
        cells.push(cell);
      }

      return cells.filter((cell) => {
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
