import { HandlerContextWithPath } from '../../types'

export async function statusHandler(
  context: Pick<HandlerContextWithPath<'config' | 'wsRegistry', '/status'>, 'url' | 'components'>
) {
  const { config, wsRegistry } = context.components
  const [commitHash, version] = await Promise.all([
    config.getString('COMMIT_HASH'),
    config.getString('CURRENT_VERSION')
  ])
  return {
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: {
      commitHash,
      version,
      currentTime: Date.now(),
      connections: wsRegistry.getCount()
    }
  }
}
