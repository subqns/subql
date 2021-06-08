// No imports required!

function MyRandomFieldPlugin(
  builder,
  { myDefaultMin = 1, myDefaultMax = 100 },
) {
  let myRandomField = (
    fields /* input object */,
    { extend, graphql: { GraphQLInt } } /* Build */,
    context /* Context */,
  ) => {
    return extend(fields, {
      randomField: {
        type: GraphQLInt,
        args: {
          sides: {
            type: GraphQLInt,
          },
        },
        resolve(_, { sides = myDefaultMax }) {
          return (
            Math.floor(Math.random() * (sides - myDefaultMin + 1)) +
            myDefaultMin
          );
        },
      },
    });
  };

  builder.hook('GraphQLObjectType:fields', myRandomField);
}

export { MyRandomFieldPlugin };
