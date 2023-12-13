import { IFetchComponent } from '@well-known-components/interfaces'
import { readFileSync } from 'fs'

async function getJson(fetch: IFetchComponent, url: string) {
  const res = await fetch.fetch(url)
  return res.json()
}

type Content = {
  file: string
  hash: string
}

export async function getGameDataFromWorld(
  fetch: IFetchComponent,
  worldServerUrl: string,
  worldName: string
): Promise<{ sceneHash: string; code: string }> {
  const about = await getJson(fetch, `${worldServerUrl}/world/${worldName}/about`)
  if (!about.healthy) {
    throw new Error(`World content server ${worldServerUrl} is in unhealthy state, cannot download scene data`)
  }

  const sceneUrnAndServer = new URL(about.configurations.scenesUrn[0])
  const sceneHash = sceneUrnAndServer.pathname.split(':')[2]
  const baseUrl = sceneUrnAndServer.searchParams.get('baseUrl')

  const scene = await getJson(fetch, `${baseUrl}${sceneHash}`)

  const { metadata, content } = scene

  const entryPoint = content.find(({ file }: Content) => file === metadata.main)
  if (!entryPoint) {
    throw new Error(`Cannot find entry point for scene`)
  }

  const res = await fetch.fetch(`${baseUrl}${entryPoint.hash}`)
  return { sceneHash, code: await res.text() }
}

export async function getGameDataFromLocalScene(scenePath: string): Promise<string> {
  return readFileSync(scenePath, 'utf-8')
}

export async function getGameDataFromRemoteScene(fetch: IFetchComponent, sceneCoords: string): Promise<string> {
  // TODO: Find out how reliable are these content urls, will they change in the future?
  
  // get scene id
  const mappingsUrl = `https://peer.decentraland.org/content/entities/scene/?pointer=${sceneCoords}`
  let fetchResponse = await fetch.fetch(mappingsUrl)  
  
  const sceneData = (await fetchResponse.json())[0]  
  console.log(`PRAVS - scene id:${sceneData.id} - sdk7? ${sceneData.metadata.ecs7}`)
  
  const contentUrl = 'https://peer.decentraland.org/content/contents/'
  
  // TODO: get main.crdt and use that instead of 
  
  // get scene main file hash (index.js/game.js)
  let sceneMainFileHash = undefined
  for (const asset of sceneData.content) {
    if (asset.file === sceneData.metadata.main) {
      sceneMainFileHash = asset.hash
      break
    }
  }

  if (!sceneMainFileHash) {
    throw new Error(`Cannot scene's main asset file hash`)
  }
  
  fetchResponse = await fetch.fetch(`${contentUrl}${sceneMainFileHash}`)
  
  return await fetchResponse.text()
}
