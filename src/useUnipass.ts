import { BytesLike } from '@ckb-lumos/codec';
import { useCallback, useEffect, useState } from 'react';

export function _useUnipass() {
  const [address, setAddress] = useState<null | string>(null);
  const [signature, setSignature] = useState<null | string>(null);

  useEffect(() => {
    // TODO read signature from the URL and set it with setSignature,
    //  and then clear the signature from the URL
  }, []);

  const signMessage = useCallback((message: BytesLike) => {
    console.log(message);
  }, []);
  const connectToUnipass = useCallback(() => {}, []);
  const disconnectFromUnipass = useCallback(() => {
    setAddress(null);
    setSignature(null);
  }, []);

  return {
    address,
    signature,
    sign: signMessage,
    connect: connectToUnipass,
    disconnect: disconnectFromUnipass,
  };
}

// TODO unmock this after implementing the real useUnipass
export { useSecp256k1 as useUnipass } from './useSecp256k1.ts';
