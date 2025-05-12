import { AuthIdentity, Authenticator } from '@dcl/crypto'
import { createUnsafeIdentity } from '@dcl/crypto/dist/crypto'

/**
 * Creates an ephemeral development identity using Decentraland's createUnsafeIdentity
 * DO NOT USE IN PRODUCTION - this is for development only
 *
 * @param expiration - TTL in seconds (defaults to 1 hour)
 * @returns A promise that resolves to an AuthIdentity
 */
export async function createDevIdentity(expiration: number = 1000 * 60 * 60 * 24): Promise<AuthIdentity> {
  // Use DCL's createUnsafeIdentity to generate an identity
  // This creates a proper Ethereum keypair internally
  const unsafeIdentity = createUnsafeIdentity()

  console.log('⚠️  DEVELOPMENT IDENTITY CREATED - NOT SECURE ⚠️')
  console.log('Address:', unsafeIdentity.address)
  console.log('Expiration:', new Date(Date.now() + expiration).toISOString())

  // Create the payload for the auth chain
  const payload = {
    address: unsafeIdentity.address,
    publicKey: unsafeIdentity.publicKey,
    privateKey: unsafeIdentity.privateKey
  }

  // Use Authenticator.createSignature for proper signing
  // This is the same approach used in the server-identity.ts file
  const signMessage = async (message: string): Promise<string> => {
    return Authenticator.createSignature(payload, message)
  }

  // Initialize auth chain with the generated identity
  const identity = await Authenticator.initializeAuthChain(unsafeIdentity.address, payload, expiration, signMessage)

  return identity
}

/**
 * Example showing how to use the development identity
 */
export async function devIdentityExample() {
  const identity = await createDevIdentity()

  // Log the identity details (only for development)
  console.log('DEV IDENTITY:', {
    address: identity.authChain[0].payload,
    ephemeralAddress: identity.ephemeralIdentity.address,
    identity
  })

  return identity
}
