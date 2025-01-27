// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

import { ApiInitHandler, AppConfig, NotificationHandler, ProvideCapabilities, WasmFactory, WebbApiProvider, WebbMethods, WebbProviderEvents, WebbRelayerBuilder } from '@nepoche/api-providers/index.js';
import { EventBus } from '@nepoche/app-util/index.js';

import { ApiPromise } from '@polkadot/api';
import { InjectedAccount, InjectedExtension } from '@polkadot/extension-inject/types';

import { AccountsAdapter } from '../account/Accounts.adapter.js';
import { PolkadotProvider } from '../ext-providers/index.js';
import { ActionsBuilder, InteractiveFeedback, WebbError, WebbErrorCodes } from '../webb-error/index.js';
import { PolkadotAnchorApi } from './anchor-api.js';
import { PolkadotBridgeDeposit } from './anchor-deposit.js';
import { PolkadotAnchorWithdraw } from './anchor-withdraw.js';
import { PolkadotChainQuery } from './chain-query.js';
import { PolkadotMixerDeposit } from './mixer-deposit.js';
import { PolkadotMixerWithdraw } from './mixer-withdraw.js';
import { PolkaTXBuilder } from './transaction.js';
import { PolkadotWrapUnwrap } from './wrap-unwrap.js';

export class WebbPolkadot extends EventBus<WebbProviderEvents> implements WebbApiProvider<WebbPolkadot> {
  readonly methods: WebbMethods<WebbPolkadot>;
  readonly api: ApiPromise;
  readonly txBuilder: PolkaTXBuilder;

  private constructor (
    apiPromise: ApiPromise,
    injectedExtension: InjectedExtension,
    readonly relayingManager: WebbRelayerBuilder,
    public readonly config: AppConfig,
    readonly notificationHandler: NotificationHandler,
    private readonly provider: PolkadotProvider,
    readonly accounts: AccountsAdapter<InjectedExtension, InjectedAccount>,
    readonly wasmFactory: WasmFactory
  ) {
    super();
    this.provider = new PolkadotProvider(
      apiPromise,
      injectedExtension,
      new PolkaTXBuilder(apiPromise, notificationHandler)
    );
    this.accounts = this.provider.accounts;
    this.api = this.provider.api;
    this.txBuilder = this.provider.txBuilder;
    this.methods = {
      anchor: {
        core: null,
        deposit: {
          enabled: true,
          inner: new PolkadotBridgeDeposit(this)
        },
        withdraw: {
          enabled: true,
          inner: new PolkadotAnchorWithdraw(this)
        }
      },
      anchorApi: new PolkadotAnchorApi(this, this.config.bridgeByAsset),
      chainQuery: new PolkadotChainQuery(this),
      mixer: {
        deposit: {
          enabled: true,
          inner: new PolkadotMixerDeposit(this)
        },
        withdraw: {
          enabled: true,
          inner: new PolkadotMixerWithdraw(this)
        }
      },
      wrapUnwrap: {
        core: {
          enabled: false,
          inner: new PolkadotWrapUnwrap(this)
        }
      }
    };
  }

  capabilities?: ProvideCapabilities | undefined;

  getProvider () {
    return this.provider;
  }

  async awaitMetaDataCheck () {
    /// delay some time till the UI is instantiated and then check if the dApp needs to update extension meta data
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const metaData = await this.provider.checkMetaDataUpdate();

    if (metaData) {
      /// feedback body
      const feedbackEntries = InteractiveFeedback.feedbackEntries([
        {
          header: 'Update Polkadot MetaData'
        }
      ]);
      /// feedback actions
      const actions = ActionsBuilder.init()
        /// update extension metadata
        .action('Update MetaData', () => this.provider.updateMetaData(metaData), 'success')
        .actions();
      const feedback = new InteractiveFeedback(
        'info',
        actions,
        () => {
          return null;
        },
        feedbackEntries
      );

      /// emit the feedback object
      this.emit('interactiveFeedback', feedback);
    }
  }

  private async insureApiInterface () {
    // check for RPC
    console.log(this.api, 'api');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const merkleRPC = Boolean(this.api.rpc.mt.getLeaves);
    // merkle rpc
    const merklePallet = this.api.query.merkleTreeBn254;
    const mixerPallet = this.api.query.mixerBn254;

    if (!merklePallet || !merkleRPC || !mixerPallet) {
      throw WebbError.from(WebbErrorCodes.InsufficientProviderInterface);
    }
  }

  static async init (
    appName: string, // App name Arbitrary name
    endpoints: string[], // Endpoints of the substrate node
    errorHandler: ApiInitHandler, // Error handler that will be used to catch errors while initializing the provider
    relayerBuilder: WebbRelayerBuilder, // Webb Relayer builder for relaying withdraw
    appConfig: AppConfig, // The whole and current app configuration
    notification: NotificationHandler, // Notification handler that will be used for the provider
    wasmFactory: WasmFactory // A Factory Fn that wil return wasm worker that would be supplied eventually to the `sdk-core`
  ): Promise<WebbPolkadot> {
    const [apiPromise, injectedExtension] = await PolkadotProvider.getParams(appName, endpoints, errorHandler.onError);
    const provider = new PolkadotProvider(apiPromise, injectedExtension, new PolkaTXBuilder(apiPromise, notification));
    const accounts = provider.accounts;
    const instance = new WebbPolkadot(
      apiPromise,
      injectedExtension,
      relayerBuilder,
      appConfig,
      notification,
      provider,
      accounts,
      wasmFactory
    );

    await instance.insureApiInterface();
    /// check metadata update
    await instance.awaitMetaDataCheck();
    await apiPromise.isReady;

    return instance;
  }

  static async initWithCustomAccountsAdapter (
    appName: string, // App name Arbitrary name
    endpoints: string[], // Endpoints of the substrate node
    errorHandler: ApiInitHandler, // Error handler that will be used to catch errors while initializing the provider
    relayerBuilder: WebbRelayerBuilder, // Webb Relayer builder for relaying withdraw
    appConfig: AppConfig, // The whole and current app configuration
    notification: NotificationHandler, // Notification handler that will be used for the provider
    accounts: AccountsAdapter<InjectedExtension, InjectedAccount>,
    apiPromise: ApiPromise,
    injectedExtension: InjectedExtension,
    wasmFactory: WasmFactory
  ): Promise<WebbPolkadot> {
    const provider = new PolkadotProvider(apiPromise, injectedExtension, new PolkaTXBuilder(apiPromise, notification));
    const instance = new WebbPolkadot(
      apiPromise,
      injectedExtension,
      relayerBuilder,
      appConfig,
      notification,
      provider,
      accounts,
      wasmFactory
    );

    await instance.insureApiInterface();
    /// check metadata update
    await instance.awaitMetaDataCheck();
    await apiPromise.isReady;

    return instance;
  }

  async destroy (): Promise<void> {
    await this.provider.destroy();
  }
}
