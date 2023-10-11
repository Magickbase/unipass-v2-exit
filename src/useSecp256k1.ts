// This file is for mocking the unipass

import { bytes, BytesLike } from '@ckb-lumos/codec';
import { hd } from '@ckb-lumos/lumos';
import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useCallback, useEffect, useMemo } from 'react';

import { useLockInfo } from './useLockInfo.ts';
import { useProvider } from './useProvider.ts';

const privateKeyAtom = atomWithStorage(
  'testPrivateKey',
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
);

// the atom for the original from connector content
const unipassConnectStringAtom = atomWithStorage('unipassConnectString', '');

const signatureAtom = atom<string>('');

export function useSecp256k1() {
  const [unipassConnectString, setUnipassConnectString] = useAtom(
    unipassConnectStringAtom,
  );
  const [privateKey] = useAtom(privateKeyAtom);
  const [signature, setSignature] = useAtom(signatureAtom);
  const config = useProvider();

  const lumosConfig = config.lumosConfig;

  useEffect(() => {
    const url = new URL(location.href);
    const signature = url.searchParams.get('signature');

    if (!signature) return;

    url.searchParams.delete('signature');
    window.history.replaceState({}, '', url.toString());
    setSignature(signature);
  }, []);

  const sign = useCallback((message: BytesLike) => {
    const signature = hd.key.signRecoverable(bytes.hexify(message), privateKey);
    const url = new URL(location.href);
    url.searchParams.set('signature', signature);

    window.open(url.toString(), '_self');
  }, []);

  const connect = () => {
    setUnipassConnectString(hd.key.privateKeyToBlake160(privateKey));
  };

  const lock = useMemo(() => {
    if (!unipassConnectString) return undefined;

    const SECP256K1 = lumosConfig.SCRIPTS.SECP256K1_BLAKE160;
    return {
      codeHash: SECP256K1.CODE_HASH,
      hashType: SECP256K1.HASH_TYPE,
      args: unipassConnectString,
    };
  }, [unipassConnectString]);

  const disconnect = () => {
    setUnipassConnectString('');
    setSignature('');
  };

  const finishSign = useCallback(() => {
    setSignature('');
  }, []);

  return {
    ...useLockInfo(lock),
    signature,
    sign,
    finishSign,
    connect,
    disconnect,
  };
}
