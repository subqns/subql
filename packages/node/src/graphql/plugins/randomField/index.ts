import { makeExtendSchemaPlugin, gql } from 'graphile-utils';
import { Plugin } from 'graphile-build';

const MyRandomPlugin: Plugin = makeExtendSchemaPlugin(
    () => ({
      typeDefs: gql`
        type RandomType {
            hello(input: String): String
            world(input: String): String
        }
        extend type Query {
          myRandom: Int!
          myRandomType: RandomType!
          hello(name: String): String!
          world(name: String): String!
          jwt: String
        }
      `,
      resolvers: {
        Query: {
          myRandom: (_query, args, context, resolveInfo) => {
              console.log(_query, args)
              return randomNumber(1, 100);
          },
          myRandomType: (_query, args, context, resolveInfo)=>{
              console.log(_query, args, context, resolveInfo);
              return 'help';
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
          jwt: (_query, args, context, resolveInfo)=>{
            console.log(context.jwtClaims);
            return `${JSON.stringify(context.jwtClaims)}`;
          }
        },
      },
    }),
  )

// No imports required!

function randomNumber(min: number = 1, max: number = 100, sides?: number) {
    return Math.floor(Math.random() * ((sides||max) - min + 1)) + max;
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

export { MyRandomFieldPlugin, MyRandomPlugin };
