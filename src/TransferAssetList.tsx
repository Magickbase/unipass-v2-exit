import {
  Box,
  Button,
  Divider,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Stack,
  useDisclosure,
} from '@chakra-ui/react';
import { bytes } from '@ckb-lumos/codec';
import { Uint128LE } from '@ckb-lumos/codec/lib/number';
import { BI, Cell } from '@ckb-lumos/lumos';
import { useEffect, useMemo } from 'react';

import { useAssetList } from './useAssetList.ts';
import { useProvider } from './useProvider.ts';
import { useTransfer } from './useTransfer.ts';

export const TransferAssetList = () => {
  const { data: cells } = useAssetList();
  const { mutate, isLoading, data, isSuccess, error } = useTransfer();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (!data || !isSuccess) return;
    onOpen();
  }, [data, isSuccess, onOpen]);

  if (!cells) return null;
  if (!cells.length) return 'No transferable assets found';

  return (
    <Stack>
      {cells.map((cell) => (
        <Box
          key={String(cell.outPoint?.txHash) + String(cell.outPoint?.index)}
          w="full"
        >
          <CellInfo cell={cell} />
          <Divider />
        </Box>
      ))}

      <Box py={4}>
        <Button
          colorScheme="green"
          isLoading={isLoading}
          size="sm"
          w="full"
          onClick={() => mutate()}
        >
          Transfer
        </Button>
        {error ? <Box color="red">{String(error)}</Box> : null}
        {data ? <Box color="green">{data}</Box> : null}
      </Box>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Transaction sent</ModalHeader>
          <ModalCloseButton />
          <ModalBody>{data}</ModalBody>

          <ModalFooter>
            <Button colorScheme="green" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Stack>
  );
};

const CellInfo = ({ cell }: { cell: Cell }) => {
  const output = cell.cellOutput;

  const { lumosConfig } = useProvider();

  const asset = useMemo(() => {
    const typeScript = output.type;
    if (!typeScript) return 'Capacity';

    if (bytes.equal(typeScript.codeHash, lumosConfig.SCRIPTS.SUDT.CODE_HASH)) {
      const amount = Uint128LE.unpack(cell.data).toString();

      // TODO mapping sudt to token name
      return amount + ' SUDT';
    }

    return 'Unknown Asset';
  }, [cell.data, lumosConfig.SCRIPTS.SUDT.CODE_HASH, output.type]);

  return (
    <Flex py={2}>
      <Box>{asset}</Box>
      <Spacer />
      <Box>
        {BI.from(output.capacity)
          .div(10 ** 8)
          .toString()}
        &nbsp;CKB
      </Box>
    </Flex>
  );
};
