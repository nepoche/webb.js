// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

import { ProvingManagerSetupInput, ProvingManagerWrapper } from '@nepoche/sdk-core/proving/proving-manager-thread.js';
import { Proof } from '@nepoche/wasm-utils';

export type ProofI = Omit<Proof, 'free'>;

export class ProvingManager {
  constructor (
    private readonly worker: Worker | null | undefined // Optional WebWorker
  ) {}

  /**
   * @param {ProvingManagerSetupInput} input
   * @returns {ProofI}
   * @description Checks the current {ProvingManager} status wither it is proving with a Worker(browser) or directly(Nodejs),
   * accordingly it will run to write private function
   * {ProvingManager.proveWithWorker} for browser,And {ProvingManager.proveWithoutWorker} for Nodejs
   * */
  public prove (input: ProvingManagerSetupInput) {
    const worker = this.worker;

    if (worker) {
      return ProvingManager.proveWithWorker(input, worker);
    }

    return ProvingManager.proveWithoutWorker(input);
  }

  private static proveWithoutWorker (input: ProvingManagerSetupInput) {
    // If the worker CTX is direct-call
    const pm = new ProvingManagerWrapper('direct-call');

    return pm.proof(input);
  }

  private static proveWithWorker (input: ProvingManagerSetupInput, worker: Worker): Promise<ProofI> {
    return new Promise<ProofI>((resolve, reject) => {
      try {
        worker.addEventListener('message', (e) => {
          const payload = e.data.data as ProofI;

          resolve(payload);
        });
        worker.postMessage({
          proof: input
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}
