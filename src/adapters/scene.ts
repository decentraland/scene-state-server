import { IBaseComponent } from '@well-known-components/interfaces'
import { customEvalSdk7 } from '../logic/scene-runtime/sandbox'
import { createModuleRuntime } from '../logic/scene-runtime/sdk7-runtime'

export type ISceneComponent = IBaseComponent & {
  run: (code: string) => Promise<void>
}

export function createSceneComponent(): ISceneComponent {
  // create the context for the scene
  const runtimeExecutionContext = Object.create(null)
  const sceneModule = createModuleRuntime(runtimeExecutionContext)

  let loaded = false
  // run the code of the scene
  async function run(sourceCode: string) {
    loaded = true

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

      while (loaded) {
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

  async function stop() {
    if (loaded) {
      loaded = false
    }
  }

  return {
    run,
    stop
  }
}

async function sleep(ms: number): Promise<boolean> {
  await new Promise<void>((resolve) => setTimeout(resolve, Math.max(ms | 0, 0)))
  return true
}
