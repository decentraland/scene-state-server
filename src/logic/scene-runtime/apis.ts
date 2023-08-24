import { getSceneClient } from '../../adapters/scene'

export const LoadableApis = {
  EnvironmentAPI: {},
  EngineApi: {
    crdtGetState: () => ({ hasEntities: false, data: [] }),
    crdtSendToRenderer: () => ({ data: [] }),
    crdtSendNetwork: (req: { data: Uint8Array }) => {
      const sceneClient = getSceneClient()
      if (!sceneClient) return { data: [] }
      sceneClient.send(req.data)
      return { data: sceneClient.getMessages() }
    },
    sendBatch: () => ({ events: [] }),
    isServer: () => ({ isServer: true })
  },
  SignedFetch: {
    getHeaders: () => ({})
  }
}
