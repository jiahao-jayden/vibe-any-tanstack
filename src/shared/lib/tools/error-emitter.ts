import type { ErrorCode } from "@/shared/types/response"

type ErrorPayload = {
  code: number
  message: string
  error?: ErrorCode
}

type Listener = (error: ErrorPayload) => void

const listeners = new Set<Listener>()

export const errorEmitter = {
  emit(error: ErrorPayload) {
    for (const listener of listeners) {
      listener(error)
    }
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
