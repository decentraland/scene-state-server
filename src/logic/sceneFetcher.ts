import { IFetchComponent } from '@well-known-components/interfaces'
import { readFileSync } from 'fs'

export const contentFetchBaseUrl = 'https://peer.decentraland.org/content/contents/'
const mappingsUrl = 'https://peer.decentraland.org/content/entities/active'
const mainCRDTFileName = 'main.crdt'
export let sdk6SceneContent: any
export let sdk6FetchComponent: any
export let mainCrdt: any
export async function getGameDataFromRemoteScene(fetch: IFetchComponent, sceneCoords: string): Promise<string> {  
  // get scene id
  let fetchResponse = await fetch.fetch(mappingsUrl, {
    method: 'post',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pointers: [sceneCoords] })
  })
  const sceneData = (await fetchResponse.json())[0]  
  console.log(`Fetched scene data - scene id:${sceneData.id} - sdk7? ${sceneData.metadata.runtimeVersion === '7'}`)

  // SDK6 scenes support
  if (sceneData.metadata.runtimeVersion !== '7') {
    // sdk6 scene content will be later read by the adaption-layer internally using the Runtime.readFile API
    sdk6SceneContent = sceneData.content
    sdk6FetchComponent = fetch

    fetchResponse = await fetch.fetch(`https://renderer-artifacts.decentraland.org/sdk7-adaption-layer/main/index.js`)
    return await fetchResponse.text()
  }

  // SDK7 editor-made scenes support (main.crdt binary file)
  const sceneMainCRDTFileHash = sceneData.content.find(($: any) => $.file === mainCRDTFileName)?.hash
  if (sceneMainCRDTFileHash) {
    fetchResponse = await fetch.fetch(`${contentFetchBaseUrl}${sceneMainCRDTFileHash}`)
    mainCrdt = new Uint8Array(await fetchResponse.arrayBuffer())
  }
  
  // Get SDK7 scene main file (index.js/game.js)
  const sceneMainFileHash = sceneData.content.find(($: any) => $.file === sceneData.metadata.main)?.hash
  if (!sceneMainFileHash) {
    throw new Error(`Cannot find scene's main asset file hash`)
  }
  fetchResponse = await fetch.fetch(`${contentFetchBaseUrl}${sceneMainFileHash}`)
  
  return await fetchResponse.text()
}

// Local scenes mode only supports SDK7 scenes for now
export async function getGameDataFromLocalScene(scenePath: string): Promise<string> {
  return readFileSync(scenePath, 'utf-8')
}
