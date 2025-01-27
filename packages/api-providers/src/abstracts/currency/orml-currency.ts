// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

import { LoggerService } from '@nepoche/app-util/index.js';

import { WebbPolkadot } from '../../polkadot/index.js';

export type ORMLAsset = {
  existentialDeposit: string;
  locked: false;
  name: string;
  id: string;
};

const logger = LoggerService.get('currencies');

export class ORMLCurrency {
  constructor (private api: WebbPolkadot) {}

  async list () {
    const assets = await this.api.api.query.assetRegistry.assets.entries();

    return assets.map(([storageKey, i]) => ({
      // @ts-ignore
      ...i.toHuman(),
      // @ts-ignore
      id: storageKey.toHuman()[0] as string
    })) as ORMLAsset[];
  }

  async getBalance () {
    const activeAccount = await this.api.accounts.activeOrDefault;

    logger.info('active account', activeAccount);
    console.log(this.api.accounts);

    if (activeAccount) {
      const ormlBalances = await this.api.api.query.tokens.accounts.entries(activeAccount.address);

      logger.info(`ORML Balances ${ormlBalances.length}`, ormlBalances);

      return ormlBalances.map(([storageKey, balance]) => {
        const currencyId = storageKey[0];

        return {
          balance: balance.toHuman(),
          id: currencyId
        };
      });
    }

    return [];
  }
}
