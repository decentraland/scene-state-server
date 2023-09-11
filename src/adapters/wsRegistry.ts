import { IBaseComponent } from '@well-known-components/interfaces'
import { AppComponents, WebSocket } from '../types'

export type IWSRegistryComponent = IBaseComponent & {
  onWsConnected(ws: WebSocket): void
  getCount(): number
}

export function createWSRegistry({ metrics }: Pick<AppComponents, 'metrics'>): IWSRegistryComponent {
  const registry = new Set<WebSocket>()

  function onWsConnected(ws: WebSocket): void {
    metrics.observe('scene_state_server_connection_count', {}, registry.size)
    registry.add(ws)
    ws.on('close', () => {
      registry.delete(ws)
      metrics.observe('scene_state_server_connection_count', {}, registry.size)
    })
  }

  function getCount(): number {
    return registry.size
  }

  return {
    onWsConnected,
    getCount
  }
}
