# Running locally

Create a `.env` file with the var `PREVIEW_PATH` pointed to your scene compiled game file. For example:

```
PREVIEW_PATH=../moving-platforms-multiplayer-test/bin/game.js
```

Run `yarn` to install dependencies, `yarn build` to build the server, and every time you compile your scene the server should be started running `yarn start`

## Local Development Features

For development, the server includes features that make it easier to develop and test scenes:

### Auto-reload with WebSocket

Enable automatic scene reloading when changes are detected by adding the `PREVIEW_PORT` environment variable:

```
PREVIEW_PATH=../my-scene/bin/game.js
PREVIEW_PORT=8080
```

This will connect to a WebSocket server on the specified port and automatically reload the scene when changes are detected. For more details, see [Preview Mode Documentation](docs/preview.md).

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PREVIEW_PATH` | Path to your compiled scene file | `../my-scene/bin/game.js` |
| `PREVIEW_PORT` | WebSocket port for auto-reload | `8080` |
| `DEBUGGING_SECRET` | Secret for debugging API authentication | `my-secret` |
| `WORLD_SERVER_URL` | URL to the world server | `https://worlds-content-server.decentraland.org` |

# Deploying the server to prod

You can find a public docker image in `quay.io/decentraland/scene-state-server`, or build it yourself.

`PREVIEW_PATH` should not be included in the deployed environment. You can specify a world server url with `WORLD_SERVER_URL`, and you *must* specify a `DEBUGGING_SECRET`.

Once the server is running and before be able to use the server in a world, you need to request the server to load the world's scene:

```
curl -H "Content-Type: application/json" -X POST --data '{"secret": <secret>, "name": "<world name>"}' https://<server url>/debugging/reload
```

you can use the same command to restart the scene state.

Please remember this API is alpha, eventually, we would like to integrate new worlds deployment in a more straightforward way.
