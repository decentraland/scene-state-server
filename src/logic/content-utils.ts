import { IFetchComponent } from '@well-known-components/interfaces'

export type Content = {
  file: string
  hash: string
}

export type SceneMetadata = {
  main: string
  [key: string]: any
}

export type SceneData = {
  metadata: SceneMetadata
  content: Content[]
}

export async function getFileFromContent(
  fetch: IFetchComponent,
  baseUrl: string,
  content: Content[],
  fileName: string
): Promise<string> {
  const fileEntry = content.find(({ file }: Content) => file === fileName)
  
  if (!fileEntry) {
    throw new Error(`Cannot find file "${fileName}" in content array`)
  }
  const res = await fetch.fetch(`${baseUrl}${fileEntry.hash}`)
  return res.text()
}
