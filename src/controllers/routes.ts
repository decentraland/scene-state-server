import { Router } from '@well-known-components/http-server'
import { GlobalContext } from '../types'
import { pingHandler } from './handlers/ping-handler'
import { wsHandler } from './handlers/ws-handler'
import { statusHandler } from './handlers/status-handler'
import { reloadHandler } from './handlers/debugging-handler'
import { errorHandler } from './handlers/error-handler'

// We return the entire router because it will be easier to test than a whole server
export async function setupRouter(_globalContext: GlobalContext): Promise<Router<GlobalContext>> {
  const router = new Router<GlobalContext>()
  router.use(errorHandler)

  router.get('/ping', pingHandler)
  router.get('/ws/:scene', wsHandler)
  router.get('/status', statusHandler)
  router.post('/debugging/reload', reloadHandler)

  return router
}
