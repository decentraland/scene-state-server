import { AppComponents } from '../types'
import { createPreviewComponent, IPreviewComponent } from './preview'
import { runScene, SceneExecutionController } from '../logic/scene-runtime'
import { fetchScene } from '../logic/scene-fetcher'

export type ISceneComponent = {
  stop(): Promise<void>
  start(pointers: [number, number]): Promise<void>
  reload(): Promise<void>
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
  let preview: IPreviewComponent

  async function isPreviewEnabled(): Promise<boolean> {
    return !!(await config.getString('PREVIEW_PATH'))
  }

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

  async function loadScene(): Promise<void> {
    const MAX_RETRIES = 3
    
    try {
      logger.log(`Loading scene from URL: ${baseUrl}`)
      
      await withRetry(async () => {
        await fetchScene({ fetch, logs }, baseUrl, pointers.join(','))
      }, MAX_RETRIES)

      // Stop any existing scene execution
      if (sceneExecutionController) {
        sceneExecutionController.abort()
      }

      // Run the scene using the scene executor
      // sceneExecutionController = await runScene(hash, sourceCode, { logger })
      
      logger.log(`Scene loaded successfully from URL: ${baseUrl} / ${[pointers.join(', ')]}`)
    } catch (e: any) {
      logger.error(new Error(`Failed to load scene after ${MAX_RETRIES} attempts: ${createFriendlyErrorMessage(e, baseUrl)}`))
    }
  }

  async function start(_pointers: [number, number]) {
    pointers = _pointers
    await loadScene()
    // Set up preview if enabled
    if (await isPreviewEnabled()) {
      preview = await createPreviewComponent({ logs, config, fetch, metrics })
      await preview.start({ reload })
    }
  }

  async function stop() {
    if (sceneExecutionController) {
      sceneExecutionController.abort()
      sceneExecutionController = undefined
    }
    await preview?.stop()
  }

  async function reload() {
    logger.log(`Reloading scene with hash: `)
    await loadScene()
  }

  return {
    start,
    reload,
    stop
  }
}
