import { HandlerContextWithPath } from '../../types'

export async function statusHandler(
  context: Pick<HandlerContextWithPath<'config' | 'wsRegistry', '/status'>, 'url' | 'components'>
) {
  const { config, wsRegistry } = context.components
  return {
    body: {
      commitHash: await config.getString('COMMIT_HASH'),
      connections: wsRegistry.getCount()
    }
  }
}
