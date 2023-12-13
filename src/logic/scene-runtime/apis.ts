import { serializeCrdtMessages } from './logger'
import {contentFetchBaseUrl, sdk6FetchComponent, sdk6SceneContent} from "../sceneFetcher";

export const LoadableApis = {
  EnvironmentApi: {
    isPreviewMode: async () => ({ isPreview: false })
  },
  EngineApi: {
    sendBatch: async () => ({ events: [] }),
    
    // TODO: read main.crdt file and inject it here (to support editor-made scenes)
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
    },
    // readFile is needed for the adaption-layer bridge to run SDK6 scenes as an SDK7 scene
    readFile: async ({ fileName }: { fileName: String }) => {
      const fileHash = sdk6SceneContent.find(({ file }: any) => file === fileName).hash
      const res = await sdk6FetchComponent.fetch(`${contentFetchBaseUrl}${fileHash}`)
      return {
        content: await res.arrayBuffer()
      }
    }
  }
}