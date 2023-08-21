import { IBaseComponent } from '@well-known-components/interfaces'
import { Room } from 'livekit-client'
import { AppComponents } from '../types'

export type CommsAdapter = IBaseComponent & {}

export type CommsConfig = {
  livekitUrl: string
  livekitToken: string
}

export function createCommsAdapter({ logs }: Pick<AppComponents, 'logs'>, { livekitUrl, livekitToken }: CommsConfig) {
  const logger = logs.getLogger('comms')
  const room = new Room()

  async function start() {
    await room.connect(livekitUrl, livekitToken)
    logger.log('Connected to livekit')
  }

  return {
    start
  }
}
