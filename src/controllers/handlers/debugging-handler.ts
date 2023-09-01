import { createSceneComponent } from '../../adapters/scene'
import { AppComponents, HandlerContextWithPath } from '../../types'

async function loadOrReload(
  { scenes, logs, config, fetch }: Pick<AppComponents, 'scenes' | 'logs' | 'config' | 'fetch'>,
  name: string
) {
  const logger = logs.getLogger('debugging')
  try {
    let scene = scenes.get(name)
    if (scene) {
      await scene.stop()
    } else {
      scene = await createSceneComponent({ logs, config, fetch })
      scenes.set(name, scene)
    }
    await scene.start()
  } catch (err: any) {
    logger.error(err)
  }
}

export async function reloadHandler(
  context: HandlerContextWithPath<'scenes' | 'logs' | 'config' | 'fetch', '/debugging/load'>
) {
  const { config } = context.components

  const secret = await config.requireString('DEBUGGING_SECRET')
  const body = await context.request.json()
  if (body.secret !== secret) {
    return {
      status: 401,
      body: {
        error: 'Not authorized'
      }
    }
  }

  if (!body.name) {
    return {
      status: 400,
      body: {
        error: 'Missing scene name'
      }
    }
  }

  loadOrReload(context.components, body.name).catch(console.error)
  return {
    status: 204
  }
}
