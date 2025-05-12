# Debugging SDK7 Scenes

This guide explains how to set up VS Code to debug your SDK7 scene running within the scene-state-server.

## Setup

1. Create a `.env` file in the root of your scene-state-server project with:

```
# Scene State Server Configuration
BOEDO=true
PREVIEW_PATH=/absolute/path/to/your/scene/bin/index.js
DEBUGGING_SECRET=local_dev_secret
WORLD_SERVER_URL=https://worlds-content-server.decentraland.org
```

Replace `/absolute/path/to/your/scene/bin/index.js` with the actual path to your scene's compiled index.js file.

2. Make sure your scene has source maps enabled by verifying your scene's tsconfig.json includes:

```json
{
  "compilerOptions": {
    "sourceMap": true,
    // other options...
  }
}
```

3. Build your scene with `npm run build` or `dcl build` to generate the compiled code with source maps.

## Debugging Your Scene

1. Open VS Code with both your scene project and the scene-state-server project.

2. In the scene-state-server project, select the "Debug SDK7 Scene" launch configuration from the Run and Debug view.

3. Set breakpoints in your scene's TypeScript source files.

4. Press F5 or click the green play button to start debugging.

5. The server will load your scene and stop at the `debugger` statement we added, which pauses execution right before your scene code runs.

6. Press F5 to continue execution until it hits your breakpoints.

## How It Works

The scene-state-server has been modified to:

1. Insert a `debugger` statement and source map comment at the beginning of your scene code
2. Enable Node.js's built-in debugging capabilities
3. Configure VS Code to recognize your scene's source maps

This allows VS Code to map the runtime JavaScript back to your original TypeScript files, enabling proper debugging.

## Troubleshooting

- If breakpoints are not being hit, ensure source maps are correctly generated
- Verify the path in PREVIEW_PATH is correct and pointing to the compiled index.js
- Check that you've selected the "Debug SDK7 Scene" launch configuration
- Try adding explicit `debugger;` statements in your scene code if needed