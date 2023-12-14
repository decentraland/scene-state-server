This LODs Manifest Builder was created based on the experimental [scene-state-server](https://github.com/decentraland/scene-state-server).

NOTE: THIS SERVER IMPLEMENTATION IS A WIP AND NOT AT ALL IN ITS FINAL STATE...

# What the server does

Based on a target scene, the server fetches its main file (game.js/index.js/main.crdt), runs it for some frames with a very basic version of the sdk7 core runtime and outputs a manifest JSON file with the rendereable entities information.

Information gathered:
- Transform component data
- GLTFContainer component data
- MeshRenderer component data
- Material component data

# SDK6 Scenes support

This server supports targetting SDK6 scenes as it uses the [sdk7-adaption-layer](https://github.com/decentraland/sdk7-adaption-layer/tree/main) when a non SDK7 scene is detected. 

# Configuring target scene

Create a `.env` file with the var `REMOTE_SCENE_COORDS` specifying the target scene coordiantes. For example:

```
REMOTE_SCENE_COORDS=-129,-77
```

# Running the server locally and manually

Run `npm run build` to build the server after any modification (or first install)

Run `npm run start` to run the server

When the server finishes the output manifest file will appear in the root folder with the name `rendereable-entities-manifest.json`