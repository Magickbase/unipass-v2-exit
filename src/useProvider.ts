import { commons, config, Indexer, RPC } from '@ckb-lumos/lumos';
import { atom, useAtom } from 'jotai';

import { IS_MAINNET, RPC_URL, UNIPASS_CODE_HASH } from './env.ts';
import { asserts } from './helper.ts';
import { unipassLockScriptInfo } from './unipass/lumos-adaptor.ts';

asserts(
  import.meta.env.VITE_UNIPASS_V2_HOST,
  'VITE_UNIPASS_V2_HOST is not set',
);

commons.common.registerCustomLockScriptInfos([unipassLockScriptInfo]);

const lumosConfig = IS_MAINNET
  ? config.predefined.LINA
  : config.predefined.AGGRON4;

export const configAtom = atom({
  lumosConfig: {
    PREFIX: lumosConfig.PREFIX,
    SCRIPTS: {
      ...lumosConfig.SCRIPTS,
      UNIPASS: {
        INDEX: '0x0',
        // not in use
        TX_HASH: '0x',
        DEP_TYPE: 'code',
        CODE_HASH: UNIPASS_CODE_HASH,
        HASH_TYPE: 'type',
      } satisfies config.ScriptConfig,
    },
  },
  rpcUrl: RPC_URL,
  unipassV2Host: import.meta.env.VITE_UNIPASS_V2_HOST as string,
});

const rpcAtom = atom((get) => new RPC(get(configAtom).rpcUrl));
const indexerAtom = atom((get) => new Indexer(get(configAtom).rpcUrl));

export function useProvider() {
  const [config] = useAtom(configAtom);

  return {
    ...config,
    rpc: useAtom(rpcAtom)[0],
    indexer: useAtom(indexerAtom)[0],
  };
}
