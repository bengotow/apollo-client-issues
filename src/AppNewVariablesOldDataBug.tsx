import {
  ApolloClient,
  InMemoryCache,
  useQuery,
  ApolloProvider,
  gql,
} from "@apollo/client";
import React from "react";
import "./App.css";

/**
 * This reproduces a bug in which loading a query using variables ABC and then
 * changing to variables DEF briefly yields a useQuery result where
 * - result.data is the old data
 * - result.variables is the new data
 *
 * This happens without caching enabled and even if you check for loading=true.
 *
 * Prior to Apollo client 3.5, this was not a problem. The useQuery would return
 * no data at all until the request had been made again.
 */

const client = new ApolloClient({
  uri: "https://fruits-api.netlify.app/graphql",
  cache: new InMemoryCache({
    resultCaching: false,
  }),
});

function Inner() {
  const [family, setFamily] = React.useState("Rosaceae");
  const { loading, error, data } = useQuery(FRUIT_FAMILY_QUERY, {
    variables: { family },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  if (data.filterFruitsFam.some((fruit: any) => fruit.family !== family)) {
    throw new Error(
      "useQuery - not loading, returned data is for old variables"
    );
  }
  return (
    <div>
      <button onClick={() => setFamily("Lauraceae")}>
        Switch Fruit Family
      </button>
      <div>
        {data.filterFruitsFam.map((a: any) => (
          <div key={a.id}>{JSON.stringify(a, null, 2)}</div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <ApolloProvider client={client}>
      <div className="App">
        <Inner />
      </div>
    </ApolloProvider>
  );
}

const FRUIT_FAMILY_QUERY = gql`
  query FruitFamilyQuery($family: String!) {
    filterFruitsFam(family: $family) {
      id
      family
      fruit_name
    }
  }
`;

export default App;
