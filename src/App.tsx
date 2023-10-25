import { ArrowUpDownIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  ChakraProvider,
  Container,
  Flex,
  Heading,
  IconButton,
  Spinner,
} from '@chakra-ui/react';
import { useMemo } from 'react';
import MiddleEllipsis from 'react-middle-ellipsis';
import { QueryClient, QueryClientProvider } from 'react-query';

import { TransferAssetList } from './TransferAssetList.tsx';
import { Connector } from './types.ts';
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
  }, [sender.address, receiver.address, assetList.isLoading]);

  return (
    <Container pt={4}>
      <Card variant="filled">
        <CardHeader>
          <Heading size="md">UniPass V2 Exit</Heading>
        </CardHeader>

        <CardBody alignContent="center">
          <Box>
            <Badge my={1}>From</Badge>

            <ConnectButton connector={sender} />
          </Box>
          <Box textAlign="center">
            <IconButton
              aria-label="swap"
              colorScheme="green"
              icon={<ArrowUpDownIcon />}
              rounded="full"
              variant="ghost"
              onClick={switchConnector}
            />
          </Box>
          <Box>
            <Badge my={1}>To</Badge>
            <ConnectButton connector={receiver} />
          </Box>
        </CardBody>
      </Card>

      <Box mt={8}>{assetListElement}</Box>
    </Container>
  );
};

function ConnectButton({ connector }: { connector: Connector }) {
  if (!connector.address) {
    return (
      <Button colorScheme="green" w="full" onClick={connector.connect}>
        Connect to {connector.name}
      </Button>
    );
  }

  return (
    <Box title={connector.address} w="full" whiteSpace="nowrap">
      <Flex alignItems="center" gap={1}>
        <Box flex={1} w="full">
          <MiddleEllipsis>
            <span>{connector.address}</span>
          </MiddleEllipsis>
        </Box>

        <Box>
          <Button
            aria-label="disconnect"
            colorScheme="gray"
            size="sm"
            variant="ghost"
            onClick={connector.disconnect}
          >
            <DeleteIcon />
          </Button>
        </Box>
      </Flex>
    </Box>
  );
}
