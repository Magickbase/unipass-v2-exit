import { atom, useAtom } from 'jotai';

import { Connector } from './types.ts';
import { useJoyid } from './useJoyid.ts';
import { useUnipass } from './useUnipass.ts';

const connectorAtom = atom(true);

export function useSender(): Connector {
  const unipass = useUnipass();
  const joyid = useJoyid();
  const [connector] = useAtom(connectorAtom);

  return connector ? unipass : joyid;
}

export function useReceiver(): Connector {
  const unipass = useUnipass();
  const joyid = useJoyid();
  const [connector] = useAtom(connectorAtom);

  return connector ? joyid : unipass;
}

export function useSwitchConnector() {
  const [connector, setConnector] = useAtom(connectorAtom);

  return () => setConnector(!connector);
}
