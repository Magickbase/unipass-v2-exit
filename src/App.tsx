import { ArrowDownIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Button,
  Center,
  ChakraProvider,
  Container,
  Spinner,
  Stack,
} from '@chakra-ui/react';
import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { TransferAssetList } from './TransferAssetList.tsx';
import { useAssetList } from './useAssetList.ts';
import { useJoyid } from './useJoyid';
import { useUnipass } from './useUnipass.ts';
// import { useUnipass } from './useUnipass';

export default function App() {
  const client = new QueryClient();

  return (
    <ChakraProvider>
      <QueryClientProvider client={client}>
        <Main />
      </QueryClientProvider>
    </ChakraProvider>
  );
}

const Main = () => {
  const unipass = useUnipass();
  const joyid = useJoyid();
  const assetList = useAssetList();

  const assetListElement = useMemo(() => {
    if (!unipass.address || !joyid.address) {
      return 'Please connect to the wallet first.';
    }

    if (assetList.isLoading) {
      return <Spinner />;
    }

    return <TransferAssetList />;
  }, [assetList.data, unipass.address, joyid.address]);

  const unipassConnect = useMemo(() => {
    if (unipass.address) {
      return (
        <>
          {unipass.address}{' '}
          <Button size="xs" onClick={unipass.disconnect}>
            Disconnect
          </Button>
        </>
      );
    }

    return <Button onClick={unipass.connect}>Connect</Button>;
  }, [unipass]);

  const joyidConnect = useMemo(() => {
    if (joyid.address) {
      return (
        <>
          {joyid.address}{' '}
          <Button size="xs" onClick={joyid.disconnect}>
            Disconnect
          </Button>
        </>
      );
    }
    return <Button onClick={joyid.connect}>Connect</Button>;
  }, [joyid]);

  return (
    <Container>
      <Stack>
        <Box>
          <Badge>From (UniPassV2)</Badge>
          {unipassConnect}
        </Box>
        <Box>
          <ArrowDownIcon />
        </Box>
        <Box>
          <Badge>To (JoyID)</Badge> {joyidConnect}
        </Box>
      </Stack>

      <Center mt={8}>{assetListElement}</Center>
    </Container>
  );
};
