import { AppComponents } from '../types'
import { localPreviewHandler, IPreviewComponent } from './local-preview'
import { runScene, SceneExecutionController } from '../logic/scene-runtime'
import { fetchScene } from '../logic/scene-fetcher'

export type ISceneComponent = {
  stop(): Promise<void>
  start(pointers: [number, number]): Promise<void>
}

export async function createSceneComponent({
  logs,
  fetch,
  config,
  metrics
}: Pick<AppComponents, 'logs' | 'metrics' | 'fetch' | 'config'>): Promise<ISceneComponent> {
  const logger = logs.getLogger('scene')
  const baseUrl = await config.getString('BASE_URL') || 'http://localhost:8000'
  let pointers: [number, number]
  let sceneExecutionController: SceneExecutionController | undefined
  let localPreviewServer: IPreviewComponent

  async function withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    currentAttempt: number = 1,
    baseDelay: number = 1000
  ): Promise<T> {
    try {
      return await operation()
    } catch (error: any) {
      if (currentAttempt >= maxRetries) {
        throw error
      }
      
      const delay = baseDelay * Math.pow(2, currentAttempt - 1)
      logger.warn(`Attempt ${currentAttempt} failed. Retrying in ${delay}ms...`)
      
      await new Promise(resolve => setTimeout(resolve, delay))
      return withRetry(operation, maxRetries, currentAttempt + 1, baseDelay)
    }
  }

  function createFriendlyErrorMessage(error: any, sceneUrl: string): string {
    const errorMessage = error.message || 'Unknown error'
    if (errorMessage.includes('request to')) {
      return `Unable to connect to scene server. Please check that the scene preview is running. (URL: ${sceneUrl})`
    }
    console.log('aca entro')
    return `${errorMessage} (URL: ${sceneUrl})`
  }

  async function loadAndRunScene(): Promise<void> {
    const MAX_RETRIES = 3
    
    try {
      logger.log(`Loading scene from URL: ${baseUrl}`)
      
      // Stop any existing scene execution
      if (sceneExecutionController?.isRunning) {
        sceneExecutionController.abort()
      }

      await withRetry(async () => {
        const sourceCode = await fetchScene({ fetch, logs }, baseUrl, pointers.join(','))
        if (sourceCode) {
          // Run the scene using the scene executor
          sceneExecutionController = await runScene(sourceCode, { logger })
        }
      }, MAX_RETRIES)


      
      logger.log(`Scene loaded successfully from URL: ${baseUrl} / ${[pointers.join(', ')]}`)
    } catch (e: any) {
      logger.error(new Error(`Failed to load scene after ${MAX_RETRIES} attempts: ${createFriendlyErrorMessage(e, baseUrl)}`))
    }
  }

  async function start(_pointers: [number, number]) {
    pointers = _pointers
    await loadAndRunScene()
    // Set up preview if enabled
    if (baseUrl.includes('localhost')) {
      localPreviewServer = await localPreviewHandler({ logs, config, fetch, metrics }, loadAndRunScene)
    }
  }

  async function stop() {
    if (sceneExecutionController) {
      sceneExecutionController.abort()
      sceneExecutionController = undefined
    }
    await localPreviewServer?.stop()
  }

  return {
    start,
    stop
  }
}
