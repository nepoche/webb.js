// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

import { expect } from 'chai';

import { initPolkadotProvider } from './utils/init-polkadot-provider.js';

describe('Bootstrap providers', function () {
  this.timeout(120_000);

  it('Should init Polkadot provider', async () => {
    const provider = await initPolkadotProvider();
    const chainProperties = await provider.api.rpc.system.properties();

    expect(chainProperties).not.equal(null);
  });
});
