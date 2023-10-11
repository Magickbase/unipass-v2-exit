import { config, Indexer, RPC } from '@ckb-lumos/lumos';
import { atom, useAtom } from 'jotai';

export const configAtom = atom({
  lumosConfig: config.predefined.AGGRON4,
  rpcUrl: 'https://testnet.ckb.dev',
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
