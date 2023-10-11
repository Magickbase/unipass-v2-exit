import { BI, commons, helpers } from '@ckb-lumos/lumos';
import { useEffect } from 'react';
import { useMutation, useQuery } from 'react-query';

import { addCellDep } from './helper.ts';
import { useAssetList } from './useAssetList.ts';
import { useJoyid } from './useJoyid.ts';
import { useProvider } from './useProvider.ts';
import { useUnipass } from './useUnipass.ts';

export function useTransfer() {
  const { rpcUrl, lumosConfig, indexer, rpc } = useProvider();
  const { data: cells } = useAssetList();
  const unipass = useUnipass();
  const joyid = useJoyid();

  const sender = unipass.lock;
  const receiver = joyid.lock;

  const transferTxQuery = useQuery({
    queryKey: ['transfer', { rpcUrl, sender, receiver, cells }],
    enabled: !!(cells?.length && sender && receiver),
    queryFn: async () => {
      if (!(cells?.length && sender && receiver)) throw new Error('Impossible');

      let txSkeleton = helpers.TransactionSkeleton({
        cellProvider: indexer,
      });

      for (const cell of cells) {
        txSkeleton = await commons.common.setupInputCell(
          txSkeleton,
          cell,
          undefined,
          {
            config: lumosConfig,
          },
        );
      }

      txSkeleton = addCellDep(txSkeleton, {
        outPoint: {
          index: lumosConfig.SCRIPTS.SUDT.INDEX,
          txHash: lumosConfig.SCRIPTS.SUDT.TX_HASH,
        },
        depType: lumosConfig.SCRIPTS.SUDT.DEP_TYPE,
      });

      txSkeleton = txSkeleton.update('outputs', (outputs) =>
        outputs.map((item) => ({
          ...item,
          cellOutput: { ...item.cellOutput, lock: receiver },
        })),
      );

      // TODO calc tx fee for more accurate fee
      let neededFee = BI.from(10000);
      txSkeleton = txSkeleton.update('outputs', (outputs) =>
        outputs.map((cell) => {
          let capacity = BI.from(cell.cellOutput.capacity);

          const minimalOccupation = helpers.minimalCellCapacityCompatible(cell);

          let availableForFee = capacity.sub(minimalOccupation);
          if (availableForFee.gt(neededFee)) availableForFee = neededFee;

          capacity = capacity.sub(availableForFee);
          neededFee = neededFee.sub(availableForFee);

          return {
            ...cell,
            cellOutput: {
              ...cell.cellOutput,
              capacity: capacity.toHexString(),
              lock: receiver,
            },
          };
        }),
      );

      if (neededFee.gt(0)) {
        throw new Error(
          `Not enough capacity, please try again later or deposit mode CKB to your address, ${unipass.address}`,
        );
      }

      txSkeleton = commons.common.prepareSigningEntries(txSkeleton, {
        config: lumosConfig,
      });

      return txSkeleton;
    },
  });

  const txSkeleton = transferTxQuery.data;

  const mutation = useMutation({
    mutationKey: 'transfer',
    mutationFn: async () => {
      if (!txSkeleton) {
        return;
      }

      if (unipass.signature) {
        const tx = helpers.sealTransaction(txSkeleton, [unipass.signature]);
        const txHash = rpc.sendTransaction(tx);

        // clear the signature after using it
        unipass.finishSign();

        return txHash;
      }

      const message = txSkeleton.get('signingEntries').get(0)?.message;

      if (!message) {
        throw new Error(
          'Cannot find any signing entries. This error is rare and should not happen, please report this issue to the developer.',
        );
      }

      unipass.sign(message);
    },
  });

  // execute the mutation when the signature is in the URL after redirecting from the UniPass
  useEffect(() => {
    if (txSkeleton && unipass.signature && !mutation.isLoading) {
      mutation.mutate();
    }
  }, [unipass.signature, txSkeleton, mutation.isLoading]);

  return mutation;
}
