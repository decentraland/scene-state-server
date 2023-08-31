## Persistent state while server is running

The server will accumulate the sync state of all clients, and the network entities of the past will remain in the state, which may cause problems, both in the size of the state and also in entity id availability.

- How do we remove entities in such a way we are able to reuse state?
- How do we provide the ability to scene creators to be able to distinguish from networked entities that should or shouldn't persist in time?

## State when server is restarted

- How do we reconcile the state of each client that may attempt to reconnect with a fresh state from the server? Not only the crdt state of the entities but the range definitions and so on..

- _Proposed simple solution_: Let's not handle reconnections, If a server is down show a UI explaining to the user the server has gone down and that they should restart the scene.
