import { IBaseComponent } from '@well-known-components/interfaces'
import { customEvalSdk7 } from '../logic/scene-runtime/sandbox'
import { createModuleRuntime } from '../logic/scene-runtime/sdk7-runtime'
import { WsUserData } from '@well-known-components/http-server/dist/uws'
import { MessageType, decodeMessage } from '../controllers/handlers/ws-handler'

export type ISceneComponent = IBaseComponent & {
  run(code: string): Promise<void>
  addSceneClient(client: WsUserData): void
}

const sceneClients: Map<string, ReturnType<typeof sceneClientTransport>> = new Map()

export function getConnectedClients() {
  return Array.from(sceneClients.keys() ?? []) ?? []
}

export function getSceneClient(clientId: string) {
  return sceneClients.get(clientId)
}

export function createSceneComponent(): ISceneComponent {
  // create the context for the scene
  const runtimeExecutionContext = Object.create(null)
  const sceneModule = createModuleRuntime(runtimeExecutionContext)
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
    // TODO: maybe use the publicKey of the user ?
    const clientId = lastClientId++
    const client = sceneClientTransport(socket, String(clientId))

    // if (clientObserver) {
      // clientObserver({ type: '', clientId: '' })
    // }

    sceneClients.set(String(clientId), client)
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

function sceneClientTransport(socket: WsUserData, clientId: string) {
  const clientMessages: Uint8Array[] = []

  socket.on('close', () => {
    sceneClients.delete(clientId)
  })

  socket.on('message', (message) => {
    const [msgType, msgData] = decodeMessage(new Uint8Array(message))
    if (msgType === MessageType.Crdt && msgData.byteLength) {
      clientMessages.push(new Uint8Array(msgData))
    }
  })

  return {
    id: clientId,
    send(message: Uint8Array) {
      if (message.byteLength) {
        socket.send(new Uint8Array(message), true)
      }
    },
    getMessages() {
      const msgs = [...clientMessages]
      clientMessages.length = 0
      return msgs
    }
  }
}
