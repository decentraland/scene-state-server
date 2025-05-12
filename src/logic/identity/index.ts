import { AuthIdentity, Authenticator } from '@dcl/crypto'

// Default 24h expiration time
const DEFAULT_EXPIRATION_TIME = 24 * 60 * 60

/**
 * Creates a server identity using existing private/public keys
 *
 * @param address - The Ethereum address
 * @param privateKey - The private key (with 0x prefix)
 * @param publicKey - The public key (with 0x prefix)
 * @param expiration - TTL in seconds (defaults to 24 hours)
 * @returns A promise that resolves to an AuthIdentity
 */
export async function createServerIdentityFromKeys(
  address: string,
  privateKey: string,
  publicKey: string,
  expiration: number = DEFAULT_EXPIRATION_TIME
): Promise<AuthIdentity> {
  // Ensure address is lowercase
  const normalizedAddress = address.toLowerCase()

  // Create the payload with address, public and private keys
  const payload = {
    address: normalizedAddress,
    privateKey,
    publicKey
  }

  // Use the signMessage function from @dcl/crypto's internal methods
  // This is a wrapper that will use the private key to sign messages
  const signMessage = async (message: string) => {
    // We'll let the Authenticator handle the actual signing process
    // It knows how to properly sign with a private key
    return Authenticator.createSignature(payload, message)
  }

  // Initialize the auth chain
  const identity = await Authenticator.initializeAuthChain(normalizedAddress, payload, expiration, signMessage)

  return identity
}
