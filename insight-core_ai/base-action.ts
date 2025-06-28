// auroraTraceActions.ts

import { z } from "zod"

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
  id: string                  // unique action identifier
  summary: string             // brief description of the action
  input: S                    // Zod schema for input validation
  execute: (
    args: {
      payload: z.infer<S>
      context: Ctx
    }
  ) => Promise<AuroraTraceActionResponse<R>>
}

// Union type covering any AuroraTrace action
export type AuroraTraceAction = AuroraTraceActionCore<AuroraTraceSchema, unknown, unknown>

// Example: Define an auraScan action for AuroraTrace
export const auraScanAction: AuroraTraceActionCore<
  z.ZodObject<{
    contractAddress: z.ZodString
    periodHours: z.ZodNumber
  }>,
  {
    auraScore: number
    insights: string[]
  },
  {
    apiUrl: string
    apiKey: string
  }
> = {
  id: "auraScan",
  summary: "Perform an Aura Pattern scan on a given contract over a time period",
  input: z.object({
    contractAddress: z.string(),
    periodHours: z.number().int().positive()
  }),
  execute: async ({ payload, context }) => {
    const { contractAddress, periodHours } = payload
    const { apiUrl, apiKey } = context

    const response = await fetch(
      `${apiUrl}/auroratrace/scan?address=${encodeURIComponent(contractAddress)}&hours=${periodHours}`,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }
    )

    if (!response.ok) {
      throw new Error(`AuroraTrace API error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    return {
      notice: `Aura scan completed for ${contractAddress}`,
      data: {
        auraScore: result.score,
        insights: result.insights as string[]
      }
    }
  }
}
