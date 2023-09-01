import { readFileSync } from 'fs'

export function localSceneJs(scenePath: string) {
  const sourceCode = readFileSync(scenePath, 'utf-8')
  return sourceCode
}
