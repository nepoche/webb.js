// Copyright 2022 @nepoche/
// SPDX-License-Identifier: Apache-2.0

import { Bridge, Currency, MixerSize, WrapUnWrap } from '@nepoche/api-providers/abstracts/index.js';
import { Amount, WrappingBalance, WrappingEvent } from '@nepoche/api-providers/index.js';
import { ERC20__factory as ERC20Factory } from '@nepoche/contracts';
import { ContractTransaction } from 'ethers';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import Web3 from 'web3';

import { evmIdIntoInternalChainId, InternalChainId } from '../chains/index.js';
import { WebbGovernedToken, zeroAddress } from '../contracts/index.js';
import { WebbCurrencyId, webbCurrencyIdToString } from '../enums/index.js';
import { CurrencyType } from '../types/currency-config.interface.js';
import { WebbWeb3Provider } from './webb-provider.js';

export type Web3WrapPayload = Amount;
export type Web3UnwrapPayload = Amount;
const defaultBalance: WrappingBalance = {
  balance: '0',
  tokenId: undefined
};

export class Web3WrapUnwrap extends WrapUnWrap<WebbWeb3Provider> {
  private _balances = new BehaviorSubject<[WrappingBalance, WrappingBalance]>([defaultBalance, defaultBalance]);
  private _liquidity = new BehaviorSubject<[WrappingBalance, WrappingBalance]>([defaultBalance, defaultBalance]);
  private _currentChainId = new BehaviorSubject<InternalChainId | null>(null);
  private _event = new Subject<Partial<WrappingEvent>>();

  private get config () {
    return this.inner.config;
  }

  get balances (): Observable<[WrappingBalance, WrappingBalance]> {
    return this._balances.asObservable();
  }

  get liquidity (): Observable<[WrappingBalance, WrappingBalance]> {
    return this._liquidity.asObservable();
  }

  get subscription (): Observable<Partial<WrappingEvent>> {
    return this._event.asObservable();
  }

  constructor (protected inner: WebbWeb3Provider) {
    super(inner);

    inner.getChainId().then((evmChainId) => {
      this._currentChainId.next(evmIdIntoInternalChainId(evmChainId));
      this._event.next({
        ready: null
      });
    }).catch((e) => {
      throw e;
    });

    inner.on('providerUpdate', ([evmChainId]) => {
      this._currentChainId.next(evmIdIntoInternalChainId(evmChainId));
      this._event.next({
        stateUpdate: null
      });
    });
  }

  setGovernedToken (nextToken: WebbCurrencyId | null) {
    this._governedToken.next(nextToken);
    this._event.next({
      governedTokenUpdate: nextToken
    });
  }

  setWrappableToken (nextToken: WebbCurrencyId | null) {
    this._wrappableToken.next(nextToken);
    this._event.next({
      wrappableTokenUpdate: nextToken
    });
  }

  getSizes (): Promise<MixerSize[]> {
    return Promise.resolve([]);
  }

  private get currentChainId () {
    return this._currentChainId.value;
  }

  // TODO: Dynamic wrappable currencies
  //
  async getWrappableTokens (governedCurrency?: WebbCurrencyId | null): Promise<WebbCurrencyId[]> {
    if (this.currentChainId) {
      const currenciesOfChain = this.config.chains[this.currentChainId].currencies;
      const wrappableCurrencies = currenciesOfChain.filter((currencyId) => {
        return Currency.isWrappableCurrency(this.inner.config.currencies, currencyId);
      });

      if (governedCurrency) {
        const webbGovernedToken = this.governedTokenWrapper(governedCurrency);

        return wrappableCurrencies.filter((token) => {
          const tokenAddress = this.config.currencies[token].addresses.get(this.currentChainId!)!;

          return webbGovernedToken.canWrap(tokenAddress);
        });
      } else {
        return wrappableCurrencies;
      }
    }

    return [];
  }

  async getGovernedTokens (): Promise<WebbCurrencyId[]> {
    if (this.currentChainId) {
      return Bridge.getTokensOfChain(this.inner.config.currencies, this.currentChainId).map(
        (currency) => currency.view.id
      );
    }

    return [];
  }

  async canUnWrap (unwrapPayload: Web3UnwrapPayload): Promise<boolean> {
    const { amount } = unwrapPayload;
    const governedTokenId = this.governedToken!;
    const webbGovernedToken = this.governedTokenWrapper(governedTokenId);

    const account = await this.inner.accounts.accounts();
    const currentAccount = account[0];

    return webbGovernedToken.canUnwrap(currentAccount.address, Number(amount));
  }

