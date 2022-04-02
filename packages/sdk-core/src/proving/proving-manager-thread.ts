// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

import type { JsProofInput, Leaves, Proof } from '@nepoche/wasm-utils';

import { ProofI } from '@nepoche/sdk-core/proving/proving-manager.js';

import { Note } from '../note.js';

export type ProvingManagerSetupInput = {
  note: string;
  relayer: string;
  recipient: string;
  leaves: Leaves;
  leafIndex: number;
  fee: number;
  refund: number;
  provingKey: Uint8Array;
  roots?: Leaves;
  refreshCommitment?: string;
};

type PMEvents = {
  proof: ProvingManagerSetupInput;
  destroy: undefined;
};

export class ProvingManagerWrapper {
  constructor (private ctx: 'worker' | 'direct-call' = 'worker') {
    // if the Manager is running in side worker it registers an event listener
    if (ctx === 'worker') {
      self.addEventListener('message', async (event) => {
        const message = event.data as Partial<PMEvents>;
        const key = Object.keys(message)[0] as keyof PMEvents;

        switch (key) {
          case 'proof':
            {
              const input = message.proof!;
              const proof = await this.proof(input);

              (self as unknown as Worker).postMessage({
                data: proof,
                name: key
              });
            }

            break;
          case 'destroy':
            (self as unknown as Worker).terminate();
            break;
        }
      });
    }
  }

  private get wasmBlob () {
    return this.ctx === 'worker' ? import('@nepoche/wasm-utils/wasm-utils.js') : import('@nepoche/wasm-utils/njs/wasm-utils-njs.js');
  }

  private get proofBuilder () {
    return this.wasmBlob.then((wasm) => {
      return wasm.ProofInputBuilder;
    });
  }

  private async generateProof (proofInput: JsProofInput): Promise<Proof> {
    const wasm = await this.wasmBlob;

    return wasm.generate_proof_js(proofInput);
  }

  async proof (pmSetupInput: ProvingManagerSetupInput): Promise<ProofI> {
    const Manager = await this.proofBuilder;
    const pm = new Manager();
    const { note } = await Note.deserialize(pmSetupInput.note);

    // TODO: handle the prefix and validation
    pm.setLeaves(pmSetupInput.leaves);
    pm.setRelayer(pmSetupInput.relayer);
    pm.setRecipient(pmSetupInput.recipient);
    pm.setLeafIndex(String(pmSetupInput.leafIndex));
    pm.setRefund(String(pmSetupInput.refund));
    pm.setFee(String(pmSetupInput.fee));
    pm.setPk(u8aToHex(pmSetupInput.provingKey).replace('0x', ''));
    pm.setNote(note);

    if (pmSetupInput.roots) {
      pm.setRoots(pmSetupInput.roots);
    }

    if (pmSetupInput.refreshCommitment) {
      pm.setRefreshCommitment(pmSetupInput.refreshCommitment);
    }

    const proofInput = pm.build_js();
    const proof = await this.generateProof(proofInput);

    return {
      nullifierHash: proof.nullifierHash,
      proof: proof.proof,
      root: proof.root,
      roots: proof.roots
    };
  }
}

/* Copied code from @polkadot.js to avoid calling polkadot dependencies in
   a web worker context. Issue: https://github.com/polkadot-js/common/issues/1435
*/

const U8_TO_HEX = new Array<any>(256);
const U16_TO_HEX = new Array<any>(256 * 256);
const HEX_TO_U8 = {};
const HEX_TO_U16 = {};

for (let n = 0; n < 256; n++) {
  const hex = n.toString(16).padStart(2, '0');

  U8_TO_HEX[n] = hex;
  // @ts-ignore
  HEX_TO_U8[hex] = n;
}

for (let i = 0; i < 256; i++) {
  for (let j = 0; j < 256; j++) {
    const hex = U8_TO_HEX[i] + U8_TO_HEX[j];
    const n = i << 8 | j;

    U16_TO_HEX[n] = hex;
    // @ts-ignore
    HEX_TO_U16[hex] = n;
  }
}

// @ts-ignore
function hex (value) {
  const mod = value.length % 2;
  const length = value.length - mod;
  const dv = new DataView(value.buffer, value.byteOffset);
  let result = '';

  for (let i = 0; i < length; i += 2) {
    result += U16_TO_HEX[dv.getUint16(i)];
  }

  if (mod) {
    result += U8_TO_HEX[dv.getUint8(length)];
  }

  return result;
}

// @ts-ignore
export function u8aToHex (value, bitLength = -1, isPrefixed = true) {
  const length = Math.ceil(bitLength / 8);

  return `${isPrefixed ? '0x' : ''}${!value || !value.length ? '' : length > 0 && value.length > length ? `${hex(value.subarray(0, length / 2))}…${hex(value.subarray(value.length - length / 2))}` : hex(value)}`;
}
