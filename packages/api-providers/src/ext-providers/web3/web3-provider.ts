// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/ban-ts-comment */

import WalletConnectProvider from '@walletconnect/web3-provider';
import { ProvideCapabilities } from '@nepoche/api-providers/index.js';
import { ethers } from 'ethers';
import Web3 from 'web3';
import { AbstractProvider } from 'web3-core';

import { WebbError, WebbErrorCodes } from '../../webb-error/index.js';

export type AddToken = { address: string; symbol: string; decimals: number; image: string };
export interface AddEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string; // 2-6 characters long
    decimals: 18;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[]; // Currently ignored.
}

export interface SwitchEthereumChainParameter {
  chainId: string; // A 0x-prefixed hexadecimal string
}

export interface ClientMetaData {
  description: string;
  url: string;
  icons: string[];
  name: string;
}

export class Web3Provider<T = unknown> {
  private helperApi: T | null = null;
  private _capabilities: ProvideCapabilities = {
    addNetworkRpc: false,
    hasSessions: false,
    listenForAccountChange: false,
    listenForChainChane: false
  };

  private constructor (private _inner: Web3, readonly clientMeta: ClientMetaData | null = null) {}

  static get currentProvider () {
    // @ts-ignore
    if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
      // @ts-ignore
      const provider = window.ethereum || window.web3.currentProvider;

      if (provider) {
        return provider;
      }
    }

    throw WebbError.from(WebbErrorCodes.MetaMaskExtensionNotInstalled);
  }

  static async fromExtension () {
    // @ts-ignore
    if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
      // @ts-ignore
      const provider = Web3Provider.currentProvider;

      await provider.enable();
      const web3Provider = new Web3Provider(new Web3(provider), {
        description: 'MetaMask',
        icons: [],
        name: 'MetaMask',
        url: 'https://https://metamask.io'
      });

      web3Provider._capabilities = {
        addNetworkRpc: true,
        hasSessions: false,
        listenForAccountChange: true,
        listenForChainChane: true
      };

      return web3Provider;
    }

    throw WebbError.from(WebbErrorCodes.MetaMaskExtensionNotInstalled);
  }

  static fromUri (url: string) {
    const HttpProvider = new Web3.providers.HttpProvider(url);
    const web3 = new Web3(HttpProvider);

    return new Web3Provider(web3);
  }

  static async fromWalletConnectProvider (WCProvider: WalletConnectProvider) {
    await WCProvider.enable();
    const web3 = new Web3(WCProvider as unknown as any);
    const web3Provider = new Web3Provider<WalletConnectProvider>(web3, WCProvider.walletMeta);

    web3Provider._capabilities = {
      addNetworkRpc: false,
      hasSessions: true,
      listenForAccountChange: false,
      listenForChainChane: false
    };
    web3Provider.helperApi = WCProvider;

    return web3Provider;
  }

  get network () {
    return this._inner.eth.net.getId();
  }

  get eth () {
    return this._inner.eth;
  }

  get account () {
    return this._inner.defaultAccount;
  }

  get provider () {
    return this._inner.eth.currentProvider;
  }

  public get capabilities () {
    return this._capabilities;
  }

  enable () {
    // @ts-ignore
  }

  intoEthersProvider () {
    return new ethers.providers.Web3Provider(this.provider as any, 'any');
  }

  async endSession () {
    try {
      if (this.capabilities.hasSessions) {
        if (this.helperApi instanceof WalletConnectProvider) {
          // TODO : handle the connector not found type error
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          await this.helperApi.connector.killSession({
            message: 'Session end error'
          });
        }
      }
    } catch (e) {
      throw WebbError.from(WebbErrorCodes.EVMSessionAlreadyEnded);
    }
  }

  addChain (chainInput: AddEthereumChainParameter) {
    const provider = this._inner.currentProvider as AbstractProvider;

    return provider.request?.({
      method: 'wallet_addEthereumChain',
      params: [chainInput]
    });
  }

  switchChain (chainInput: SwitchEthereumChainParameter) {
    const provider = this._inner.currentProvider as AbstractProvider;

    return provider.request?.({
      method: 'wallet_switchEthereumChain',
      params: [chainInput]
    });
  }

  addToken (addTokenInput: AddToken) {
    return (this._inner.currentProvider as AbstractProvider).request?.({
      method: 'wallet_watchAsset',
      params: {
        options: {
          address: addTokenInput.address, // The address that the token is at.
          decimals: addTokenInput.decimals, // The number of decimals in the token
          image: addTokenInput.image, // A string url of the token logo
          symbol: addTokenInput.symbol // A ticker symbol or shorthand, up to 5 chars.
        },
        type: 'ERC20' // Initially only supports ERC20, but eventually more!
      }
    });
  }
}
