import { IFetchComponent } from '@well-known-components/interfaces'
import { readFileSync } from 'fs'
import { AppComponents } from '../types'
import { getFileFromContent, SceneData } from './content-utils'
import { tryCatch } from './try-catch'

async function getJson(fetch: IFetchComponent, url: string) {
  const res = await fetch.fetch(url)
  return res.json()
}

const getURLs = (baseUrl: string) => ({
  sceneContent: `${baseUrl}/content/entities/active`,
  getFile: `${baseUrl}/content/contents/`
})

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
  const baseUrl = sceneUrnAndServer.searchParams.get('baseUrl')!

  const scene: SceneData = await getJson(fetch, `${baseUrl}${sceneHash}`)

  const code = await getFileFromContent(fetch, baseUrl, scene.content, scene.metadata.main)
  return { sceneHash, code }
}

export async function getGameDataFromLocalScene(scenePath: string): Promise<string> {
  return readFileSync(scenePath, 'utf-8')
}

export async function fetchScene({ fetch, logs }: Pick<AppComponents, 'fetch' | 'logs'>, baseUrl: string, pointers: string) {
  const log = logs.getLogger('[fetchScene]')
  
  try {
    const sceneContent = await fetch.fetch(getURLs(baseUrl).sceneContent, {
      method: 'POST',
      body: JSON.stringify({ pointers: [pointers] })
    })
    const scene: SceneData = (await sceneContent.json())[0]

    const mainFileContent = await getFileFromContent(fetch, getURLs(baseUrl).getFile, scene.content, scene.metadata.main)
    
  } catch(e: any) {
    log.error("Failed to fetch index.js file", e.message as any)
  }
}
