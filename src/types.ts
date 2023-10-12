import { BytesLike } from '@ckb-lumos/codec';
import { Script } from '@ckb-lumos/lumos';

export interface Connector {
  // name of the connector
  readonly name: string;
  readonly address: string | undefined;
  readonly lock: Script | undefined;
  readonly signature: string | undefined;

  connect(): void;
  disconnect(): void;
  sign(message: BytesLike): void;
  finishSign(): void;
}
