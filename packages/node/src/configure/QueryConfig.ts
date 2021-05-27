// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { get } from 'lodash';

export class QueryConfig {
  constructor(private readonly store: Record<never, never>) {}

  get<T>(key: string, defaultValue?: T): T {
    return process.env[key.toUpperCase()] ?? get(this.store, key, defaultValue);
  }
}
