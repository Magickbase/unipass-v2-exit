import { blockchain, Cell, utils, values, WitnessArgs } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec';
import { LockScriptInfo } from '@ckb-lumos/common-scripts';
import { hashWitness } from '@ckb-lumos/common-scripts/lib/helper';
import { config, helpers } from '@ckb-lumos/lumos';

import { UNIPASS_CELL_DEPS, UNIPASS_CODE_HASH } from '../env.ts';
import { addCellDep, asserts } from '../helper.ts';

export const unipassLockScriptInfo: LockScriptInfo = {
  codeHash: UNIPASS_CODE_HASH,
  hashType: 'type',
  lockScriptInfo: {
    CellCollector: null as never,
    async setupInputCell(txSkeleton, inputCell, _, options = {}) {
      const scopedConfig = options?.config || config.getConfig();

      const UNIPASS = scopedConfig.SCRIPTS.UNIPASS;
      asserts(UNIPASS != null);

      const fromScript = inputCell.cellOutput.lock;
      asserts(
        bytes.equal(fromScript.codeHash, UNIPASS.CODE_HASH),
        `The input script is not Unipass script`,
      );
      // add inputCell to txSkeleton
      txSkeleton = txSkeleton.update('inputs', (inputs) =>
        inputs.push(inputCell),
      );

      const output: Cell = {
        cellOutput: {
          capacity: inputCell.cellOutput.capacity,
          lock: inputCell.cellOutput.lock,
          type: inputCell.cellOutput.type,
        },
        data: inputCell.data,
      };

      txSkeleton = txSkeleton.update('outputs', (outputs) => {
        return outputs.push(output);
      });

      const since = options.since;
      if (since) {
        txSkeleton = txSkeleton.update('inputSinces', (inputSinces) => {
          return inputSinces.set(txSkeleton.get('inputs').size - 1, since);
        });
      }

      txSkeleton = txSkeleton.update('witnesses', (witnesses) => {
        return witnesses.push('0x');
      });

      const template = scopedConfig.SCRIPTS.UNIPASS;
      if (!template) {
        throw new Error(`UNIPASS script not defined in config!`);
      }

      // add cell dep
      UNIPASS_CELL_DEPS.forEach(
        (cellDep) => (txSkeleton = addCellDep(txSkeleton, cellDep)),
      );

      // add witness
      /*
       * Modify the skeleton, so the first witness of the fromAddress script group
       * has a WitnessArgs construct with 85-byte zero filled values. While this
       * is not required, it helps in transaction fee estimation.
       */
      const firstIndex = txSkeleton
        .get('inputs')
        .findIndex((input) =>
          bytes.equal(
            blockchain.Script.pack(input.cellOutput.lock),
            blockchain.Script.pack(fromScript),
          ),
        );
      if (firstIndex !== -1) {
        while (firstIndex >= txSkeleton.get('witnesses').size) {
          txSkeleton = txSkeleton.update('witnesses', (witnesses) =>
            witnesses.push('0x'),
          );
        }
        let witness: string = txSkeleton.get('witnesses').get(firstIndex)!;
        const newWitnessArgs: WitnessArgs = {
          lock: '0x' + '0'.repeat(2082),
        };
        witness = bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs));
        txSkeleton = txSkeleton.update('witnesses', (witnesses) =>
          witnesses.set(firstIndex, witness),
        );
      }

      return txSkeleton;
    },
    prepareSigningEntries(txSkeleton, options) {
      const scopedScript = options.config || config.getConfig();

      const template = scopedScript.SCRIPTS.UNIPASS;
      if (!template) {
        throw new Error(`Provided config does not have UNIPASS script setup!`);
      }
      let processedArgs = new Set<string>();
      const tx = helpers.createTransactionFromSkeleton(txSkeleton);
      const txHash = utils.ckbHash(blockchain.RawTransaction.pack(tx));
      const inputs = txSkeleton.get('inputs');
      const witnesses = txSkeleton.get('witnesses');
      let signingEntries = txSkeleton.get('signingEntries');
      for (let i = 0; i < inputs.size; i++) {
        const input = inputs.get(i)!;
        if (
          template.CODE_HASH === input.cellOutput.lock.codeHash &&
          template.HASH_TYPE === input.cellOutput.lock.hashType &&
          !processedArgs.has(input.cellOutput.lock.args)
        ) {
          processedArgs = processedArgs.add(input.cellOutput.lock.args);
          const lockValue = new values.ScriptValue(input.cellOutput.lock, {
            validate: false,
          });
          const hasher = new utils.CKBHasher();
          hasher.update(txHash);
          if (i >= witnesses.size) {
            throw new Error(
              `The first witness in the script group starting at input index ${i} does not exist, maybe some other part has invalidly tampered the transaction?`,
            );
          }
          hashWitness(hasher, witnesses.get(i)!);
          for (let j = i + 1; j < inputs.size && j < witnesses.size; j++) {
            const otherInput = inputs.get(j)!;
            if (
              lockValue.equals(
                new values.ScriptValue(otherInput.cellOutput.lock, {
                  validate: false,
                }),
              )
            ) {
              hashWitness(hasher, witnesses.get(j)!);
            }
          }
          for (let j = inputs.size; j < witnesses.size; j++) {
            hashWitness(hasher, witnesses.get(j)!);
          }
          const signingEntry = {
            type: 'witness_args_lock',
            index: i,
            message: hasher.digestHex(),
          };
          signingEntries = signingEntries.push(signingEntry);
        }
      }
      txSkeleton = txSkeleton.set('signingEntries', signingEntries);
      return txSkeleton;
    },
  },
};
