import { CellDep } from '@ckb-lumos/lumos';

export const IS_MAINNET = import.meta.env.VITE_NETWORK === 'mainnet';

export const RPC_URL = IS_MAINNET
  ? 'https://mainnet.ckb.dev'
  : 'https://testnet.ckb.dev';

// UniPass config from
// https://github.com/lay2dev/unipass-v2-demo/blob/867ffce909fdc2d6fc444b6005c3941a88398ce9/src/components/config.ts
const TESTNET_UNIPASS_CELL_DEPS: CellDep[] = [
  '0x04a1ac7fe15e454741d3c5c9a409efb9a967714ad2f530870514417978a9f655',
  '0x65080f85a9c270c1208cc8648f8d73dfb630bab659699f56fb27cff9039c5820',
  '0xd346695aa3293a84e9f985448668e9692892c959e7e83d6d8042e59c08b8cf5c',
].map((txHash) => ({
  depType: 'code',
  outPoint: {
    txHash,
    index: '0x0',
  },
}));

const MAINNET_UNIPASS_CELL_DEPS: CellDep[] = [
  '0x825e0e2f8c15a4740fb0043116e8aa4e664c2e6a41c79df71ba29c48a7a0ea62',
  '0xf247a0e9dfe9d559ad8486428987071b65d441568075465c2810409e889f4081',
  '0x1196caaf9e45f1959ea3583f92914ee8306d42e27152f7068f9eeb52ac23eeae',
].map((txHash) => ({
  depType: 'code',
  outPoint: {
    txHash,
    index: '0x0',
  },
}));

const TESTNET_UNIPASS_CODEHASH =
  '0x124a60cd799e1fbca664196de46b3f7f0ecb7138133dcaea4893c51df5b02be6';
const MAINNET_UNIPASS_CODEHASH =
  '0x614d40a86e1b29a8f4d8d93b9f3b390bf740803fa19a69f1c95716e029ea09b3';

export const UNIPASS_CELL_DEPS = IS_MAINNET
  ? MAINNET_UNIPASS_CELL_DEPS
  : TESTNET_UNIPASS_CELL_DEPS;
export const UNIPASS_CODE_HASH = IS_MAINNET
  ? MAINNET_UNIPASS_CODEHASH
  : TESTNET_UNIPASS_CODEHASH;
