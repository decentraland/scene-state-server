import { IHttpServerComponent } from '@well-known-components/interfaces'
import { BadRequestError, NotAuthorizedError, NotFoundError } from '../../types'

function handleError(ctx: IHttpServerComponent.DefaultContext<object>, error: any): IHttpServerComponent.IResponse {
  if (error instanceof BadRequestError) {
    return {
      status: 400,
      body: {
        error: error.message
      }
    }
  }

  if (error instanceof NotFoundError) {
    return {
      status: 404,
      body: {
        error: error.message
      }
    }
  }

  if (error instanceof NotAuthorizedError) {
    return {
      status: 401,
      body: {
        error: error.message
      }
    }
  }

  console.log(`Error handling ${ctx.url.toString()}: ${error.message}`)
  return {
    status: 500,
    body: {
      error: 'Internal Server Error'
    }
  }
}

export async function errorHandler(
  ctx: IHttpServerComponent.DefaultContext<object>,
  next: () => Promise<IHttpServerComponent.IResponse>
): Promise<IHttpServerComponent.IResponse> {
  try {
    return await next()
  } catch (error: any) {
    return handleError(ctx, error)
  }
}
