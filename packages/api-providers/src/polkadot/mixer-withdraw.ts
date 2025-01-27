// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { OptionalActiveRelayer, OptionalRelayer, RelayedWithdrawResult, WebbRelayer, WithdrawState } from '@nepoche/api-providers/index.js';
import { fetchSubstrateTornadoProvingKey } from '@nepoche/api-providers/ipfs/substrate/tornado.js';
import { LoggerService } from '@nepoche/app-util/index.js';
import { Note, ProvingManager } from '@nepoche/sdk-core/index.js';
import { ProvingManagerSetupInput } from '@nepoche/sdk-core/proving/proving-manager-thread.js';

import { decodeAddress } from '@polkadot/keyring';
import { hexToU8a, u8aToHex } from '@polkadot/util';

import { MixerWithdraw } from '../abstracts/index.js';
import { InternalChainId } from '../chains/index.js';
import { WebbError, WebbErrorCodes } from '../webb-error/index.js';
import { PolkadotMixerDeposit } from './index.js';
import { WebbPolkadot } from './webb-provider.js';

const logger = LoggerService.get('PolkadotMixerWithdraw');

const transactionString = (hexString: string) => {
  return `${hexString.slice(0, 6)}...${hexString.slice(hexString.length - 4, hexString.length)}`;
};

type WithdrawProof = {
  id: string;
  proofBytes: string;
  root: string;
  nullifierHash: string;
  recipient: string;
  relayer: string;
  fee: number;
  refund: number;
};

export class PolkadotMixerWithdraw extends MixerWithdraw<WebbPolkadot> {
  readonly loading = false;
  readonly initialised = true;

  cancelWithdraw (): Promise<void> {
    return Promise.resolve(undefined);
  }

