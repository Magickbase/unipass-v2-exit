import { ArrowUpDownIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Button,
  ChakraProvider,
  Container,
  IconButton,
  Spinner,
  Stack,
} from '@chakra-ui/react';
import { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { TransferAssetList } from './TransferAssetList.tsx';
import { useAssetList } from './useAssetList.ts';
import { useReceiver, useSender, useSwitchConnector } from './useConnector.ts';

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
  const sender = useSender();
  const receiver = useReceiver();
  const assetList = useAssetList();
  const switchConnector = useSwitchConnector();

  const assetListElement = useMemo(() => {
    if (!sender.address || !receiver.address) {
      return 'Please connect to the wallet first.';
    }

    if (assetList.isLoading) {
      return <Spinner />;
    }

    return <TransferAssetList />;
  }, [assetList.data, sender.address, receiver.address]);

  const unipassConnect = useMemo(() => {
    if (sender.address) {
      return (
        <>
          {sender.address}{' '}
          <Button size="xs" onClick={sender.disconnect}>
            Disconnect
          </Button>
        </>
      );
    }

    return <Button onClick={sender.connect}>Connect</Button>;
  }, [sender]);

  const joyidConnect = useMemo(() => {
    if (receiver.address) {
      return (
        <>
          {receiver.address}{' '}
          <Button size="xs" onClick={receiver.disconnect}>
            Disconnect
          </Button>
        </>
      );
    }
    return <Button onClick={receiver.connect}>Connect</Button>;
  }, [receiver]);

  return (
    <Container>
      <Stack>
        <Box>
          <Badge>From ({sender.name})</Badge>
          {unipassConnect}
        </Box>
        <Box>
          <IconButton
            aria-label="swap"
            icon={<ArrowUpDownIcon />}
            rounded="full"
            onClick={switchConnector}
          />
        </Box>
        <Box>
          <Badge>To ({receiver.name})</Badge> {joyidConnect}
        </Box>
      </Stack>

      <Box mt={8}>{assetListElement}</Box>
    </Container>
  );
};
