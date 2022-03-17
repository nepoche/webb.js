import { ApiPromise } from '@polkadot/api';
import { InjectedAccount, InjectedExtension } from '@polkadot/extension-inject/types';
import {
  ApiInitHandler,
  AppConfig,
  NotificationHandler,
  ProvideCapabilities,
  WebbApiProvider,
  WebbMethods,
  WebbProviderEvents
} from '../webb-context';
import { PolkadotBridgeApi } from './polkadot-bridge-api';
import { PolkadotBridgeDeposit } from './polkadot-bridge-deposit';
import { PolkadotMixerWithdraw } from './polkadot-mixer-withdraw';
import { PolkadotBridgeWithdraw } from './polkadot-bridge-withdraw';
import { ActionsBuilder, InteractiveFeedback, WebbError, WebbErrorCodes } from '../webb-error';
import { PolkaTXBuilder } from './polkadot-transaction';
import { PolkadotMixerDeposit } from './polkadot-mixer-deposit';
import { EventBus } from '@webb-tools/app-util';
import { PolkadotChainQuery } from './polkadot-chain-query';
import { WebbRelayerBuilder } from '../webb-context/relayer';
import { AccountsAdapter } from '../account/Accounts.adapter';
import { PolkadotWrapUnwrap } from './polkadot-wrap-unwrap';
import { PolkadotProvider } from '../ext-providers';

export class WebbPolkadot extends EventBus<WebbProviderEvents> implements WebbApiProvider<WebbPolkadot> {
  readonly methods: WebbMethods<WebbPolkadot>;
  readonly api: ApiPromise;
  readonly txBuilder: PolkaTXBuilder;

  private constructor(
    apiPromise: ApiPromise,
    injectedExtension: InjectedExtension,
    readonly relayingManager: WebbRelayerBuilder,
    public readonly config: AppConfig,
    readonly notificationHandler: NotificationHandler,
    private readonly provider: PolkadotProvider,
    readonly accounts: AccountsAdapter<InjectedExtension, InjectedAccount>
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
      bridge: {
        core: null,
        deposit: {
          inner: new PolkadotBridgeDeposit(this),
          enabled: true
        },
        withdraw: {
          inner: new PolkadotBridgeWithdraw(this),
          enabled: true
        }
      },
      wrapUnwrap: {
        core: {
          enabled: false,
          inner: new PolkadotWrapUnwrap(this)
        }
      },
      mixer: {
        deposit: {
          inner: new PolkadotMixerDeposit(this),
          enabled: true
        },
        withdraw: {
          inner: new PolkadotMixerWithdraw(this),
          enabled: true
        }
      },
      chainQuery: new PolkadotChainQuery(this),
      bridgeApi: new PolkadotBridgeApi(this, this.config.bridgeByAsset)
    };
  }

  capabilities?: ProvideCapabilities | undefined;

  getProvider() {
    return this.provider;
  }

  async awaitMetaDataCheck() {
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

  private async insureApiInterface() {
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

  static async init(
    appName: string,
    endpoints: string[],
    errorHandler: ApiInitHandler,
    relayerBuilder: WebbRelayerBuilder,
    appConfig: AppConfig,
    notification: NotificationHandler
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
      accounts
    );
    await instance.insureApiInterface();
    /// check metadata update
    await instance.awaitMetaDataCheck();
    await apiPromise.isReady;
    return instance;
  }

  static async initWithCustomAccountsAdapter(
    appName: string,
    endpoints: string[],
    errorHandler: ApiInitHandler,
    relayerBuilder: WebbRelayerBuilder,
    appConfig: AppConfig,
    notification: NotificationHandler,
    accounts: AccountsAdapter<InjectedExtension, InjectedAccount>
  ): Promise<WebbPolkadot> {
    const [apiPromise, injectedExtension] = await PolkadotProvider.getParams(appName, endpoints, errorHandler.onError);
    const provider = new PolkadotProvider(apiPromise, injectedExtension, new PolkaTXBuilder(apiPromise, notification));
    const instance = new WebbPolkadot(
      apiPromise,
      injectedExtension,
      relayerBuilder,
      appConfig,
      notification,
      provider,
      accounts
    );
    await instance.insureApiInterface();
    /// check metadata update
    await instance.awaitMetaDataCheck();
    await apiPromise.isReady;
    return instance;
  }

  async destroy(): Promise<void> {
    await this.provider.destroy();
  }
}