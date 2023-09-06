import { createSceneComponent } from '../../adapters/scene'
import { getGameDataFromLocalScene, getGameDataFromWorld } from '../../logic/sceneFetcher'
import { AppComponents, BadRequestError, HandlerContextWithPath, NotAuthorizedError } from '../../types'

export async function loadOrReload(
  { scenes, logs, config, fetch }: Pick<AppComponents, 'scenes' | 'logs' | 'config' | 'fetch'>,
  name: string
) {
  const logger = logs.getLogger('scene-control')
  let scene = scenes.get(name)
  if (scene) {
    logger.log(`stopping ${name}`)
    await scene.stop()
    scenes.delete(name)
  }

  let sourceCode: string
  if (name === 'localScene') {
    const path = await config.requireString('LOCAL_SCENE_PATH')
    sourceCode = await getGameDataFromLocalScene(path)
  } else {
    const worldServerUrl = await config.requireString('WORLD_SERVER_URL')
    sourceCode = await getGameDataFromWorld(fetch, worldServerUrl, name)
  }

  scene = await createSceneComponent({ logs })
  scenes.set(name, scene)
  logger.log(`${name} source code loaded, starting scene`)

  scene.start(sourceCode).catch(logger.error)
}

export async function reloadHandler(
  context: HandlerContextWithPath<'scenes' | 'logs' | 'config' | 'fetch', '/debugging/load'>
) {
  const { config } = context.components

  const secret = await config.requireString('DEBUGGING_SECRET')
  const body = await context.request.json()

  if (body.secret !== secret) {
    throw new NotAuthorizedError('Not authorized')
  }

  if (!body.name) {
    throw new BadRequestError('Missing scene name')
  }

  try {
    await loadOrReload(context.components, body.name)
  } catch (err: any) {
    throw new BadRequestError(err.message)
  }

  return {
    status: 204
  }
}
