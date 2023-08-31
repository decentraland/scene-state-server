import { HandlerContextWithPath } from '../../types'

export async function reloadHandler(
  context: Pick<HandlerContextWithPath<'config' | 'scene', '/debugging/reload'>, 'url' | 'components'>
) {
  const { scene } = context.components
  scene.reload().catch(console.error)
  return {
    status: 204,
    body: {}
  }
}
