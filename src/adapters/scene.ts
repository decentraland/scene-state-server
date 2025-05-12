import { AppComponents } from '../types'
import { createPreviewComponent, IPreviewComponent } from './preview'
import { runScene, SceneExecutionController } from '../logic/scene-runtime'
import { fetchScene } from '../logic/scene-fetcher'

export type ISceneComponent = {
  stop(): Promise<void>
  start(url: string): Promise<void>
  reload(): Promise<void>
}

export async function createSceneComponent({
  logs,
  fetch,
  config,
  metrics
}: Pick<AppComponents, 'logs' | 'metrics' | 'fetch' | 'config'>): Promise<ISceneComponent> {
  const logger = logs.getLogger('scene')

  let sceneExecutionController: SceneExecutionController | undefined
  let url: string
  let preview: IPreviewComponent

  async function isPreviewEnabled(): Promise<boolean> {
    return !!(await config.getString('PREVIEW_PATH'))
  }

  async function loadScene(): Promise<void> {
    try {
      logger.log(`Loading scene from URL: ${url}`)
      await fetchScene({ fetch }, 'http://localhost:8000', ['23,-24'])

      // Stop any existing scene execution
      if (sceneExecutionController) {
        sceneExecutionController.abort()
      }

      // Run the scene using the scene executor
      // sceneExecutionController = await runScene(hash, sourceCode, { logger })
    } catch (e: any) {
      logger.error(`Error loading scene from URL ${url}: ${e.message}`)
      throw e
    }
  }

  async function start(_url: string) {
    url = _url
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
