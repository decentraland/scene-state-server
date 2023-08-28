import { IBaseComponent } from '@well-known-components/interfaces'
import { customEvalSdk7 } from '../logic/scene-runtime/sandbox'
import { createModuleRuntime } from '../logic/scene-runtime/sdk7-runtime'
import { WsUserData } from '@well-known-components/http-server/dist/uws'
import { MessageType, decodeMessage, encodeMessage } from '../controllers/handlers/ws-handler'
import { AppComponents } from '../types'

const OPEN = 1

export type ISceneComponent = IBaseComponent & {
  run(code: string): Promise<void>
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
  // create the context for the scene
  const runtimeExecutionContext = Object.create(null)
  const sceneModule = createModuleRuntime(runtimeExecutionContext)

  let clientObserver: ClientObserver | undefined = undefined
  let crdtState: Uint8Array = new Uint8Array()

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

  let loaded = false
  let lastClientId = 0
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

  async function addSceneClient(socket: WsUserData) {
    const clientId = String(lastClientId++)

    if (!clientObserver) {
      logger.warn('no client observer registered by the scene')
      return
    }

    // Send CRDT Network State
    if (crdtState.byteLength && socket.readyState === OPEN) {
      socket.send(encodeMessage(MessageType.Crdt, crdtState), true)
    }

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
    stop,
    addSceneClient
  }
}

async function sleep(ms: number): Promise<boolean> {
  await new Promise<void>((resolve) => setTimeout(resolve, Math.max(ms | 0, 0)))
  return true
}
