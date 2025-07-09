import { ILoggerComponent } from "@well-known-components/interfaces"

export async function withRetry<T>(
  logger: ILoggerComponent.ILogger,
  operation: () => Promise<T>,
  opts?: { maxRetries?: number; currentAttempt?: number; baseDelay?: number }
): Promise<T> {
  const maxRetries = opts?.maxRetries ?? 3
  const currentAttempt = opts?.currentAttempt ?? 1
  const delay = opts?.baseDelay ?? 1000
  try {
    return await operation()
  } catch (error: any) {
    if (currentAttempt >= maxRetries) {
      throw error
    }
    
    const newDelay = delay * Math.pow(2, currentAttempt - 1)
    logger.warn(`Attempt ${currentAttempt} failed. Retrying in ${newDelay}ms...`)
    
    await new Promise(resolve => setTimeout(resolve, newDelay))
    return withRetry(logger, operation, { maxRetries, currentAttempt: currentAttempt + 1, baseDelay: delay })
  }
}
