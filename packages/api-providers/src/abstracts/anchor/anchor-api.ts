// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

import { WebbCurrencyId } from '@nepoche/api-providers/enums/index.js';
import { ChainTypeId, chainTypeIdToInternalId, Currency, InternalChainId } from '@nepoche/api-providers/index.js';
import { BehaviorSubject, Observable } from 'rxjs';

export type BridgeCurrencyIndex = string | number | WebbCurrencyId;

type BridgeStore<BridgeConfigEntry, BridgeConfig = Record<BridgeCurrencyIndex, BridgeConfigEntry>> = {
  config: BridgeConfig;
  activeBridge?: BridgeConfigEntry;
};
export type AnchorBase = {
  amount: string | number;
  neighbours: {
    [key in InternalChainId]?: string | number;
  };
};

export abstract class AnchorApi<Api, BridgeConfigEntry> {
  private readonly _store: BehaviorSubject<BridgeStore<BridgeConfigEntry>>;
  private readonly _watcher: Observable<BridgeStore<BridgeConfigEntry>>;

  public constructor (protected inner: Api, initialStore: Record<BridgeCurrencyIndex, BridgeConfigEntry>) {
    this._store = new BehaviorSubject({
      config: initialStore
    });
    this._watcher = this._store.asObservable();
  }

  get $store () {
    return this._watcher;
  }

  get store (): BridgeStore<BridgeConfigEntry> {
    return this._store.value;
  }

  get bridgeIds () {
    return Object.keys(this.store.config) as BridgeCurrencyIndex[];
  }

  // eslint-disable-next-line @typescript-eslint/adjacent-overload-signatures
  set store (next: Partial<BridgeStore<BridgeConfigEntry>>) {
    this._store.next({ ...this.store, ...next });
  }

  abstract get currency(): Currency | null;

  abstract getCurrencies(): Promise<Currency[]>;

  // For evm
  abstract getTokenAddress(chainId: ChainTypeId): string | null;

  get activeBridge (): BridgeConfigEntry | undefined {
    return this.store.activeBridge;
  }

  abstract getAnchors(): Promise<AnchorBase[]>;

  setActiveBridge (activeBridge: BridgeConfigEntry | undefined) {
    this.store = {
      ...this.store,
      activeBridge: activeBridge
    };
  }

  abstract getWrappableAssets(chainId: ChainTypeId): Promise<Currency[]>;

  /*
   *  Get all Bridge tokens for a given chain
   * */
  async getTokensOfChain (chainId: ChainTypeId): Promise<Currency[]> {
    const tokens = await this.getCurrencies();
    const internalChainId = chainTypeIdToInternalId(chainId);

    return tokens.filter((token) => token.hasChain(internalChainId));
  }
}
