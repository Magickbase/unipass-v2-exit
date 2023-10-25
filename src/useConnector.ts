import { atom, useAtom } from 'jotai';

import { Connector } from './types.ts';
import { useJoyid } from './useJoyid.ts';
import { useUnipass } from './useUnipass.ts';

const switchedAtom = atom(false);

export function useSender(): Connector {
  const unipass = useUnipass();
  const joyid = useJoyid();
  const [switched] = useAtom(switchedAtom);

  return switched ? joyid : unipass;
}

export function useReceiver(): Connector {
  const unipass = useUnipass();
  const joyid = useJoyid();
  const [connector] = useAtom(switchedAtom);

  return connector ? unipass : joyid;
}

export function useSwitchConnector() {
  const [switched, setSwitched] = useAtom(switchedAtom);

  return () => setSwitched(!switched);
}
