// auroraTraceActions.ts

import { z } from "zod"

/* -------------------------------------------------------------------------------------------------
 * Core Types
 * -----------------------------------------------------------------------------------------------*/

// Base schema for AuroraTrace actions
export type AuroraTraceSchema = z.ZodObject<z.ZodRawShape>

// Standardized response for any action
export interface AuroraTraceActionResponse<T> {
  notice: string
  data?: T
}

// Core structure defining an AuroraTrace action
export interface AuroraTraceActionCore<
  S extends AuroraTraceSchema,
  R,
  Ctx = unknown
> {
  /** unique action identifier */
  id: string
  /** brief description of the action */
  summary: string
  /** Zod schema for input validation */
  input: S
  /** Execute action on validated input + context */
  execute: (args: { payload: z.infer<S>; context: Ctx }) => Promise<AuroraTraceActionResponse<R>>
}

// Union type covering any AuroraTrace action
export type AuroraTraceAction = AuroraTraceActionCore<AuroraTraceSchema, unknown, unknown>

/* -------------------------------------------------------------------------------------------------
 * Utilities: safe runner with validation, timeouts, and deterministic retries
 * -----------------------------------------------------------------------------------------------*/

export interface RunOptions {
  /** per-attempt timeout in ms (default 10_000) */
  timeoutMs?: number
  /** number of retries on 429/5xx or timeout (default 2 => total 3 attempts) */
  retries?: number
  /** linear backoff between attempts in ms (default 500) */
  backoffMs?: number
}

/**
 * Validate input with the action schema and then execute with timeout/retries.
 * Throws on validation error or after final failed attempt.
 */
export async function runAuroraAction<S extends AuroraTraceSchema, R, Ctx>(
  action: AuroraTraceActionCore<S, R, Ctx>,
  rawPayload: unknown,
  context: Ctx,
  opts: RunOptions = {}
): Promise<AuroraTraceActionResponse<R>> {
  const { timeoutMs = 10_000, retries = 2, backoffMs = 500 } = opts

  const parse = action.input.safeParse(rawPayload)
  if (!parse.success) {
    const issues = parse.error.issues.map(i => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")
    throw new Error(`Validation failed: ${issues}`)
  }
  const payload = parse.data

  let attempt = 0
  while (true) {
    try {
      const exec = action.execute({ payload, context })
      return await withTimeout(exec, timeoutMs)
    } catch (err: any) {
      attempt += 1
      const retryable = isRetryable(err)
      if (retryable && attempt <= retries) {
        await delay(backoffMs * attempt) // deterministic linear backoff
        continue
      }
      // Re-throw final error
      throw decorateError(err, action.id, attempt)
    }
  }
}

function isRetryable(err: unknown): boolean {
  if (!err || typeof err !== "object") return false
  const e = err as any
  if (e?.name === "TimeoutError") return true
  const status = e?.status ?? e?.statusCode
  return status === 429 || (typeof status === "number" && status >= 500 && status <= 599)
}

function decorateError(err: unknown, actionId: string, attempt: number): Error {
  if (err instanceof Error) {
    (err as any).actionId = actionId
    ;(err as any).attempt = attempt
    return err
  }
  return new Error(String(err))
}

function delay(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms))
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: NodeJS.Timeout
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => {
      const e: any = new Error("Timeout")
      e.name = "TimeoutError"
      reject(e)
    }, ms)
  })
  return Promise.race([p.finally(() => clearTimeout(t!)), timeout])
}

/* -------------------------------------------------------------------------------------------------
 * Example Action: auraScan
 * -----------------------------------------------------------------------------------------------*/

const AuraScanInput = z.object({
  contractAddress: z.string().min(1, "contractAddress is required"),
  periodHours: z.number().int().positive(),
})

const AuraScanContext = z.object({
  apiUrl: z.string().url("apiUrl must be a valid URL"),
  apiKey: z.string().min(1, "apiKey is required"),
})

const AuraScanApiResponse = z.object({
  score: z.number().min(0).max(100),
  insights: z.array(z.string()).default([]),
})

export type AuraScanInput = z.infer<typeof AuraScanInput>
export type AuraScanContext = z.infer<typeof AuraScanContext>
export type AuraScanData = { auraScore: number; insights: string[] }

/**
 * Robust fetch with per-attempt timeout, deterministic retries are handled by runAuroraAction.
 * Here we also validate response shape.
 */
async function fetchAuraScan(
  contractAddress: string,
  periodHours: number,
  ctx: AuraScanContext,
  timeoutMs: number
): Promise<AuraScanData> {
  const url = new URL("/auroratrace/scan", ctx.apiUrl)
  url.searchParams.set("address", contractAddress)
  url.searchParams.set("hours", String(periodHours))

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "Authorization": `Bearer ${ctx.apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    })

    // Attach status to potential error for retry logic upstream
    if (!res.ok) {
      const err: any = new Error(`AuroraTrace API error: ${res.status} ${res.statusText}`)
      err.status = res.status
      throw err
    }

    const json = await res.json()
    const parsed = AuraScanApiResponse.parse(json)

    return {
      auraScore: parsed.score,
      insights: parsed.insights,
    }
  } catch (e: any) {
    if (e?.name === "AbortError") {
      const err: any = new Error(`Request timed out after ${timeoutMs}ms`)
      err.name = "TimeoutError"
      throw err
    }
    throw e
  } finally {
    clearTimeout(timer)
  }
}

// Example: Define an auraScan action for AuroraTrace
export const auraScanAction: AuroraTraceActionCore<
  typeof AuraScanInput,
  AuraScanData,
  AuraScanContext
> = {
  id: "auraScan",
  summary: "Perform an Aura Pattern scan on a given contract over a time period",
  input: AuraScanInput,
  execute: async ({ payload, context }) => {
    // Validate context here to fail fast with actionable messages
    const ctx = AuraScanContext.parse(context)

    // Use a reasonable default timeout; outer runAuroraAction can override/retry
    const data = await fetchAuraScan(payload.contractAddress, payload.periodHours, ctx, 10_000)

    return {
      notice: `Aura scan completed for ${payload.contractAddress}`,
      data,
    }
  },
}
