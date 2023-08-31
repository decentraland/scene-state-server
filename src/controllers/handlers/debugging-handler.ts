import { HandlerContextWithPath } from '../../types'

export async function reloadHandler(context: HandlerContextWithPath<'config' | 'scene', '/debugging/reload'>) {
  const { scene, config } = context.components

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

  scene.reload().catch(console.error)
  return {
    status: 204
  }
}
