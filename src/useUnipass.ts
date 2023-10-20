import { utils } from '@ckb-lumos/base';
import { bytes, BytesLike } from '@ckb-lumos/codec';
import { atom, useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useCallback, useEffect, useMemo } from 'react';

import { Connector } from './types.ts';
import { useLockInfo } from './useLockInfo.ts';
import { useProvider } from './useProvider.ts';

export function useUnipass(): Connector {
  const { connect, unipassConnectString, disconnect } = useConnect();
  const provider = useProvider();

  const lumosConfig = provider.lumosConfig;

  const lock = useMemo(() => {
    if (!unipassConnectString) return undefined;

    const UNIPASS = lumosConfig.SCRIPTS.UNIPASS;
    return {
      codeHash: UNIPASS.CODE_HASH,
      hashType: UNIPASS.HASH_TYPE,
      args: pubKeyToLockArgs(unipassConnectString),
    };
  }, [lumosConfig.SCRIPTS.UNIPASS, unipassConnectString]);

  return {
    name: 'UniPass',
    connect,
    disconnect,
    ...useLockInfo(lock),
    ...useSign(),
  };
}

// the atom for the original from connector content
const unipassConnectStringAtom = atomWithStorage('unipassConnectString', '');

function useConnect() {
  const [unipassConnectString, setUnipassConnectString] = useAtom(
    unipassConnectStringAtom,
  );
  const { unipassV2Host } = useProvider();

  // detect the login data from the url, and set the connectString if it is valid
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search.slice(1));
    const json = searchParams.get('unipass_ret');

    if (!json) return;

    const login = getRetFromSearchParams(isUnipassLoginData, true);
    if (!login?.pubkey) return;

    setUnipassConnectString(login.pubkey);
  }, [setUnipassConnectString]);

  const connect = useCallback(() => {
    const loginUrl = generateUnipassNewUrl(unipassV2Host, 'login', {
      success_url: window.location.href,
    });
    return redirect(loginUrl);
  }, [unipassV2Host]);

  const disconnect = useCallback(() => {
    setUnipassConnectString('');
  }, [setUnipassConnectString]);

  return {
    unipassConnectString,
    disconnect,
    connect,
  };
}

const signatureAtom = atom('');

function useSign() {
  const { unipassV2Host } = useProvider();
  const { unipassConnectString } = useConnect();
  const [signature, setSignature] = useAtom(signatureAtom);

  useEffect(() => {
    const ret = getRetFromSearchParams(isUnipassSigData, true);

    if (!ret?.sig) {
      return;
    }
    setSignature(bytes.hexify(bytes.concat('0x01', ret.sig)));
  }, [setSignature]);

  const sign = useCallback(
    (message: BytesLike) => {
      const signUrl = generateUnipassNewUrl(unipassV2Host, 'sign', {
        success_url: window.location.href,
        pubkey: unipassConnectString,
        message: bytes.hexify(message),
      });

      return redirect(signUrl);
    },
    [unipassConnectString, unipassV2Host],
  );

  const finishSign = useCallback(() => {
    setSignature('');
  }, [setSignature]);

  return {
    sign,
    finishSign,
    signature,
  };
}

interface UnipassRet<Data> {
  code: number;
  data: Data;
  info: string;
}

interface UnipassLoginData {
  email: string;
  pubkey: string;
  recovery: boolean;
}

function isUnipassLoginData(x: unknown): x is UnipassLoginData {
  if (typeof x !== 'object' || x === null) return false;
  return 'email' in x && 'pubkey' in x;
}

interface UnipassSigData {
  sig: string;
  pubkey: string;
}

function isUnipassSigData(x: unknown): x is UnipassSigData {
  if (typeof x !== 'object' || x === null) return false;
  return 'sig' in x && 'pubkey' in x;
}

export function getRetFromSearchParams<T>(
  onCheck: (obj: unknown) => obj is T,
  replace = false,
): T | undefined {
  const searchParams = new URLSearchParams(location.search.slice(1));
  const json = searchParams.get('unipass_ret');

  if (!json) return undefined;

  const res = JSON.parse(json) as UnipassRet<T>;

  if (res.code !== 200) {
    throw new Error(res.info || 'Unknown error when connecting to UniPass');
  }

  if (!onCheck(res.data)) {
    return undefined;
  }

  searchParams.delete('unipass_ret');

  const { pathname, host, protocol } = window.location;

  const qs = searchParams.toString();
  const newUrl = `${protocol}//${host}${pathname}${qs ? `?${qs}` : ''}`;

  if (replace) window.history.replaceState({ path: newUrl }, '', newUrl);
  return res.data;
}

function generateUnipassNewUrl(
  host: string,
  action: string,
  params: Record<string, string>,
) {
  const urlObj = new URL(`${host}/${action.toLowerCase()}`);
  Object.entries(params).forEach(([key, val]) =>
    urlObj.searchParams.set(key, val),
  );
  return urlObj.href;
}

async function redirect(href: string): Promise<never> {
  window.location.href = href;
  // wait 60s to avoid error before redirect
  return new Promise((resolve) => setTimeout(resolve, 60 * 1000));
}

function pubKeyToLockArgs(pubKey: string): string {
  if (!pubKey.startsWith('0x')) pubKey = '0x' + pubKey;
  return utils.ckbHash(pubKey).slice(0, 42);
}
