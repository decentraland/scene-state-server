# Running locally

Create an `.env` file with the var `LOCAL_SCENE_PATH` pointed to your scene compiled game file. For example:

```
LOCAL_SCENE_PATH=../moving-platforms-multiplayer-test/bin/game.js
```

Run `yarn` to install dependencies, `yarn build` to build the server, and every time you compile your scene the server should be started running `yarn start`

# Deploying the server to prod

You can find a public docker image in `quay.io/decentraland/scene-state-server`, or build it yourself.

`LOCAL_SCENE_PATH` should not be included in the deployed enviroment. You can specify a world server url with `WORLD_SERVER_URL`, and you *must* specify a `DEBUGGING_SECRET`.

Once the server is running and before be able to use the server in a world, you need to request the server to load the world's scene:

curl -H "Content-Type: application/json" -X POST --data '{"secret": <secret>, "name": "<world name>"}' https://<server url>/debugging/reload

you can use the same command to restart the world'sscene state.

Please remember this API is alpha, eventually we would like to integrate new worlds deployment in a more straight forward way.
