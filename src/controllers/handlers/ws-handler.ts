import { upgradeWebSocketResponse } from '@well-known-components/http-server/dist/ws'
import { HandlerContextWithPath } from '../../types'
import { WsUserData } from '@well-known-components/http-server/dist/uws'
import { IHttpServerComponent } from '@well-known-components/interfaces'
import { verify } from '@dcl/platform-crypto-middleware'

export enum MessageType {
  Auth = 1
}

const authTimeout = 1000 * 5 // 5 secs
const decoder = new TextDecoder()

function decodeMessage(data: Uint8Array): [MessageType, Uint8Array] {
  const msgType = data.at(0) as number
  return [msgType, data.subarray(1)]
}

export async function wsHandler(
  context: HandlerContextWithPath<'logs' | 'config' | 'fetch', '/ws'>
): Promise<IHttpServerComponent.IResponse> {
  const {
    components: { logs, config, fetch }
  } = context
  const logger = logs.getLogger('Websocket Handler')

  const baseUrl = (
    (await config.getString('HTTP_BASE_URL')) || `${context.url.protocol}//${context.url.host}`
  ).toString()
  const path = new URL(baseUrl + context.url.pathname)

  logger.debug('Websocket requested')
  return upgradeWebSocketResponse((socket) => {
    const ws = socket as any as WsUserData
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
          const r = decoder.decode(msgData)
          const headers = JSON.parse(r)
          await verify(context.request.method, path.pathname, headers, {
            fetcher: fetch
          })
          authenticated = true
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
      if (!authenticated && ws.OPEN) {
        logger.debug('Timeout waiting for authentication message')
        ws.end()
      }
    }, authTimeout)
    ws.on('message', waitForAuth)
  })
}
