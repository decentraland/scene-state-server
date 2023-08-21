import { Lifecycle } from '@well-known-components/interfaces'
import EthCrypto from 'eth-crypto'
import { setupRouter } from './controllers/routes'
import { AppComponents, GlobalContext, TestComponents } from './types'
import { Authenticator } from '@dcl/crypto'
import RequestManager from 'eth-connect'

// this function wires the business logic (adapters & controllers) with the components (ports)
export async function main(program: Lifecycle.EntryPointParameters<AppComponents | TestComponents>) {
  const { components, startComponents } = program
  const globalContext: GlobalContext = {
    components
  }

  // wire the HTTP router (make it automatic? TBD)
  const router = await setupRouter(globalContext)
  // register routes middleware
  components.server.use(router.middleware())
  // register not implemented/method not allowed/cors responses middleware
  components.server.use(router.allowedMethods())
  // set the context to be passed to the handlers
  components.server.setContext(globalContext)

  // start ports: db, listeners, synchronizations, etc
  await startComponents()

  const { config, logs, provider } = components
  const logger = logs.getLogger('main')

  const [worldContentServerUrl, privateKey] = await Promise.all([
    config.requireString('WORLD_CONTENT_SERVER_URL'),
    config.requireString('PRIVATE_KEY')
  ])

  logger.log(`using: ${worldContentServerUrl}`)

  const publicKey = EthCrypto.publicKeyByPrivateKey(privateKey)
  const address = EthCrypto.publicKey.toAddress(publicKey)

  const payload = {
    address,
    privateKey,
    publicKey
  }
  console.log(payload)

  const rm = new RequestManager(provider)
  const ephemeralLifespanMinutes = 10_000
  const identity = await Authenticator.initializeAuthChain(
    address,
    payload,
    ephemeralLifespanMinutes,
    (message: string) => rm.personal_sign(message, address, '')
  )

  console.log(identity)
}
