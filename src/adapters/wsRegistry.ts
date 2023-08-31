import { IBaseComponent } from '@well-known-components/interfaces'
import { WebSocket } from '../types'

export type IWSRegistryComponent = IBaseComponent & {
  onWsConnected(ws: WebSocket): void
  getCount(): number
}

export function createWSRegistry(): IWSRegistryComponent {
  const registry = new Set<WebSocket>()

  function onWsConnected(ws: WebSocket): void {
    registry.add(ws)
    ws.on('close', () => {
      registry.delete(ws)
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