  get relayers () {
    return Promise.resolve(
      this.inner.relayingManager.getRelayer({
        baseOn: 'substrate'
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getRelayersByNote (evmNote: Note) {
    return Promise.resolve(
      this.inner.relayingManager.getRelayer({
        baseOn: 'substrate'
      })
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getRelayersByChainAndAddress (_chainId: InternalChainId, _address: string) {
    // TODO: ! why don't we use ChainId and address?
    return this.inner.relayingManager.getRelayer({});
  }

  async mapRelayerIntoActive (relayer: OptionalRelayer): Promise<OptionalActiveRelayer> {
    if (!relayer) {
      return null;
    }

    return WebbRelayer.intoActiveWebRelayer(
      relayer,
      {
        basedOn: 'substrate',
        chain: InternalChainId.WebbDevelopment
      },
      async () => {
        return {
          totalFees: '0',
          withdrawFeePercentage: 0
        };
      }
    );
  }

  async fetchTreeLeaves (treeId: string | number): Promise<Uint8Array[]> {
    let done = false;
    let from = 0;
    let to = 511;
    const leaves: Uint8Array[] = [];

    while (done === false) {
      const treeLeaves: any[] = await (this.inner.api.rpc as any).mt.getLeaves(treeId, from, to);

      if (treeLeaves.length === 0) {
        done = true;
        break;
      }

      leaves.push(...treeLeaves.map((i) => i.toU8a()));
      from = to;
      to = to + 511;
    }

    return leaves;
  }

  async submitViaRelayer () {
    return null;
  }

  async withdraw (note: string, recipient: string): Promise<string> {
    try {
      // Get the sender account
      const account = await this.inner.accounts.activeOrDefault;

      if (!account) {
        throw WebbError.from(WebbErrorCodes.NoAccountAvailable);
      }

      this.emit('stateChange', WithdrawState.GeneratingZk);

      // parse the note
      const noteParsed = await Note.deserialize(note);
      const depositAmount = noteParsed.note.amount;
      const amount = depositAmount;
      const sizes = await PolkadotMixerDeposit.getSizes(this.inner);
      const treeId = sizes.find((s) => s.amount === Number(amount))?.treeId!;

      logger.trace('Tree Id ', treeId);
      const leaves = await this.fetchTreeLeaves(treeId);
      const leaf = u8aToHex(noteParsed.getLeaf());
      const leafIndex = leaves.findIndex((l) => u8aToHex(l) === leaf);

      logger.trace(`leaf ${leaf} has index `, leafIndex);
      logger.trace(leaves.map((i) => u8aToHex(i)));
      const activeRelayer = this.activeRelayer[0];
      const worker = this.inner.wasmFactory('wasm-utils');
      const pm = new ProvingManager(worker);

      const recipientAccountHex = u8aToHex(decodeAddress(recipient));
      // ss58 format
      const relayerAccountId = activeRelayer ? activeRelayer.beneficiary! : recipient;
      const relayerAccountHex = u8aToHex(decodeAddress(relayerAccountId));
      // fetching the proving key
      const provingKey = await fetchSubstrateTornadoProvingKey();
      const isValidRelayer = Boolean(activeRelayer && activeRelayer.beneficiary);
      const proofInput: ProvingManagerSetupInput = {
        fee: 0,
        leafIndex,
        leaves,
        note,
        provingKey,
        recipient: recipientAccountHex.replace('0x', ''),
        refund: 0,
        relayer: relayerAccountHex.replace('0x', '')
      };

      if (isValidRelayer) {
        this.inner.notificationHandler({
          description: `Withdraw through ${activeRelayer!.endpoint} in progress`,
          key: 'mixer-withdraw-sub',
          level: 'loading',
          message: 'mixerBn254:withdraw',
          name: 'Transaction'
        });
      }

      const zkProofMetadata = await pm.prove(proofInput);

      const withdrawProof: WithdrawProof = {
        fee: 0,
        id: String(treeId),
        nullifierHash: `0x${zkProofMetadata.nullifierHash}`,
        proofBytes: `0x${zkProofMetadata.proof}` as any,
        recipient: recipient,
        refund: 0,
        relayer: relayerAccountId,
        root: `0x${zkProofMetadata.root}`
      };

      // withdraw throw relayer
      if (isValidRelayer) {
        logger.info('withdrawing through relayer', activeRelayer);
        this.emit('stateChange', WithdrawState.SendingTransaction);
        const relayerMixerTx = await activeRelayer!.initWithdraw('mixerRelayTx');
        const relayerWithdrawPayload = relayerMixerTx.generateWithdrawRequest(
          {
            baseOn: 'substrate',
            contractAddress: '',
            endpoint: '',
            // TODO change this from the config
            name: 'localnode'
          },
          Array.from(hexToU8a(withdrawProof.proofBytes)),
          {
            chain: 'localnode',
            fee: withdrawProof.fee,
            id: Number(treeId),
            nullifierHash: Array.from(hexToU8a(withdrawProof.nullifierHash)),
            recipient: withdrawProof.recipient,
            refund: withdrawProof.refund,
            relayer: withdrawProof.relayer,
            root: Array.from(hexToU8a(withdrawProof.root))
          }
        );

        relayerMixerTx.watcher.subscribe(([results, message]) => {
          switch (results) {
            case RelayedWithdrawResult.PreFlight:
              this.emit('stateChange', WithdrawState.SendingTransaction);
              break;
            case RelayedWithdrawResult.OnFlight:
              break;
            case RelayedWithdrawResult.Continue:
              break;
            case RelayedWithdrawResult.CleanExit:
              this.emit('stateChange', WithdrawState.Done);
              this.emit('stateChange', WithdrawState.Ideal);

              this.inner.notificationHandler({
                description: `TX hash: ${transactionString(message || '')}`,
                key: 'mixer-withdraw-sub',
                level: 'success',
                message: 'mixerBn254:withdraw',
                name: 'Transaction'
              });

              break;
            case RelayedWithdrawResult.Errored:
              this.emit('stateChange', WithdrawState.Failed);
              this.emit('stateChange', WithdrawState.Ideal);

              this.inner.notificationHandler({
                description: message || 'Withdraw failed',
                key: 'mixer-withdraw-sub',
                level: 'success',
                message: 'mixerBn254:withdraw',
                name: 'Transaction'
              });
              break;
          }
        });

        this.inner.notificationHandler({
          description: 'Sending TX to relayer',
          key: 'mixer-withdraw-sub',
          level: 'loading',
          message: 'mixerBn254:withdraw',

          name: 'Transaction'
        });

        relayerMixerTx.send(relayerWithdrawPayload);
        const results = await relayerMixerTx.await();

        if (results) {
          const [, message] = results;

          return message ?? '';
        }

        return '';
      }

      logger.trace('submitting the transaction of withdraw with params', withdrawProof);
      this.emit('stateChange', WithdrawState.SendingTransaction);

      const tx = this.inner.txBuilder.build(
        {
          method: 'withdraw',
          section: 'mixerBn254'
        },
        [
          withdrawProof.id,
          withdrawProof.proofBytes,
          withdrawProof.root,
          withdrawProof.nullifierHash,
          withdrawProof.recipient,
          withdrawProof.relayer,
          withdrawProof.fee,
          withdrawProof.refund
        ]
      );
      const hash = await tx.call(account.address);

      this.emit('stateChange', WithdrawState.Done);

      return hash || '';
    } catch (e) {
      this.emit('error', 'Failed to generate zero knowledge proof');
      this.emit('stateChange', WithdrawState.Failed);
      throw e;
    }
  }
}
