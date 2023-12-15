import { createSceneComponent } from '../adapters/scene'
import { getGameDataFromLocalScene, getGameDataFromRemoteScene } from '../logic/sceneFetcher'
import { BaseComponents } from '../types'

export async function loadOrReload({ config, fetch }: BaseComponents, name: string) {
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

  const scene = await createSceneComponent()
  console.log(`${name} source code loaded, starting scene`)

  scene.start(hash, sourceCode).catch(console.error)
}
