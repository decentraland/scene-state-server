import { IBaseComponent } from '@well-known-components/interfaces'
import { customEvalSdk7 } from '../logic/scene-runtime/sandbox'
import { createModuleRuntime } from '../logic/scene-runtime/sdk7-runtime'
import { WsUserData } from '@well-known-components/http-server/dist/uws'
import { AppComponents } from '../types'
import { MessageType, decodeMessage, encodeInitMessage, encodeMessage } from '../logic/protocol'
import { setTimeout } from 'timers/promises'

const OPEN = 1
// Entities reserved for the client/renderer
const ENTITIES_RESERVED_SIZE = 512
// Entities reserved for local entities.
const LOCAL_ENTITIES_RESERVED_SIZE = ENTITIES_RESERVED_SIZE + 2048
// Amount of entities that each client receives
const NETWORK_ENTITIES_RANGE_SIZE = 512

export type ISceneComponent = IBaseComponent & {
  run(code: string): Promise<void>
  // TODO: remove this: only for debugging purposes
  reload(): Promise<void>
  addSceneClient(client: WsUserData): void
}

export type Client = {
  sendCrdtMessage(message: Uint8Array): void
  getMessages(): Uint8Array[]
}

export type ClientEvent =
  | {
      type: 'open'
      clientId: string
      client: Client
    }
  | { type: 'close'; clientId: string }

export type ClientObserver = (client: ClientEvent) => void

export function createSceneComponent({ logs }: Pick<AppComponents, 'logs'>): ISceneComponent {
  const logger = logs.getLogger('scene')

  let clientObserver: ClientObserver | undefined
  let crdtState: Uint8Array
  let loaded = false
  let abortController = new AbortController()
  let lastClientId: number

  // TODO: remove this: only for debugging purposes
  let code: string
  async function reload() {
    await stop()
    await run(code)
  }

  // run the code of the scene
  async function run(sourceCode: string) {
    code = sourceCode
    crdtState = new Uint8Array()
    clientObserver = undefined
    lastClientId = 1 // 0 is reserved for the server
    loaded = true

    const runtimeExecutionContext = Object.create(null)
    const sceneModule = createModuleRuntime(runtimeExecutionContext)

    Object.defineProperty(runtimeExecutionContext, 'registerClientObserver', {
      configurable: false,
      value: (observer: ClientObserver) => {
        clientObserver = observer
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
        logger.warn(
          'The scene does not export an onUpdate function. Documentation: https://dcl.gg/sdk/missing-onUpdate'
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
          await setTimeout(Math.max(ms | 0, 0), undefined, { signal: abortController.signal })
        }
      }
    } catch (e: any) {
      logger.warn(e)
      await stop()
    }
  }

  async function stop() {
    if (loaded) {
      loaded = false
      abortController.abort()
    }
  }

  async function addSceneClient(socket: WsUserData) {
    const index = lastClientId++
    const clientId = String(index)

    if (!clientObserver) {
      logger.warn('no client observer registered by the scene')
      return
    }

    // Send CRDT Network State
    socket.send(
      encodeInitMessage(
        crdtState,
        index * NETWORK_ENTITIES_RANGE_SIZE + LOCAL_ENTITIES_RESERVED_SIZE,
        NETWORK_ENTITIES_RANGE_SIZE,
        LOCAL_ENTITIES_RESERVED_SIZE
      ),
      true
    )
    const clientMessages: Uint8Array[] = []
    socket.on('message', (message) => {
      const [msgType, msgData] = decodeMessage(new Uint8Array(message))
      if (msgType === MessageType.Crdt && msgData.byteLength) {
        clientMessages.push(new Uint8Array(msgData))
      }
    })

    socket.on('close', () => {
      clientObserver!({
        type: 'close',
        clientId: clientId
      })
    })

    clientObserver({
      type: 'open',
      clientId: clientId,
      client: {
        sendCrdtMessage(message: Uint8Array) {
          if (message.byteLength && socket.readyState === OPEN) {
            socket.send(encodeMessage(MessageType.Crdt, message), true)
          }
        },
        getMessages() {
          const msgs = [...clientMessages]
          clientMessages.length = 0
          return msgs
        }
      }
    })
  }

  return {
    run,
    reload,
    stop,
    addSceneClient
  }
}
