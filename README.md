
# Network entity limits

- The scene will define the amount of network entities available for each client, and the amount of local entities
- The client will assign a range of entity ids to each client, and clients will be able to freely create network entities in such range.

## what if a client runs out of space for network entities?
 
- _Proposed solution_: Add the ability to request new ranges from the server, This cannot be done as part of the entity creation process, since it's a sync function, but we could add a simple API like this to the NetworkEntityFactory


```
getCapacity(): number // returns the number of entities the current range can create
ensureCapacity(c: number): Promise<void> // request a new range to the server
```

- if an addEntity call is made while there is no capacity, we will throw an error

## Reuse range if most ids are unused

Currently, the server reserves fixed entity ids ranges for each client `[512, 1024]`, `[1024, 1536]`, etc. That means the n-th client will get `[512*n, 512*(n+1)]` -assuming 512 is the max amount of networked entities defined in the scene-. The problem is we will eventually run out of entities since there are only 2**16 available.

- _Proposed solution_: be able to return shorter ranges by looking back at unused entities in a used range, so if client1 was assigned `[512, 1024]` but used only 5 entities, the range `[517, 1024]` is still available

## Persistent state

The server will accumulate the sync state of all clients, and the network entities of the past will remain in the state, which may cause problems, both in the size of the state and also in entity id availability.

- How do we remove entities in such a way we are able to reuse state?
- How do we provide the ability to scene creators to be able to distinguish from networked entities that should or shouldn't persist in time?
