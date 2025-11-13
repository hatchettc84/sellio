import { VapiClient } from '@vapi-ai/server-sdk'
import jwt from 'jsonwebtoken'

// Lazy initialization to avoid build-time errors when VAPI_PRIVATE_KEY is not available
let vapiServerInstance: VapiClient | null = null

export const getVapiServer = (): VapiClient => {
  if (!vapiServerInstance) {
    // Define the payload
    const payload = {
      orgId: process.env.VAPI_ORG_ID,
      token: {
        // This is the scope of the token
        tag: 'private',
      },
    }

    // Get the private key from environment variables
    const key = process.env.VAPI_PRIVATE_KEY
    if (!key) {
      throw new Error('VAPI_PRIVATE_KEY is not set')
    }

    // Define token options
    const options = {
      expiresIn: 2800, // 1 hour in seconds
    }

    // Generate the token using a JWT library or built-in functionality
    const token = jwt.sign(payload, key, options)

    vapiServerInstance = new VapiClient({ token: token })
  }
  return vapiServerInstance
}

// Note: Use getVapiServer() instead of importing vapiServer directly
// This ensures lazy initialization and prevents build-time errors
