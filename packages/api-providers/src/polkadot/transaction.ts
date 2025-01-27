// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/ban-ts-comment */

import { NotificationHandler } from '@nepoche/api-providers/index.js';
import { EventBus, LoggerService } from '@nepoche/app-util/index.js';
import lodash from 'lodash';

import { ApiPromise, SubmittableResult } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/submittable/types';
import { IKeyringPair } from '@polkadot/types/types';

import { ReactElement } from '../types/abstracts.js';

const { uniqueId } = lodash;

type AddressOrPair = string | IKeyringPair;

export type QueueTxStatus =
  | 'future'
  | 'ready'
  | 'finalized'
  | 'finalitytimeout'
  | 'usurped'
  | 'dropped'
  | 'inblock'
  | 'invalid'
  | 'broadcast'
  | 'cancelled'
  | 'completed'
  | 'error'
  | 'incomplete'
  | 'queued'
  | 'qr'
  | 'retracted'
  | 'sending'
  | 'signing'
  | 'sent'
  | 'blocked';

type MethodPath = {
  section: string;
  method: string;
};

type PolkadotTXEventsPayload<T = undefined> = {
  data: T;
  key: string;
  address: string;
  path: MethodPath;
};
type PolkadotTXEvents = {
  beforeSend: PolkadotTXEventsPayload;
  afterSend: PolkadotTXEventsPayload;
  failed: PolkadotTXEventsPayload<string>;
  finalize: PolkadotTXEventsPayload<string | void | undefined>;
  inBlock: PolkadotTXEventsPayload;
  extrinsicSuccess: PolkadotTXEventsPayload;
  loading: PolkadotTXEventsPayload<any>;
};

export type NotificationConfig = {
  loading: (data: PolkadotTXEventsPayload<ReactElement>) => string | number;
  finalize: (data: PolkadotTXEventsPayload<string | void | undefined>) => string | number;
  failed: (data: PolkadotTXEventsPayload<string>) => string | number;
};
const txLogger = LoggerService.get('PolkadotTx');

export class PolkadotTx<P extends Array<any>> extends EventBus<PolkadotTXEvents> {
  public notificationKey = '';
  private transactionAddress: AddressOrPair | null = null;
  private isWrapped = false;

  constructor (private apiPromise: ApiPromise, private path: MethodPath, private parms: P) {
    super();
  }

  async call (signAddress: AddressOrPair) {
    txLogger.info(`Sending ${this.path.section} ${this.path.method} transaction by`, signAddress, this.parms);
    this.transactionAddress = signAddress;
    const api = this.apiPromise;

    await api.isReady;

    if (!api.tx[this.path.section] || !api.tx[this.path.section][this.path.method]) {
      txLogger.error(`can not find api.tx.${this.path.section}.${this.path.method}`);

      return;
    }

    this.notificationKey = uniqueId(`${this.path.section}-${this.path.method}`);

    if ((signAddress as IKeyringPair)?.address === undefined) {
      // passed an account id or string of address
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(signAddress as string);

      await api.setSigner(injector.signer);
    }

    const txResults = await api.tx[this.path.section][this.path.method](...this.parms).signAsync(signAddress, {
      nonce: -1
    });

    await this.emitWithPayload('beforeSend', undefined);
    await this.emitWithPayload('loading', '');
    const hash = txResults.hash.toString();

    await this.send(txResults);

    await this.emitWithPayload('afterSend', undefined);
    this.transactionAddress = null;
    txLogger.info(`Tx ${this.path.section} ${this.path.method} is Done: TX hash=`, hash);

    return hash;
  }

  protected async emitWithPayload<E extends keyof PolkadotTXEvents> (
    event: E,
    data: PolkadotTXEvents[E]['data']
  ): Promise<void> {
    if (this.isWrapped) {
      return;
    }

    this.emit(event, {
      address: this.transactionAddress ?? '',
      data: data,
      key: this.notificationKey,
      path: this.path
    } as any);
  }

  private errorHandler (r: SubmittableResult) {
    // @ts-ignore
    let message = r.dispatchError?.type || r.type || r.message;

    if (r.dispatchError?.isModule) {
      try {
        const mod = r.dispatchError.asModule;
        const error = this.apiPromise.registry.findMetaError(
          new Uint8Array([mod.index.toNumber(), mod.error.toNumber()])
        );

        message = `${error.section}.${error.name}`;
      } catch (error) {
        message = Reflect.has(error as any, 'toString') ? (error as any)?.toString() : error;
      }
    }

    // eslint-disable-next-line  @typescript-eslint/no-floating-promises
    this.emitWithPayload('failed', message);

    return message;
  }

  private async send (tx: SubmittableExtrinsic<any>) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
      try {
        await tx.send(async (result) => {
          const status = result.status;
          const events = result.events.filter(({ event: { section } }) => section === 'system');

          if (status.isInBlock || status.isFinalized) {
            for (const event of events) {
              const { event: { data, method } } = event;
              const [dispatchError] = data as any;

              if (method === 'ExtrinsicFailed') {
                let message = dispatchError.type;

                if (dispatchError.isModule) {
                  try {
                    const mod = dispatchError.asModule;
                    const error = dispatchError.registry.findMetaError(mod);

                    message = `${error.section}.${error.name}`;
                  } catch (error) {
                    const message = this.errorHandler(error as any);

                    reject(message);
                  }
                } else if (dispatchError.isToken) {
                  message = `${dispatchError.type}.${dispatchError.asToken.type}`;
                }

                this.isWrapped = true;
                await this.emitWithPayload('failed', message);
                reject(message);
              } else if (method === 'ExtrinsicSuccess') {
                // todo return the TX hash
                resolve('okay');
                await this.emitWithPayload('finalize', undefined);
                this.isWrapped = true;
              }
            }
          }
        });
      } catch (e) {
        console.log(e);
        const errorMessage = this.errorHandler(e as any);

        await this.emitWithPayload('failed', errorMessage);
        reject(errorMessage);
      }
    });
  }
}

export class PolkaTXBuilder {
  constructor (private apiPromise: ApiPromise, private notificationHandler: NotificationHandler) {
  }

  buildWithoutNotification<P extends Array<any>> ({ method, section }: MethodPath, params: P): PolkadotTx<P> {
    return new PolkadotTx<P>(this.apiPromise.clone(), { method, section }, params);
  }

  build<P extends Array<any>> (path: MethodPath, params: P, notificationHandler?: NotificationHandler): PolkadotTx<P> {
    const tx = this.buildWithoutNotification(path, params);
    const handler = notificationHandler || this.notificationHandler;

    tx.on('loading', (data) => {
      handler({
        description: data.address,
        key: data.key,
        level: 'loading',
        message: `${data.path.section}:${data.path.method}`,
        name: 'Transaction',
        persist: true
      });
    });

    tx.on('finalize', (data) => {
      handler({
        description: data.address,
        key: data.key,
        level: 'success',
        message: `${data.path.section}:${data.path.method}`,
        name: 'Transaction',
        persist: true
      });
    });

    tx.on('failed', (data) => {
      console.log(data);
      handler({
        description: data.data,
        key: data.key,
        level: 'error',
        message: `${data.path.section}:${data.path.method}`,
        name: 'Transaction',
        persist: true
      });
    });

    return tx;
  }
}
