import path from 'path'
import { readFileSync } from 'fs'

import { customEvalSdk7 } from './sandbox'
import { createModuleRuntime } from './sdk7-runtime'

export async function runScene() {
  // create the context for the scene
  const runtimeExecutionContext = Object.create(null)
  const sceneModule = createModuleRuntime(runtimeExecutionContext)
  // run the code of the scene
  const scenePath = path.resolve(__dirname, 'game.js').replace('/dist/', '/src/')
  const sourceCode = readFileSync(scenePath, 'utf-8')
  await customEvalSdk7(sourceCode, runtimeExecutionContext)
  const updateIntervalMs: number = 1000 / 30

  if (!sceneModule.exports.onUpdate && !sceneModule.exports.onStart) {
    // there may be cases where onStart is present and onUpdate not for "static-ish" scenes
    console.error(
      new Error(
        '🚨🚨🚨🚨🚨 Your scene does not export an onUpdate function. Documentation: https://dcl.gg/sdk/missing-onUpdate'
      )
    )
  }

  await sceneModule.runStart()

  // finally, start event loop
  if (sceneModule.exports.onUpdate) {
    // first update always use 0.0 as delta time
    await sceneModule.runUpdate(0.0)

    let start = performance.now()

    while (true) {
      const now = performance.now()
      const dtMillis = now - start
      start = now

      const dtSecs = dtMillis / 1000

      await sceneModule.runUpdate(dtSecs)
      // wait for next frame
      const ms = Math.max((updateIntervalMs - (performance.now() - start)) | 0, 0)
      await sleep(ms)
    }
  }
}

async function sleep(ms: number): Promise<boolean> {
  await new Promise<void>((resolve) => setTimeout(resolve, Math.max(ms | 0, 0)))
  return true
}
