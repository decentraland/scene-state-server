import { readFileSync } from 'fs'
import path from 'path'

export function testGameJs() {
  const scenePath = path.resolve(__dirname, 'game.js').replace('/dist/', '/src/')
  const sourceCode = readFileSync(scenePath, 'utf-8')
  return sourceCode
}
