// ensure-image-container.ts
import azureBlobClient from "./blob-client"
import type { ContainerClient, PublicAccessType } from "@azure/storage-blob"

export interface EnsureImageContainerOptions {
  /** Container name (default: "images") */
  containerName?: string
  /**
   * Public access level:
   *  - "blob": public read access for blobs only
   *  - "container": public read access for container and blobs
   *  - "none": no public access (omit to keep existing)
   * Default: "blob"
   */
  publicAccess?: PublicAccessType | "none"
  /** Optional metadata to set on the container */
  metadata?: Record<string, string>
  /** Retries on transient errors (default: 2 => up to 3 attempts) */
  retries?: number
  /** Linear backoff between attempts in ms (default: 500ms) */
  backoffMs?: number
}

/**
 * Create (if missing) and configure an Azure Blob container in a deterministic, idempotent way.
 * - Uses createIfNotExists to avoid 409s when already present
 * - Optionally enforces public access level and metadata
 * - Retries transient failures with fixed linear backoff
 */
export async function ensureImageContainer(
  opts: EnsureImageContainerOptions = {}
): Promise<ContainerClient> {
  const {
    containerName = "images",
    publicAccess = "blob",
    metadata,
    retries = 2,
    backoffMs = 500,
  } = opts

  const container = azureBlobClient.getContainerClient(containerName) as ContainerClient

  // Create if not exists with optional public access
  await retryAsync(async () => {
    const result = await container.createIfNotExists({
      access: publicAccess === "none" ? undefined : (publicAccess as PublicAccessType),
      metadata,
    })
    if (result.succeeded) {
      console.info(
        JSON.stringify({
          level: "info",
          time: new Date().toISOString(),
          msg: "container_created",
          meta: { container: containerName, access: publicAccess },
        })
      )
    } else {
      console.info(
        JSON.stringify({
          level: "info",
          time: new Date().toISOString(),
          msg: "container_exists",
          meta: { container: containerName },
        })
      )
    }
  }, retries, backoffMs)

  // If container already existed and caller wants to ensure a specific access level or metadata,
  // apply them explicitly (no-op if unchanged).
  if (publicAccess !== undefined) {
    await retryAsync(async () => {
      // Setting "none" means remove public access
      const access = publicAccess === "none" ? undefined : (publicAccess as PublicAccessType)
      await container.setAccessPolicy(undefined, { access })
    }, retries, backoffMs)
  }

  if (metadata && Object.keys(metadata).length > 0) {
    await retryAsync(async () => {
      // setMetadata overwrites existing metadata; merge if needed by first fetching and combining.
      const existing = await container.getProperties()
      const merged: Record<string, string> = { ...(existing.metadata || {}), ...metadata }
      await container.setMetadata(merged)
    }, retries, backoffMs)
  }

  return container
}

/* --------------------------------- utils --------------------------------- */

async function retryAsync<T>(
  fn: () => Promise<T>,
  retries: number,
  backoffMs: number
): Promise<T> {
  let attempt = 0
  // first attempt + retries additional
  while (true) {
    try {
      return await fn()
    } catch (err: any) {
      attempt += 1
      if (attempt > retries || !isRetryable(err)) {
        // Re-throw final/non-retryable error
        console.error(
          JSON.stringify({
            level: "error",
            time: new Date().toISOString(),
            msg: "operation_failed",
            meta: { attempt, retries, error: safeError(err) },
          })
        )
        throw err
      }
      const delay = backoffMs * attempt // deterministic linear backoff
      console.warn(
        JSON.stringify({
          level: "warn",
          time: new Date().toISOString(),
          msg: "retrying_operation",
          meta: { attempt, delay },
        })
      )
      await sleep(delay)
    }
  }
}

function isRetryable(err: any): boolean {
  // Consider typical transient cases: 408/429/5xx, ETIMEDOUT/ECONNRESET, fetch/AbortError
  const code = (err && (err.statusCode || err.status)) as number | undefined
  if (code === 408 || code === 429) return true
  if (code && code >= 500) return true
  const name = err?.name
  const message = String(err?.message || "")
  return (
    name === "AbortError" ||
    /ETIMEDOUT|ECONNRESET|EAI_AGAIN|ENOTFOUND|TLS_HANDSHAKE/i.test(message)
  )
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function safeError(err: unknown) {
  if (!err || typeof err !== "object") return { message: String(err) }
  const e = err as any
  return { name: e.name, message: e.message, status: e.status ?? e.statusCode }
}
