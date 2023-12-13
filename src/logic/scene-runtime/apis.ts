import { serializeCrdtMessages } from './logger'
import { contentFetchBaseUrl, sdk6FetchComponent, sdk6SceneContent } from "../sceneFetcher";
import { writeFileSync, writeFile, WriteFileOptions } from 'fs'

let createdOutput = false
export const LoadableApis = {
  EnvironmentApi: {
    isPreviewMode: async () => ({ isPreview: false })
  },
  EngineApi: {
    sendBatch: async () => ({ events: [] }),
    
    // TODO: read main.crdt file and inject it here (to support editor-made scenes)
    crdtGetState: async () => ({ hasEntities: true, data: [] }),
    
    crdtSendToRenderer: async ({ data }: { data: Uint8Array }) => {
      if (createdOutput || data.length == 0) return
      createdOutput = true
      const outputJSON = JSON.stringify([...serializeCrdtMessages('[msg]: ', data)], null, 2)
      writeFile('output.json', outputJSON,
          err => {
            if (err) {
              console.log(err)
            }
          })
      console.log(outputJSON)
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