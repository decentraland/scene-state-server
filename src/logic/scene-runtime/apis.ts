import { getConnectedClients, getSceneClient } from '../../adapters/scene'

export const LoadableApis = {
  EnvironmentAPI: {},
  EngineApi: {
    sendBatch: async () => ({ events: [] }),
    crdtGetState: async () => ({ hasEntities: false, data: [] }),
    crdtSendToRenderer: async () => ({ data: [] }),

    // TBD:
    crdtSendNetwork: async (req: { data: Uint8Array; clientId: string }) => {
      const sceneClient = getSceneClient(req.clientId)
      if (!sceneClient) return Promise.resolve({ data: [] })
      sceneClient.send(req.data)
      return Promise.resolve({ data: sceneClient.getMessages() })
    },

    // TODO: remove clients
    isServer: async () => ({ isServer: true, clients: getConnectedClients() })
  },
  SignedFetch: {
    getHeaders: async () => ({})
  }
}
