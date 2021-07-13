import {
  makeExtendSchemaPlugin,
  gql,
  makeWrapResolversPlugin,
  makeChangeNullabilityPlugin,
  makePluginByCombiningPlugins,
} from 'graphile-utils';
import { Plugin } from 'graphile-build';
import * as _ from 'lodash';
import { BN } from 'bn.js';

// https://www.graphile.org/postgraphile/make-change-nullability-plugin/
const NftViewIdNullablePlugin = makePluginByCombiningPlugins(
  // 1. make NftViewInput.id nullable:
  makeChangeNullabilityPlugin({
    NftViewInput: {
      id: true,
    },
    CreateNftViewInput: {
      nftViewInput: true,
    },
  }),
  // 2: return null unless the user id matches the current logged in user_id
  makeWrapResolversPlugin({
    NftViewInput: {
      id: {
        resolve(resolver, source, args, context, _resolveInfo) {
          // if (context.jwtClaims.user_id !== user.$user_id) return null;
          console.log(source);
          return resolver(source, args, context, _resolveInfo);
        },
      },
    },
  }),
);

const NftViewPlugin: Plugin = makeExtendSchemaPlugin(() => ({
  typeDefs: gql`
    extend type Mutation {
      createNftViewFunc(viewerId: String, nftId: String): NftView
    }
  `,
  resolvers: {
    Mutation: {
      createNftViewFunc: async (_query, args, context, resolveInfo) => {
        let dbSchema = context.projectSchema;
        let pgPool = context.pgClient;
        // see ../../../indexer/store.service.ts
        // await pgPool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA ${dbSchema} CASCADE`);
        // await pgPool.query(`ALTER TABLE ONLY ${dbSchema}.nft_views ALTER COLUMN id SET DEFAULT ${dbSchema}.gen_random_uuid()`);
        let { rows } = await pgPool.query(
          `INSERT INTO ${dbSchema}.nft_views (viewer_id, nft_id) VALUES ('${args.viewerId}', '${args.nftId}') returning *`,
        );
        let row = rows[0];
        return {
          id: row.id,
          id2: row.id2,
          viewerId: row.viewer_id,
          nftId: row.nft_id,
          timestamp: row.timestamp,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      },
    },
  },
}));

var globalString: string;
const GlobalStringPlugin: Plugin = makeExtendSchemaPlugin(() => ({
  typeDefs: gql`
    extend type Query {
      globalString: String
    }
    extend type Mutation {
      globalString(input: String): String
    }
  `,
  resolvers: {
    Query: {
      globalString: () => {
        return globalString;
      },
    },
    Mutation: {
      globalString: (_query, args, context, resolveInfo) => {
        console.log('Mutation globalString', args);
        globalString = args.input;
        return globalString;
      },
    },
  },
}));

var globalKv: { [key: string]: string } = {};
const GlobalKvPlugin: Plugin = makeExtendSchemaPlugin(() => ({
  typeDefs: gql`
    extend type Query {
      globalKv(key: String): JSON
    }
    extend type Mutation {
      globalKv(key: String, value: String): JSON
    }
  `,
  resolvers: {
    Query: {
      globalKv: (_query, args, context, resolveInfo) => {
        if (args.key) {
          return globalKv[args.key];
        }
        return globalKv;
      },
    },
    Mutation: {
      globalKv: (_query, args, context, resolveInfo) => {
        console.log('Mutation globalKv', args);
        globalKv[args.key] = args.value;
        return globalKv;
      },
    },
  },
}));

const HeadersPlugin: Plugin = makeExtendSchemaPlugin(() => ({
  typeDefs: gql`
    extend type Query {
      headersArray: [[String]]
      headers: JSON
      method: String
      url: String
    }
  `,
  resolvers: {
    Query: {
      headersArray: (_query, args, context, resolveInfo) => {
        return Object.entries(context.req.headers);
      },
      headers: (_query, args, context, resolveInfo) => {
        return context.req.headers;
      },
      method: (_query, args, context, resolveInfo) => {
        return context.req.method;
      },
      url: (_query, args, context, resolveInfo) => {
        return context.req.url;
      },
    },
  },
}));

class RandomType {
  public name: string;
  constructor(name: string) {
    this.name = name;
  }
  public toString(): string {
    return this.name;
  }
  public hello(args): string {
    return `${this.name}: hello ${args.name}`;
  }
  public world(args): string {
    return `${this.name}: world ${args.name}`;
  }
}

async function hijackedHello(
  resolve,
  source: RandomType,
  args,
  context,
  resolveInfo,
) {
  const result = source.hello(args);
  console.log('result', result);
  console.log('args', JSON.stringify(args));
  console.log('source', source);
  console.log('source.hello(args)', source.hello(args));
  return `Hijacked: ${result}`;
}

async function emptyAccountFallback(
  resolve,
  source: RandomType,
  args,
  context,
  resolveInfo,
) {
  // ensureAccount
  let dbSchema = context.projectSchema;
  let pgClient = context.pgClient;
  let id = args.id;
  await pgClient.query(
    `INSERT INTO ${dbSchema}.accounts (id) VALUES ('${id}') ON CONFLICT DO NOTHING`,
  );

  return await resolve();
}

async function ownedNftsHandler(resolve, source, args, context, resolveInfo) {
  // let id = parent.__identifiers[0];
  let id = source.id;
  let { api } = context;
  let dbSchema = context.projectSchema;
  let pgPool = context.pgClient;

  // let nfts = [];
  let nftidxs = await api.query.ormlNft.tokensByOwner.entries(id);

  console.log(`ownedNftsHandler: has ${nftidxs.length} nfts owned by account`);

  for (let [i, nftidx] of nftidxs.entries()) {
    // console.log(`nfts[${i}]: ${nft} ${nft.length}`);
    let clzToken = nftidx[0];
    const len = clzToken.length;
    const classId = new Uint32Array(clzToken.slice(len - 4 - 8, len - 8))[0];
    const tokenId = Buffer.from(clzToken.slice(len - 8, len)).readBigUInt64LE();
    let nftId = `${classId}-${tokenId}`;
    /*
    let nftdata = (
      await api.query.ormlNft.tokens(classId, tokenId)
    ).toJSON() as any;
    console.log(nftdata);
    */
    console.log(
      `${i} UPDATE ${dbSchema}.nfts SET owner_id = '${id}' where id = '${nftId}'`,
    );

    await pgPool.query(
      `UPDATE ${dbSchema}.nfts SET owner_id = '${id}' where id = '${nftId}'`,
    );
  }

  return await resolve();
}

const EmptyAccountFallbackPlugin: Plugin = makeWrapResolversPlugin({
  Query: {
    account: emptyAccountFallback,
  },
  Account: {
    ownedNfts: ownedNftsHandler,
  },
});

const HijackRandomTypePlugin: Plugin = makeWrapResolversPlugin({
  RandomType: {
    hello: hijackedHello,
  },
});

const MyRandomPlugin: Plugin = makeExtendSchemaPlugin(() => ({
  typeDefs: gql`
    type RandomType {
      hello(name: String): String
      world(name: String): String
    }
    extend type Query {
      myRandom: Int!
      myRandomType(name: String): RandomType!
      hello(name: String): String!
      world(name: String): String!
      jwt: String
    }
  `,
  resolvers: {
    Query: {
      myRandom: (_query, args, context, resolveInfo) => {
        console.log(_query, args);
        return randomNumber(1, 100);
      },
      myRandomType: (_query, args, context, resolveInfo) => {
        // console.log(_query, args, context, resolveInfo);
        return new RandomType(args.name);
      },
      hello: (_query, args, context, resolveInfo) => {
        console.log(_query, args);
        return `hello ${args.name}`;
      },
      world: (_query, args, context, resolveInfo) => {
        console.log(_query, args);
        console.log('context.Self.name is', context);
        return `world ${args.name}`;
      },
      jwt: (_query, args, context, resolveInfo) => {
        console.log(context.jwtClaims);
        return `${JSON.stringify(context.jwtClaims)}`;
      },
    },
  },
}));

// No imports required!

function randomNumber(min: number = 1, max: number = 100, sides?: number) {
  return Math.floor(Math.random() * ((sides || max) - min + 1)) + max;
}

function MyRandomFieldPlugin(
  builder,
  { myDefaultMin = 1, myDefaultMax = 100 },
) {
  let myRandomField = (
    fields /* input object */,
    { extend, graphql: { GraphQLInt } } /* Build */,
    context /* Context */,
  ) => {
    const {
      scope: { isRootMutation, isRootQuery },
    } = context;
    if (isRootQuery) {
      return fields;
    }
    return extend(fields, {
      randomField: {
        type: GraphQLInt,
        args: {
          sides: {
            type: GraphQLInt,
          },
        },
        resolve(_, { sides = myDefaultMax }) {
          return randomNumber(myDefaultMin, myDefaultMax, sides);
        },
      },
    });
  };

  builder.hook('GraphQLObjectType:fields', myRandomField);
}

// https://www.graphile.org/graphile-build/schema-builder/
function GraphQLObjectTypeLogNamePlugin(builder) {
  let mylogger = (fields, build, context) => {
    if (fields.name == 'Account') {
      console.log(
        'A new GraphQLObjectType is being constructed with name: ',
        // Object.keys(fields),
        // build,
        // context,
        fields.name,
        fields,
      );
      /*
      let {extend, graphql: { GraphQLInt}} = build;
      let {api} = context;
      return extend(fields, {
        balance: {
          type: GraphQLInt,
          async resolve(){
            return 1;
          },
        },
      });
      */
    }
    return fields;
  };
  builder.hook('GraphQLObjectType:fields', mylogger);
}

const AccountBalancePlugin: Plugin = makeExtendSchemaPlugin((build) => ({
  typeDefs: gql`
    extend type Account {
      balance: Float
      balanceBigInt: BigInt
      balanceHuman: String
      ownedNft: Int
      createdNft: Int
      createdClass: Int
    }
    extend type Nft {
      ownersId: [String]
    }
  `,
  resolvers: {
    Account: {
      balance: async (parent, args, context, resolveInfo) => {
        let id = parent.__identifiers[0];
        let { api } = context;
        let {
          data: { free: balance },
        } = await api.query.system.account(id);
        let bn = balance.toBigInt();
        let bf = Number(bn.toString()) / Number('1000000000000');
        console.log(`${id}: ${bf}`);
        return bf;
      },
      balanceBigInt: async (parent, args, context, resolveInfo) => {
        let id = parent.__identifiers[0];
        let { api } = context;
        let {
          data: { free: balance },
        } = await api.query.system.account(id);
        let bn = balance.toBigInt();
        console.log(`${id}: ${bn}`);
        return bn;
      },
      balanceHuman: async (parent, args, context, resolveInfo) => {
        let id = parent.__identifiers[0];
        let { api } = context;
        let {
          data: { free: balance },
        } = await api.query.system.account(id);
        let bh = balance.toHuman();
        console.log(`${id}: ${bh}`);
        return bh;
      },
      ownedNft: async (parent, args, context, resolveInfo) => {
        let id = parent.__identifiers[0];
        let { api } = context;
        let nfts = [];
        let nftidxs = await api.query.ormlNft.tokensByOwner.entries(id);
        console.log(`owned Nft count: ${nftidxs.length}`);
        return nftidxs.length;
      },
      createdNft: async (parent, args, context, resolveInfo) => {
        let id = parent.__identifiers[0];
        let dbSchema = context.projectSchema;
        let pgPool = context.pgClient;
        let { rowCount } = await pgPool.query(
          `SELECT * FROM ${dbSchema}.nfts WHERE creator_id = '${id}'`,
        );
        console.log(`created Nft count: ${rowCount}`);
        return rowCount;
      },
      createdClass: async (parent, args, context, resolveInfo) => {
        let id = parent.__identifiers[0];
        let dbSchema = context.projectSchema;
        let pgPool = context.pgClient;
        let { rowCount } = await pgPool.query(
          `SELECT * FROM ${dbSchema}.classes WHERE creator_id = '${id}'`,
        );
        console.log(`created class count: ${rowCount}`);
        return rowCount;
      },
    },
    // called only when nft exists in database
    // make EmptyNftFallbackHandler maybe?
    Nft: {
      ownersId: async (parent, args, context, resolveInfo) => {
        let id = parent.__identifiers[0];
        let { api, keyring } = context;
        let dbSchema = context.projectSchema;
        let pgPool = context.pgClient;

        // console.log(parent, args);

        let owners = await api.query.ormlNft.ownersByToken.entries(
          id.split('-').map(Number),
        );
        let addrs = [];
        for (let owner of owners) {
          let key = owner[0];
          const len = key.length;
          key = key.buffer.slice(len - 32, len);
          const addr = keyring.encodeAddress(new Uint8Array(key));
          addrs.push(addr);
        }

        return addrs;
      },
    },
  },
}));

function NoopPlugin(builder) {
  console.log('I do not do anything, except nothing');
}

export {
  GraphQLObjectTypeLogNamePlugin,
  NoopPlugin,
  MyRandomFieldPlugin,
  MyRandomPlugin,
  GlobalStringPlugin,
  HeadersPlugin,
  HijackRandomTypePlugin,
  GlobalKvPlugin,
  NftViewIdNullablePlugin,
  NftViewPlugin,
  AccountBalancePlugin,
  EmptyAccountFallbackPlugin,
};
