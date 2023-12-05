import { serializeCrdtMessages } from './logger'

export const LoadableApis = {
  EnvironmentAPI: {},
  EngineApi: {
    sendBatch: async () => ({ events: [] }),
    // TODO: read main.crdt file and put it here (a.k.a composite.json)
    crdtGetState: async () => ({ hasEntities: true, data: [] }),
    crdtSendToRenderer: async ({ data }: { data: Uint8Array }) => {
      console.log(JSON.stringify([...serializeCrdtMessages('[msg]: ', data)], null, 2))
      return { data: [] }
    },
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