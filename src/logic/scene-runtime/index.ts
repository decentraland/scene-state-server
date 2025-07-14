import { ILoggerComponent } from '@well-known-components/interfaces'
import { setTimeout } from 'timers/promises'
import { customEvalSdk7 } from './sandbox'
import { createModuleRuntime } from './sdk7-runtime'
import { LoadableApis } from './apis'
import { createInternalEngine } from './engine'

export interface SceneExecutorOptions {
  logger: ILoggerComponent.ILogger
}

export interface SceneExecutionController {
  abort(): void
  isRunning: boolean
}

/**
 * Runs a scene with the given hash and source code
 */
export async function runScene(
  sourceCode: string,
  options: SceneExecutorOptions
): Promise<SceneExecutionController> {
  const { logger } = options
  let loaded = true
  const abortController = new AbortController()
  // Create a clean execution context
  const runtimeExecutionContext = Object.create(null)
  const Apis = LoadableApis()
  const sceneModule = createModuleRuntime(runtimeExecutionContext, Apis)
  
  logger.log('Running new scene context')
  const engine = createInternalEngine()
  
  try {
    await customEvalSdk7(sourceCode, runtimeExecutionContext)
    const updateIntervalMs: number = 1000 / 30

    if (!sceneModule.exports.onUpdate && !sceneModule.exports.onStart) {
      // there may be cases where onStart is present and onUpdate not for "static-ish" scenes
      logger.warn('The scene does not export an onUpdate function. Documentation: https://dcl.gg/sdk/missing-onUpdate')
    }

    await sceneModule.runStart()

    // Start the scene update loop
    if (sceneModule.exports.onUpdate) {
      // first update always use 0.0 as delta time
      await sceneModule.runUpdate(0.0)

      let start = Date.now()

      // Run the update loop
      const runLoop = async () => {
        while (loaded && !abortController.signal.aborted) {
          try {
            const currentTime = Date.now()
            const dtMillis = currentTime - start
            start = currentTime

            const dtSecs = dtMillis / 1000
            await sceneModule.runUpdate(dtSecs)
            // wait for next frame
            const elapsed = Date.now() - start
            const ms = Math.max((updateIntervalMs - elapsed) | 0, 0)
            await setTimeout(Math.max(ms | 0, 0), undefined, { signal: abortController.signal })
          } catch (e) {
            logger.error(`Error in scene update loop: ${e}`)
          }
        }
      }

      // Start the loop without awaiting it
      void runLoop()
    }
  } catch (e: any) {
    logger.error(`Error initializing scene: ${e}`)
    loaded = false
    abortController.abort()
  }

  return {
    abort: () => {
      loaded = false
      abortController.abort()
    },
    get isRunning() {
      return loaded && !abortController.signal.aborted
    }
  }
}
