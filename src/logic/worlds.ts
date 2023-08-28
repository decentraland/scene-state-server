import { IFetchComponent } from '@well-known-components/interfaces'

async function getJson(fetch: IFetchComponent, url: string) {
  const res = await fetch.fetch(url)
  return res.json()
}

type Content = {
  file: string
  hash: string
}

export async function getGameData(fetch: IFetchComponent, worldServerUrl: string, worldName: string): Promise<string> {
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
  return res.text()
}
