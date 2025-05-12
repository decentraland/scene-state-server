import { AuthChain, Authenticator, AuthIdentity } from '@dcl/crypto'
import { AppComponents } from '../../types'
import { RequestOptions } from '@well-known-components/interfaces'

const AUTH_CHAIN_HEADER_PREFIX = 'x-identity-auth-chain-'
const AUTH_TIMESTAMP_HEADER = 'x-identity-timestamp'
const AUTH_METADATA_HEADER = 'x-identity-metadata'

export function getAuthChainSignature(
  method: string,
  path: string,
  metadata: string,
  chainProvider: (payload: string) => AuthChain
) {
  const timestamp = Date.now()
  const payloadParts = [method.toLowerCase(), path.toLowerCase(), timestamp.toString(), metadata]
  const payloadToSign = payloadParts.join(':').toLowerCase()
  const authChain = chainProvider(payloadToSign)

  return {
    authChain,
    metadata,
    timestamp
  }
}

export function getSignedHeaders(
  method: string,
  path: string,
  metadata: Record<string, any>,
  chainProvider: (payload: string) => AuthChain
) {
  const headers: Record<string, string> = {}
  const signature = getAuthChainSignature(method, path, JSON.stringify(metadata), chainProvider)
  signature.authChain.forEach((link, index) => {
    headers[`${AUTH_CHAIN_HEADER_PREFIX}${index}`] = JSON.stringify(link)
  })

  headers[AUTH_TIMESTAMP_HEADER] = signature.timestamp.toString()
  headers[AUTH_METADATA_HEADER] = signature.metadata
  return headers
}

export function signedFetch(
  components: Pick<AppComponents, 'fetch'>,
  url: string,
  identity: AuthIdentity,
  init?: RequestOptions,
  additionalMetadata: Record<string, any> = {}
) {
  const path = new URL(url).pathname
  const actualInit = {
    ...init,
    headers: {
      ...getSignedHeaders(
        init?.method ?? 'get',
        path,
        {
          origin: location.origin,
          body: init?.body ? (typeof init.body === 'string' ? init.body : JSON.stringify(init.body)) : '',
          ...additionalMetadata
        },
        (payload) => Authenticator.signPayload(identity, payload)
      ),
      ...init?.headers
    }
  } as RequestOptions
  console.log('[BOEDO] body', init?.body, actualInit, init?.headers, additionalMetadata)
  return components.fetch.fetch(url, actualInit)
}
