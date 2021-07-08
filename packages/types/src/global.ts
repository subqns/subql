// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ApiPromise, Keyring} from '@polkadot/api';
import Pino from 'pino';
import {Store} from './interfaces';

var store: Store;
var api: ApiPromise;
var patchedApi: ApiPromise;
var logger: Pino.Logger;
var keyring: Keyring;

function setGlobal(vars: {
  logger: Pino.Logger;
  api: ApiPromise;
  patchedApi: ApiPromise;
  store: Store;
  keyring: Keyring;
}) {
  store = vars.store;
  api = vars.api;
  patchedApi = vars.patchedApi;
  logger = vars.logger;
  keyring = vars.keyring;
}

export {store, api, patchedApi, logger, keyring, setGlobal};