  async unwrap (unwrapPayload: Web3UnwrapPayload): Promise<string> {
    const { amount: amountNumber } = unwrapPayload;

    const governedTokenId = this.governedToken!;
    const wrappableTokenId = this.wrappableToken!;
    const amount = Web3.utils.toWei(String(amountNumber), 'ether');

    const webbGovernedToken = this.governedTokenWrapper(governedTokenId);

    try {
      this.inner.notificationHandler({
        description: `Unwrapping ${amountNumber} of ${webbCurrencyIdToString(
          governedTokenId
        )} to ${webbCurrencyIdToString(wrappableTokenId)}`,
        key: 'unwrap-asset',
        level: 'loading',
        message: 'GovernedTokenWrapper:unwrap',
        name: 'Transaction'
      });
      const tx = await webbGovernedToken.unwrap(
        this.config.currencies[wrappableTokenId].addresses.get(this.currentChainId!)!,
        amount
      );

      await tx.wait();
      this.inner.notificationHandler({
        description: `Unwrapping ${amountNumber} of ${webbCurrencyIdToString(
          governedTokenId
        )} to ${webbCurrencyIdToString(wrappableTokenId)}`,
        key: 'unwrap-asset',
        level: 'success',
        message: 'GovernedTokenWrapper:unwrap',
        name: 'Transaction'
      });

      return tx.hash;
    } catch (e) {
      console.log('error while unwrapping: ', e);
      this.inner.notificationHandler({
        description: `Failed to unwrap ${amountNumber} of ${webbCurrencyIdToString(
          governedTokenId
        )} to ${webbCurrencyIdToString(wrappableTokenId)}`,
        key: 'unwrap-asset',
        level: 'error',
        message: 'GovernedTokenWrapper:unwrap',
        name: 'Transaction'
      });

      return '';
    }
  }

  async canWrap (): Promise<boolean> {
    const governedToken = this.governedToken!;
    const wrappableToken = this.wrappableToken!;
    const webbGovernedToken = this.governedTokenWrapper(governedToken);

    if (this.config.currencies[wrappableToken].type === CurrencyType.NATIVE) {
      return webbGovernedToken.isNativeAllowed();
    } else {
      const tokenAddress = this.config.currencies[governedToken].addresses.get(this.currentChainId!)!;

      return webbGovernedToken.canWrap(tokenAddress);
    }
  }

  async wrap (wrapPayload: Web3WrapPayload): Promise<string> {
    const { amount: amountNumber } = wrapPayload;

    const wrappableTokenId = this.wrappableToken!;
    const governableTokenId = this.governedToken!;
    const webbGovernedToken = this.governedTokenWrapper(governableTokenId);
    const amount = Web3.utils.toWei(String(amountNumber), 'ether');

    try {
      this.inner.notificationHandler({
        description: `Wrapping ${String(amountNumber)} of ${webbCurrencyIdToString(
          wrappableTokenId
        )} to ${webbCurrencyIdToString(governableTokenId)}`,
        key: 'wrap-asset',
        level: 'loading',
        message: 'GovernedTokenWrapper:wrap',
        name: 'Transaction'
      });
      console.log('address of token to wrap into webbGovernedToken', this.getAddressFromWrapTokenId(wrappableTokenId));
      let tx: ContractTransaction;

      // If wrapping an erc20, check for approvals
      if (this.getAddressFromWrapTokenId(wrappableTokenId) !== zeroAddress) {
        const wrappableTokenInstance = ERC20Factory.connect(
          this.getAddressFromWrapTokenId(wrappableTokenId),
          this.inner.getEthersProvider().getSigner()
        );
        const wrappableTokenAllowance = await wrappableTokenInstance.allowance(
          await this.inner.getEthersProvider().getSigner().getAddress(),
          wrappableTokenInstance.address
        );

        console.log(wrappableTokenAllowance);

        if (wrappableTokenAllowance.lt(amount)) {
          this.inner.notificationHandler({
            description: 'Waiting for token approval',
            key: 'waiting-approval',
            level: 'info',
            message: 'Waiting for token approval',
            name: 'Approval',
            persist: true
          });
          tx = await wrappableTokenInstance.approve(webbGovernedToken.address, amount);
          await tx.wait();
          this.inner.notificationHandler.remove('waiting-approval');
        }
      }

      tx = await webbGovernedToken.wrap(this.getAddressFromWrapTokenId(wrappableTokenId), amount);
      await tx.wait();
      this.inner.notificationHandler({
        description: `Wrapping ${String(amountNumber)} of ${webbCurrencyIdToString(
          wrappableTokenId
        )} to ${webbCurrencyIdToString(governableTokenId)}`,
        key: 'wrap-asset',
        level: 'success',
        message: 'GovernedTokenWrapper:wrap',
        name: 'Transaction'
      });

      return tx.hash;
    } catch (e) {
      console.log('error while wrapping: ', e);
      this.inner.notificationHandler({
        description: `Failed to wrap ${String(amountNumber)} of ${webbCurrencyIdToString(
          wrappableTokenId
        )} to ${webbCurrencyIdToString(governableTokenId)}`,
        key: 'wrap-asset',
        level: 'error',
        message: 'GovernedTokenWrapper:wrap',
        name: 'Transaction'

      });

      return '';
    }
  }

  private getAddressFromWrapTokenId (id: WebbCurrencyId): string {
    const currentNetwork = this.currentChainId!;
    const address = this.config.currencies[id].addresses.get(currentNetwork)!;

    return address;
  }

  governedTokenWrapper (id: WebbCurrencyId): WebbGovernedToken {
    const contractAddress = this.getAddressFromWrapTokenId(id);

    return new WebbGovernedToken(this.inner.getEthersProvider(), contractAddress);
  }
}
