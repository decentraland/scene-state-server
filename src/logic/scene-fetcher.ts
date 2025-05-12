import { IFetchComponent } from '@well-known-components/interfaces'
import { readFileSync } from 'fs'
import { AppComponents } from '../types'

async function getJson(fetch: IFetchComponent, url: string) {
  const res = await fetch.fetch(url)
  return res.json()
}

type Content = {
  file: string
  hash: string
}

const URLs = (baseUrl: string) => ({
  sceneContent: `${baseUrl}/content/entities/active`
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

export async function fetchScene({ fetch }: Pick<AppComponents, 'fetch'>, baseUrl: string, pointers: string[]) {
  const sceneContent = await fetch.fetch(URLs(baseUrl).sceneContent, {
    method: 'POST',
    body: JSON.stringify({ pointers })
  })
  console.log(await sceneContent.json())
}
