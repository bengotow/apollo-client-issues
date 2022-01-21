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
 * This reproduces a bug in which loading a small query for object A into
 * the cache, and then navigating to a page which requests MORE of object A
 * provides partial data to the component that does not match the typescript type.
 *
 * The fix is to check for loading=true and not use the provided data, but this
 * was NOT necessary in apollo-client 3.3.16.
 */

const client = new ApolloClient({
  uri: "https://fruits-api.netlify.app/graphql",
  cache: new InMemoryCache({}),
});

function Inner1() {
  const { loading, error, data } = useQuery(SCREEN_1_QUERY, {});

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  return (
    <div>
      <h1>Fruit 1 Summary</h1>
      {JSON.stringify(data)}
    </div>
  );
}

function Inner2() {
  const [fruitId, setFruitId] = React.useState(2);
  const { loading, error, data } = useQuery(SCREEN_2_QUERY, {
    notifyOnNetworkStatusChange: true,
    variables: { id: fruitId },
  });

  // Fix is to check loading state
  // if (loading) return <p>Loading...</p>;

  if (error) return <p>Error :(</p>;

  if (data && data.fruit.id && !data.fruit.tree_name) {
    throw new Error("id is present but other fields (tree_name) are missing!");
  }
  return (
    <div>
      <h1>Fruit {fruitId} Details</h1>
      {JSON.stringify(data)}
      <button onClick={() => setFruitId(1)}>
        Change Variables, Request Fruit 1 Details
      </button>
    </div>
  );
}

function App() {
  const [screen, setScreen] = React.useState(1);

  return (
    <ApolloProvider client={client}>
      {`Using Apollo Client v${client.version}`}
      <div className="App">
        {screen === 1 ? <Inner1 /> : <Inner2 />}
        {screen === 1 && <button onClick={() => setScreen(2)}>Show Details</button>}
      </div>
    </ApolloProvider>
  );
}

const SCREEN_1_QUERY = gql`
  query Screen1Query {
    fruit(id: 1) {
      id
      family
    }
  }
`;

const SCREEN_2_QUERY = gql`
  query Screen2Query($id: ID!) {
    fruit(id: $id) {
      id
      family
      origin
      tree_name
    }
  }
`;

export default App;
