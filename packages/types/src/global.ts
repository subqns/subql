// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ApiPromise} from '@polkadot/api';
import Pino from 'pino';
import {Store} from './interfaces';

var store: Store;
var api: ApiPromise;
var patchedApi: ApiPromise;
var logger: Pino.Logger;

function setGlobal(vars: {logger: Pino.Logger; api: ApiPromise; patchedApi: ApiPromise; store: Store}) {
  store = vars.store;
  api = vars.api;
  patchedApi = vars.patchedApi;
  logger = vars.logger;
}

export {store, api, patchedApi, logger, setGlobal};
