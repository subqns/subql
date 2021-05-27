// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ApiPromise} from '@polkadot/api';
import {StorageEntryDoubleMap} from '@polkadot/api/types';
import Pino from 'pino';
import {Store} from './interfaces';

var store: Store;
var api: ApiPromise;
var logger: Pino.Logger;

function setStore(s: Store) {
  store = s;
}

function setApi(a: ApiPromise) {
  api = a;
}

function setLogger(l: Pino.Logger) {
  logger = l;
}

/*
declare global {
  var api: ApiPromise;
  var logger: Pino.Logger;
  var store: Store;
}
*/

export {setStore, store, setApi, api, setLogger, logger};
