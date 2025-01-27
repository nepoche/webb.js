// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

import { ChainTypeId, InternalChainId } from '../../chains/index.js';
import { WebbCurrencyId } from '../../enums/index.js';
import { CurrencyConfig, CurrencyRole, CurrencyView } from '../../types/currency-config.interface.js';
import { AppConfig } from '../common.js';
import { ORMLAsset } from './orml-currency.js';

export abstract class CurrencyContent {
  abstract get view(): CurrencyView;
}

// This currency class assumes that instances are wrappable assets.
export class Currency extends CurrencyContent {
  constructor (private data: Omit<CurrencyConfig, 'id'> & { id: string | WebbCurrencyId }) {
    super();
  }

  get id () {
    return this.data.id;
  }

  static fromCurrencyId (currenciesConfig: AppConfig['currencies'], currencyId: WebbCurrencyId) {
    const currencyConfig = currenciesConfig[currencyId];

    return new Currency(currencyConfig);
  }

  // TODO: this should be removed instead use the constructor
  static fromORMLAsset (currenciesConfig: AppConfig['currencies'], asset: ORMLAsset): Currency {
    return new Currency({
      ...currenciesConfig[WebbCurrencyId.WEBB],
      addresses: new Map([[InternalChainId.WebbDevelopment, asset.id]]),
      id: `ORML@${asset.id}`,
      name: asset.name,
      symbol: asset.name.slice(0, 3).toLocaleUpperCase()
    });
  }

  static isWrappableCurrency (currenciesConfig: AppConfig['currencies'], currencyId: WebbCurrencyId) {
    if (currenciesConfig[currencyId].role === CurrencyRole.Wrappable) return true;

    return false;
  }

  getAddress (chain: InternalChainId): string | undefined {
    return this.data.addresses.get(chain);
  }

  hasChain (chain: InternalChainId): boolean {
    return this.data.addresses.has(chain);
  }

  getChainIds (): InternalChainId[] {
    return Array.from(this.data.addresses.keys());
  }

  getChainIdsAndTypes (chainsConfig: AppConfig['chains']): ChainTypeId[] {
    return Array.from(this.data.addresses.keys()).map((internalId: any) => {
      return { chainId: chainsConfig[internalId].chainId, chainType: chainsConfig[internalId].chainType };
    });
  }

  get view (): CurrencyView {
    return {
      color: this.data.color,
      icon: this.data.icon,
      id: this.data.id as any,
      name: this.data.name,
      symbol: this.data.symbol,
      type: this.data.type
    };
  }
}
