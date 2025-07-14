import { WebSocket } from 'ws'
import {
  WsSceneMessage,
  UpdateModelType
} from '@dcl/protocol/out-js/decentraland/sdk/development/local_development.gen'

import { AppComponents } from '../types'
import { ISceneComponent } from './scene'

interface WebSocketMessage {
  type: string
  [key: string]: any
}

export type IPreviewComponent = {
  /**
   * Clean up resources used by preview features
   * If not in preview mode, this does nothing
   */
  stop(): Promise<void>
}

export async function localPreviewHandler(
  components: Pick<AppComponents, 'logs' | 'config' | 'fetch' | 'metrics'>,
  reloadScene: () => Promise<void>
): Promise<IPreviewComponent> {
  const { logs, config } = components
  const logger = logs.getLogger('preview')
  const baseUrl = await config.getString('BASE_URL') || 'http://localhost:8000'
  const { port } = new URL(baseUrl)

  let wsConnection: WebSocket | null = null
  const sceneName = 'preview' // Default scene name
  
  await start()

  async function start(): Promise<void> {
    logger.log(`Starting to watch scene: ${sceneName} on port ${port}`)

    try {
      wsConnection = new WebSocket(`ws://localhost:${port}`)
      wsConnection.on('open', () => {
        logger.log(`Connected to development server for scene: ${sceneName}`)
      })


      wsConnection.on('message', async (data: Buffer) => {
        try {
          const { message } = WsSceneMessage.decode(data)
          
          // TODO what happens if we change a model ?
          if (message?.$case === 'updateScene') {
            logger.log(`Change detected for scene: ${sceneName}, reloading...`)
            await reloadScene()
          }
        } catch (error: any) {
          // logger.error(`Error handling message for scene ${sceneName}: ${error.message}`)
        }
      })

      wsConnection.on('error', (error: Error) => {
        logger.error(`WebSocket error for scene ${sceneName}:`)
        logger.error(error.message)
      })

      wsConnection.on('close', () => {
        logger.log(`Connection closed for scene: ${sceneName}`)
      })
    } catch (error) {
      logger.error(`Failed to start watching scene ${sceneName}:`)
      logger.error(String(error))
    }
  }

  async function shutdown(): Promise<void> {
    if (!wsConnection) {
      return
    }

    logger.log('Shutting down preview features')
    
    if (wsConnection && wsConnection.OPEN) {
      logger.log(`Stopping watcher for scene: ${sceneName}`)
      wsConnection.close()
      wsConnection = null
    }
  }

  return {
    stop: shutdown
  }
}
