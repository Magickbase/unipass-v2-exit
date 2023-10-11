import { bytes } from '@ckb-lumos/codec';
import { connect } from '@joyid/evm';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useCallback, useMemo } from 'react';

import { useLockInfo } from './useLockInfo.ts';
import { useProvider } from './useProvider.ts';

// the atom for the original to connector content
export const joyidConnectStringAtom = atomWithStorage('joyidConnectString', '');

/**
 * Connect to JoyID and return an Omnilock address
 */
export function useJoyid() {
  const [joyidConnectString, setJoyidConnectString] = useAtom(
    joyidConnectStringAtom,
  );
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

  return {
    ...useLockInfo(lock),
    connect: connectToJoyid,
    disconnect: disconnectFromJoyid,
  };
}
