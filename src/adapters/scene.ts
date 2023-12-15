import { customEvalSdk7 } from '../logic/scene-runtime/sandbox'
import { createModuleRuntime } from '../logic/scene-runtime/sdk7-runtime'
import { setTimeout } from 'timers/promises'

const FRAMES_TO_RUN = 60

export type ISceneComponent = {
  start(hash: string, sourceCode: string): Promise<void>
}

export type ServerTransportConfig = {
  reservedLocalEntities: number
  networkEntitiesLimit: {
    serverLimit: number
    clientLimit: number
  }
}

export async function createSceneComponent(): Promise<ISceneComponent> {
  let config: ServerTransportConfig
  let crdtState: Uint8Array
  let loaded = false
  let abortController: AbortController
  let lastClientId: number
  let sceneHash: string | undefined

  async function start(hash: string, sourceCode: string) {
    abortController = new AbortController()
    crdtState = new Uint8Array()
    lastClientId = 0
    loaded = true
    sceneHash = hash

    const runtimeExecutionContext = Object.create(null)
    const sceneModule = createModuleRuntime(runtimeExecutionContext)

    Object.defineProperty(runtimeExecutionContext, 'registerScene', {
      configurable: false,
      value: (serverConfig: ServerTransportConfig) => {
        config = serverConfig
      }
    })

    Object.defineProperty(runtimeExecutionContext, 'updateCRDTState', {
      configurable: false,
      value: (value: Uint8Array) => {
        crdtState = value
      }
    })

    try {
      await customEvalSdk7(sourceCode, runtimeExecutionContext)
      const updateIntervalMs: number = 1000 / 30

      if (!sceneModule.exports.onUpdate && !sceneModule.exports.onStart) {
        // there may be cases where onStart is present and onUpdate not for "static-ish" scenes
        console.warn(
          'The scene does not export an onUpdate function. Documentation: https://dcl.gg/sdk/missing-onUpdate'
        )
      }

      await sceneModule.runStart()

      // finally, start event loop
      if (sceneModule.exports.onUpdate) {
        // first update always use 0.0 as delta time
        await sceneModule.runUpdate(0.0)
        let framesRan = 1
        let start = performance.now()

        while (framesRan < FRAMES_TO_RUN) {
          const now = performance.now()
          const dtMillis = now - start
          start = now

          const dtSecs = dtMillis / 1000

          await sceneModule.runUpdate(dtSecs)
          // wait for next frame
          const ms = Math.max((updateIntervalMs - (performance.now() - start)) | 0, 0)
          await setTimeout(Math.max(ms | 0, 0), undefined, { signal: abortController.signal })
          
          framesRan++
        }
      }
    } catch (e: any) {
      console.warn(e)
      await stop()
    }
  }

  async function stop() {
    if (loaded) {
      loaded = false
      abortController.abort()
    }
  }

  return {
    start,
  }
}
