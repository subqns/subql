// Copyright 2020-2021 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0

import fs from 'fs';
import {buildASTSchema, DocumentNode, extendSchema, GraphQLSchema, parse, Source} from 'graphql';
import {directives} from './schema/directives';
import {scalas} from './schema/scalas';

function loadBaseSchema(): GraphQLSchema {
  const schema = buildASTSchema(scalas);
  return extendSchema(schema, directives);
}

export function buildSchema(path: string): GraphQLSchema {
  console.log('233 buildSchema');
  const src = new Source(fs.readFileSync(path).toString());
  const doc = parse(src);
  return buildSchemaFromDocumentNode(doc);
}

export function buildSchemaFromDocumentNode(doc: DocumentNode): GraphQLSchema {
  return extendSchema(loadBaseSchema(), doc);
}

export function buildSchemaInlined(path: string): GraphQLSchema {
  const doc = parse(new Source(fs.readFileSync(path).toString()));
  let schema: GraphQLSchema;
  schema = buildASTSchema(scalas);
  schema = extendSchema(schema, directives);
  schema = extendSchema(schema, doc);
  return schema;
}
