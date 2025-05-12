# Preview Mode

This document explains how to use the preview mode of the scene-state-server, including the WebSocket watcher that automatically reloads your scene when changes are detected.

## Overview

The preview component provides development-specific features that make it easier to develop and test scenes without manual intervention. One of these features is the WebSocket watcher, which connects to a WebSocket server and listens for scene changes.

## Enabling Preview Mode

To enable preview mode, add the following environment variables to your `.env` file:

```
# Scene configuration for preview mode
PREVIEW_PATH=/absolute/path/to/your/scene/bin/index.js
```

This enables basic preview mode, which loads the specified scene file when the server starts.

## WebSocket Watcher for Automatic Reloading

The WebSocket watcher automatically reloads your scene when changes are detected. To enable it, add the WebSocket port to your environment configuration:

```
# WebSocket watcher configuration for automatic reloading
PREVIEW_PORT=8080
```

When configured, the watcher will:

1. Connect to a WebSocket server on the specified port
2. Listen for messages indicating scene changes
3. Automatically reload the scene when changes are detected

## Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `PREVIEW_PATH` | Specifies the path to your compiled scene file | Yes |
| `PREVIEW_PORT` | Specifies the port for the WebSocket connection | No (required for auto-reload) |

## How It Works

When the scene-state-server starts with these environment variables set:

1. It loads the local scene specified in `PREVIEW_PATH`
2. If `PREVIEW_PORT` is set, it connects to a WebSocket server on that port
3. When the WebSocket server sends a message indicating a change, the scene is automatically reloaded

The watcher will reconnect if the connection is lost and properly handle errors.

## Usage with Scene Development Tools

Many scene development tools already include WebSocket servers that emit events when file changes are detected. These can be integrated with this scene watcher for automatic reloading.

### Example: Using with Decentraland SDK CLI

If you're using the Decentraland SDK CLI for development, it already runs a WebSocket server when you use `dcl start`. To integrate with the scene watcher:

1. Start your scene with the CLI in one terminal:
   ```
   cd /path/to/your/scene
   dcl start
   ```

2. Start the scene-state-server with the appropriate environment variables in another terminal:
   ```
   cd /path/to/scene-state-server
   # Ensure your .env file has the correct configuration
   npm start
   ```

3. The scene-state-server will connect to the WebSocket server started by the CLI and automatically reload the scene when changes are detected.

### Custom WebSocket Integration

If you're using a custom development setup, you need to ensure your development server emits WebSocket messages with the following format:

```json
{
  "type": "reload"
}
```

or

```json
{
  "type": "change"
}
```

When the scene watcher receives either of these message types, it will reload the scene.

## Future Preview Features

The preview component is designed to be extensible. Other preview features can be added in the future, such as:

- Hot module replacement
- Development-specific debugging tools
- Performance monitoring
- Automatic error reporting

## Troubleshooting

If you encounter issues with the preview features:

1. Check your console logs for errors
2. Verify that your environment variables are correctly set
3. For WebSocket issues, verify that your development server is running and the WebSocket port is correctly configured
4. Ensure there are no firewalls blocking the WebSocket connection
5. Check that your development server is sending the correct message format