import { bytes } from '@ckb-lumos/codec';
import { commons } from '@ckb-lumos/lumos';
import { connect, signMessage } from '@joyid/evm';
import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useCallback, useMemo } from 'react';

import { Connector } from './types.ts';
import { useLockInfo } from './useLockInfo.ts';
import { useProvider } from './useProvider.ts';

// the atom for the original to connector content
const joyidConnectStringAtom = atomWithStorage('joyidConnectString', '');
const joyidSignatureAtom = atom<string | undefined>(undefined);
/**
 * Connect to JoyID and return an Omnilock address
 */
export function useJoyid(): Connector {
  const [joyidConnectString, setJoyidConnectString] = useAtom(
    joyidConnectStringAtom,
  );
  const [joyidSignature, setJoyidSignature] = useAtom(joyidSignatureAtom);

  const { lumosConfig } = useProvider();

  const connectToJoyid = useCallback(
    () => connect().then(setJoyidConnectString),
    [],
  );

  const lock = useMemo(() => {
    if (!joyidConnectString) return undefined;

    const OMNILOCK = lumosConfig.SCRIPTS.OMNILOCK;
    // https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0042-omnilock/0042-omnilock.md#lock-script
    // Omnilock args
    const args = bytes.hexify(
      bytes.concat(
        [0x01], // ethereum authentication
        joyidConnectString,
        [0b00000010], // anyone-can-pay mode

        // https://github.com/nervosnetwork/rfcs/blob/master/rfcs/0042-omnilock/0042-omnilock.md#anyone-can-pay-mode
        // When anyone-can-pay mode is enabled, <2 bytes minimum ckb/udt in ACP> must be present.
        [0b00000000, 0b00000000],
      ),
    );

    return {
      codeHash: OMNILOCK.CODE_HASH,
      hashType: OMNILOCK.HASH_TYPE,
      args: args,
    };
  }, [joyidConnectString]);

  const disconnectFromJoyid = useCallback(() => {
    setJoyidConnectString('');
  }, []);

  const sign: Connector['sign'] = useCallback((message) => {
    void signMessage(bytes.bytify(message), joyidConnectString).then(
      (signature) => {
        let v = Number.parseInt(signature.slice(-2), 16);
        if (v >= 27) v -= 27;
        signature =
          '0x' + signature.slice(2, -2) + v.toString(16).padStart(2, '0');

        const packedSignature = commons.omnilock.OmnilockWitnessLock.pack({
          signature,
        });
        setJoyidSignature(bytes.hexify(packedSignature));
      },
    );
  }, []);

  const finishSign = useCallback(() => {
    setJoyidSignature(undefined);
  }, []);

  return {
    name: 'JoyID',
    ...useLockInfo(lock),
    signature: joyidSignature,
    sign,
    finishSign,
    connect: connectToJoyid,
    disconnect: disconnectFromJoyid,
  };
}
