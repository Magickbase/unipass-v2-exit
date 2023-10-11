import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec';
import { CellDep, helpers } from '@ckb-lumos/lumos';

export function addCellDep(
  txSkeleton: helpers.TransactionSkeletonType,
  newCellDep: CellDep,
) {
  const isExist = txSkeleton
    .get('cellDeps')
    .some((cellDep) =>
      bytes.equal(
        blockchain.CellDep.pack(cellDep),
        blockchain.CellDep.pack(newCellDep),
      ),
    );

  if (!isExist) {
    txSkeleton = txSkeleton.update('cellDeps', (cellDeps) => {
      return cellDeps.push({
        outPoint: newCellDep.outPoint,
        depType: newCellDep.depType,
      });
    });
  }

  return txSkeleton;
}
