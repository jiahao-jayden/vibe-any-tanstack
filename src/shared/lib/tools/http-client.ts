import { type FetchOptions, ofetch } from "ofetch"
import { authClient } from "@/shared/lib/auth/auth-client"
import type { ApiResponse, ErrorCode } from "@/shared/types/response"
import { errorEmitter } from "./error-emitter"

export class HttpError extends Error {
  constructor(
    public code: number,
    message: string,
    public errorCode?: ErrorCode
  ) {
    super(message)
    this.name = "HttpError"
  }
}

type HttpOptions = FetchOptions & {
  requireAuth?: boolean
  silent?: boolean
}

function emitAndThrow(code: number, message: string, error?: ErrorCode, silent?: boolean): never {
  if (!silent) {
    errorEmitter.emit({ code, message, error })
  }
  throw new HttpError(code, message, error)
}

let currentSilent = false

const baseFetch = ofetch.create({
  onResponse({ response }) {
    const data = response._data as ApiResponse
    if (data?.error) {
      emitAndThrow(data.code, data.message, data.error, currentSilent)
    }
    response._data = data.data
  },
})

export async function http<T>(url: string, options?: HttpOptions): Promise<T | null> {
  const { requireAuth, silent, ...fetchOptions } = options ?? {}

  if (requireAuth) {
    const { data: session } = await authClient.getSession()
    if (!session) {
      return null
    }
  }

  currentSilent = silent ?? false
  try {
    return (await baseFetch(url, fetchOptions)) as T
  } finally {
    currentSilent = false
  }
}

export type { HttpOptions }
