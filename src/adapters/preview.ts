import { WebSocket } from 'ws'
import { AppComponents } from '../types'
import { ISceneComponent } from './scene'

interface WebSocketMessage {
  type: string
  [key: string]: any
}

type Scene = Pick<ISceneComponent, 'reload'>

export type IPreviewComponent = {
  /**
   * Initialize preview features if configured
   * If not in preview mode (PREVIEW_PATH not set), this does nothing
   */
  start(scene: Scene): Promise<WebSocket | null>

  /**
   * Clean up resources used by preview features
   * If not in preview mode, this does nothing
   */
  stop(): Promise<void>
}

export async function createPreviewComponent(
  components: Pick<AppComponents, 'logs' | 'config' | 'fetch' | 'metrics'>
): Promise<IPreviewComponent> {
  const { logs, config } = components
  const logger = logs.getLogger('preview')

  let wsConnection: WebSocket | null = null
  const sceneName = 'preview' // Default scene name

  async function startWatcher(scene: Scene): Promise<void> {
    const port = await config.getNumber('PREVIEW_PORT')

    logger.log(`Starting to watch scene: ${sceneName} on port ${port}`)

    try {
      wsConnection = new WebSocket(`ws://localhost:${port}`)
      wsConnection.on('open', () => {
        logger.log(`Connected to development server for scene: ${sceneName}`)
      })

      wsConnection.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as WebSocketMessage
          if (message.type === 'reload' || message.type === 'change') {
            logger.log(`Change detected for scene: ${sceneName}, reloading...`)
            await scene.reload()
          }
        } catch (error) {
          logger.error(`Error handling message for scene ${sceneName}:`)
          logger.error(String(error))
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

  async function stopWatcher(): Promise<void> {
    if (wsConnection && wsConnection.OPEN) {
      logger.log(`Stopping watcher for scene: ${sceneName}`)
      wsConnection.close()
      wsConnection = null
    }
  }

  async function isPreviewEnabled(): Promise<boolean> {
    return !!(await config.getString('PREVIEW_PATH'))
  }

  async function initialize(scene: Scene): Promise<WebSocket | null> {
    // Check if preview is enabled
    const isEnabled = await isPreviewEnabled()
    if (!isEnabled) {
      return null
    }

    const localPath = await config.getString('PREVIEW_PATH')
    logger.log(`Preview mode active with scene path: ${localPath}`)

    // Start WebSocket watcher if port is configured
    await startWatcher(scene)
    return wsConnection!
  }

  async function shutdown(): Promise<void> {
    if (!wsConnection) {
      return
    }

    logger.log('Shutting down preview features')
    await stopWatcher()
  }

  return {
    start: initialize,
    stop: shutdown
  }
}
