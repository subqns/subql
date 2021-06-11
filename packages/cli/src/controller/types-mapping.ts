// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Model type mapping
const typeMap = new Map();
typeMap.set('ID', 'string');
typeMap.set('Int', 'number');
typeMap.set('BigInt', 'bigint');
typeMap.set('String', 'string');
typeMap.set('Date', 'Date');
typeMap.set('Boolean', 'boolean');

// TODO
// typeMap.set('Float', 'number');
// typeMap.set('BigDecimal', 'number');
typeMap.set('Uuid', 'string');

export function transformTypes(className: string, fieldType: string): string {
  const trimType = fieldType.trim();
  return typeMap.get(trimType);
}
