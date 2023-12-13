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
  const mappingsUrl = `https://peer.decentraland.org/content/entities/active`
  let fetchResponse = await fetch.fetch(mappingsUrl, {
    method: 'post',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pointers: [sceneCoords] })
  })  
  const sceneData = (await fetchResponse.json())[0]  
  console.log(`PRAVS - scene id:${sceneData.id} - sdk7? ${sceneData.metadata.runtimeVersion === '7'}`)
  
  const contentUrl = 'https://peer.decentraland.org/content/contents/'
  
  // TODO: get main.crdt and use that instead of main file
  
  // get scene main file hash (index.js/game.js)
  const sceneMainFileHash = sceneData.content.find(($: any) => $.file === sceneData.metadata.main)?.hash  
  if (!sceneMainFileHash) {
    throw new Error(`Cannot scene's main asset file hash`)
  }

  /*if (sceneData.metadata.runtimeVersion !== '7') {
    fetchResponse = await fetch.fetch(`https://renderer-artifacts.decentraland.org/sdk7-adaption-layer/main/index.js`)
    return await fetchResponse.text()
  }*/
  
  fetchResponse = await fetch.fetch(`${contentUrl}${sceneMainFileHash}`)  
  return await fetchResponse.text()
}
