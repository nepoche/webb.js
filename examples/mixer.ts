import { ApiPromise } from '@polkadot/api';
import { WsProvider } from '@polkadot/rpc-provider';
import { options } from '@nepoche/api';
// import { Note } from '@nepoche/sdk-core';
// import { JsNote } from '@nepoche/wasm-utils/njs';

async function connectToLocalChain() {
  const provider = new WsProvider('wss://localhost:9944');
  const api = new ApiPromise(options({ provider }));
  await api.isReady;
  return api;
}

(async () => {
  await connectToLocalChain();
  process.exit(0);
})();