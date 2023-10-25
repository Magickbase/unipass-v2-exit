/// <reference types="vite/client" />

declare module 'react-middle-ellipsis' {
  import { FC } from 'react';

  interface Props {
    width?: string | number;
  }

  export default FC<Props>;
}
