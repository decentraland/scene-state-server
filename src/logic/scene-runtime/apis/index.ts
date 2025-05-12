export const LoadableApis = {
  EnvironmentAPI: {},
  EngineApi: {
    sendBatch: async () => ({ events: [] }),
    crdtGetState: async () => ({ hasEntities: false, data: [] }),
    crdtSendToRenderer: async () => ({ data: [] }),

    // TBD:
    // crdtSendNetwork: async (req: { data: Uint8Array; clientId: string }) => {
    //   const sceneClient = getSceneClient(req.clientId)
    //   if (!sceneClient) return Promise.resolve({ data: [] })
    //   sceneClient.send(req.data)
    //   return Promise.resolve({ data: sceneClient.getMessages() })
    // },
    isServer: async () => ({ isServer: true })
  },
  UserIdentity: {
    getUserData: async () => ({})
  },
  SignedFetch: {
    getHeaders: async () => ({})
  },
  Runtime: {
    getRealm: () => {
      return { realmInfo: { isPreview: false } }
    }
  }
}
