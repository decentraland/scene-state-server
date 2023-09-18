import { upgradeWebSocketResponse } from '@well-known-components/http-server/dist/ws'
import { HandlerContextWithPath, NotFoundError, WebSocket } from '../../types'
import { IHttpServerComponent } from '@well-known-components/interfaces'
import { verify } from '@dcl/platform-crypto-middleware'
import { MessageType, decodeJSON, decodeMessage } from '../../logic/protocol'

const authTimeout = 1000 * 5 // 5 secs

export async function wsHandler(
  context: HandlerContextWithPath<'logs' | 'config' | 'fetch' | 'scenes' | 'wsRegistry', '/ws/:scene'>
): Promise<IHttpServerComponent.IResponse> {
  const {
    components: { logs, config, fetch, scenes, wsRegistry }
  } = context
  const logger = logs.getLogger('Websocket Handler')

  logger.debug('Websocket requested')

  const sceneName = context.params.scene
  const scene = scenes.get(sceneName)
  if (!scene) {
    logger.debug(`${sceneName} is not currently loaded in the server`)
    throw new NotFoundError(`${sceneName} is not currently loaded in the server`)
  }

  const baseUrl = (
    (await config.getString('HTTP_BASE_URL')) || `${context.url.protocol}//${context.url.host}`
  ).toString()
  const path = new URL(baseUrl + context.url.pathname)

  return upgradeWebSocketResponse((socket) => {
    const ws = socket as any as WebSocket
    wsRegistry.onWsConnected(ws)
    ws.on('error', (error) => {
      logger.error('ws-error')
      logger.error(error)
      try {
        ws.end()
      } catch {}
    })

    ws.on('close', () => {
      logger.debug('Websocket closed')
    })

    let authenticated = false

    async function waitForAuth(data: ArrayBuffer) {
      const [msgType, msgData] = decodeMessage(new Uint8Array(data))
      if (msgType === MessageType.Auth) {
        try {
          const headers = decodeJSON(msgData)
          await verify(context.request.method, path.pathname, headers, {
            fetcher: fetch
          })
          authenticated = true
          scene!.addSceneClient(ws)
          logger.log('ws authenticated')
        } catch (e: any) {
          logger.debug(e)
          ws.end()
        } finally {
          ws.off('message', waitForAuth)
        }
      }
    }

    setTimeout(() => {
      if (!authenticated) {
        logger.debug('Timeout waiting for authentication message')
        ws.end()
      }
    }, authTimeout)
    ws.on('message', waitForAuth)
  })
}
