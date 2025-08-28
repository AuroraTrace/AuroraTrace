import { z, ZodTypeAny, ZodError } from "zod"
import { Wallet } from "@coinbase/coinbase-sdk"
import { ActionCore, ActionResponse, GenericSchema } from "../../base-action"

/**
 * Vault action schema and result aliases (kept for backward compatibility)
 */
export type VaultSchema = GenericSchema
export type VaultResult<T> = ActionResponse<T>

/**
 * Minimal logger interface (compatible with console.*)
 */
export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void
  warn(message: string, meta?: Record<string, unknown>): void
  error(message: string, meta?: Record<string, unknown>): void
  debug?(message: string, meta?: Record<string, unknown>): void
}

/**
 * Options to control orchestration (validation, timeouts, retries)
 */
export interface VaultActionOptions {
  name?: string
  logger?: Logger
  timeoutMs?: number                 // per-attempt timeout
  retries?: number                   // number of retry attempts on RETRYABLE error
  retryBackoffMs?: number            // deterministic linear backoff (ms) per attempt
}

/**
 * A standardized error used to signal retryable failures
 */
export class VaultActionError extends Error {
  constructor(public code: "RETRYABLE" | "FATAL", message: string) {
    super(message)
    this.name = "VaultActionError"
  }
}

/**
 * Context passed to executors
 */
export interface VaultExecutionParams<T extends VaultSchema> {
  wallet: Wallet
  input: z.infer<T>
}

/**
 * Base shape for a VaultAction. Extends your ActionCore generic with a Wallet context.
 * The `run` method is provided by the factory below for convenience.
 */
export interface VaultAction<T extends VaultSchema, R>
  extends ActionCore<T, R, Wallet> {
  /**
   * Execute the action with a Wallet and validated input.
   */
  execute(params: VaultExecutionParams<T>): Promise<VaultResult<R>>

  /**
   * Validate raw input using `schema`, run with timeout/retries, and return a standardized result.
   * Provided by the factory. Safe to call directly in route handlers or services.
   */
  run(
    args: { wallet: Wallet; rawInput: unknown },
  ): Promise<VaultResult<R>>
}

/* ------------------------------------------------------------------------------------------------
 * Factory
 * ----------------------------------------------------------------------------------------------*/

/**
 * Create a VaultAction with schema-driven validation, deterministic timeouts, and retries.
 */
export function createVaultAction<T extends ZodTypeAny, R>(
  schema: T,
  executor: (params: VaultExecutionParams<T>) => Promise<VaultResult<R>>,
  opts: VaultActionOptions = {}
): VaultAction<T, R> {
  const name = opts.name ?? "VaultAction"
  const logger: Logger = opts.logger ?? defaultLogger
  const timeoutMs = typeof opts.timeoutMs === "number" ? opts.timeoutMs : undefined
  const retries = Number.isInteger(opts.retries) ? (opts.retries as number) : 0
  const retryBackoffMs = typeof opts.retryBackoffMs === "number" ? (opts.retryBackoffMs as number) : 0

  const action: VaultAction<T, R> = {
    schema: schema as unknown as VaultSchema,
    // core execute
    async execute(params: VaultExecutionParams<T>): Promise<VaultResult<R>> {
      return executor(params)
    },

    // orchestrated run: validate -> execute with timeout/retries
    async run({ wallet, rawInput }: { wallet: Wallet; rawInput: unknown }): Promise<VaultResult<R>> {
      const traceId = nextTraceId()
      logger.info(`[${name}] start`, { traceId })

      // 1) validate
      const parsed = (schema as ZodTypeAny).safeParse(rawInput)
      if (!parsed.success) {
        const issues = flattenZodIssues(parsed.error)
        logger.warn(`[${name}] validation_failed`, { traceId, issues })
        return {
          success: false,
          error: `Validation failed: ${issues.join("; ")}`,
        } as VaultResult<R>
      }

      // 2) execute with deterministic retries on RETRYABLE
      const started = Date.now()
      let attempt = 0
      while (true) {
        try {
          const execPromise = executor({ wallet, input: parsed.data })
          const result = await (timeoutMs ? withTimeout(execPromise, timeoutMs) : execPromise)
          const durationMs = Date.now() - started
          logger.info(`[${name}] end`, { traceId, durationMs, success: result?.success })
          return result
        } catch (err: any) {
          attempt += 1
          const isTimeout = err?.name === "TimeoutError"
          const isRetryable =
            err instanceof VaultActionError && err.code === "RETRYABLE"

          if ((isTimeout || isRetryable) && attempt <= retries) {
            const delayMs = retryBackoffMs * attempt
            logger.warn(`[${name}] retrying`, {
              traceId,
              attempt,
              reason: isTimeout ? "timeout" : "retryable_error",
              delayMs,
            })
            if (delayMs > 0) await sleep(delayMs)
            continue
          }

          const message = isTimeout
            ? `Execution timed out after ${timeoutMs}ms`
            : err?.message || "Execution error"

          const durationMs = Date.now() - started
          logger.error(`[${name}] error`, { traceId, durationMs, message })
          return { success: false, error: message } as VaultResult<R>
        }
      }
    },
  }

  return action
}

/* ------------------------------------------------------------------------------------------------
 * Utilities
 * ----------------------------------------------------------------------------------------------*/

const defaultLogger: Logger = {
  info: (m, meta) => console.info(JSON.stringify({ level: "info", time: new Date().toISOString(), msg: m, meta })),
  warn: (m, meta) => console.warn(JSON.stringify({ level: "warn", time: new Date().toISOString(), msg: m, meta })),
  error: (m, meta) => console.error(JSON.stringify({ level: "error", time: new Date().toISOString(), msg: m, meta })),
  debug: (m, meta) => console.debug(JSON.stringify({ level: "debug", time: new Date().toISOString(), msg: m, meta })),
}

let __seq = 0
function nextTraceId(): string {
  __seq += 1
  return `${Date.now().toString(36)}-${__seq.toString(36)}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function withTimeout<T>(p: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      const e: any = new Error("Timeout")
      e.name = "TimeoutError"
      reject(e)
    }, timeoutMs)
  })
  return Promise.race([p.finally(() => clearTimeout(timer!)), timeout])
}

function flattenZodIssues(error: ZodError): string[] {
  return error.issues.map((i) => {
    const path = i.path?.length ? i.path.join(".") : "(root)"
    return `${path}: ${i.message}`
  })
}
