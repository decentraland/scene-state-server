import { createSceneComponent } from '../../adapters/scene'
import { getGameDataFromLocalScene, getGameDataFromRemoteScene } from '../../logic/sceneFetcher'
import { AppComponents } from '../../types'

export async function loadOrReload(
  { scenes, logs, config, fetch, metrics }: Pick<AppComponents, 'metrics' | 'scenes' | 'logs' | 'config' | 'fetch'>,
  name: string
) {
  const logger = logs.getLogger('scene-control')
  let scene = scenes.get(name)
  if (scene) {
    logger.log(`stopping ${name}`)
    await scene.stop()
    scenes.delete(name)
  }

  let hash: string
  let sourceCode: string
  if (name === 'localScene') {
    const path = await config.requireString('LOCAL_SCENE_PATH')
    sourceCode = await getGameDataFromLocalScene(path)
    hash = 'localScene'
  } else {
    const sceneCoords = await config.requireString('REMOTE_SCENE_COORDS')
    sourceCode = await getGameDataFromRemoteScene(fetch, sceneCoords)
    hash = 'remoteScene'
  }

  scene = await createSceneComponent({ logs, metrics })
  scenes.set(name, scene)
  logger.log(`${name} source code loaded, starting scene`)

  scene.start(hash, sourceCode).catch(logger.error)
}
