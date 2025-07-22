import { queryBirdeye } from "./base"
import { ChainType } from "@/app/_contexts/chain-context"
import { z } from "zod"

import {
  TopTradersByTokenTimeFrame,
  TopTradersByTokenSortType,
  TopTradersByTokenSortBy,
  TopTradersByTokenResponse
} from "./types"

const TraderQuerySchema = z.object({
  address: z.string().min(32, "Invalid token address"),
  timeFrame: z.nativeEnum(TopTradersByTokenTimeFrame).optional(),
  sortType: z.nativeEnum(TopTradersByTokenSortType).optional(),
  sortBy: z.nativeEnum(TopTradersByTokenSortBy).optional(),
  offset: z.number().int().nonnegative().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  chain: z.enum(["solana", "ethereum", "bsc"]).optional()
})

export type TraderQueryParams = z.infer<typeof TraderQuerySchema>

export async function fetchBirdeyeTopTraders(params: TraderQueryParams): Promise<TopTradersByTokenResponse> {
  const {
    address,
    timeFrame = TopTradersByTokenTimeFrame.TwentyFourHours,
    sortType = TopTradersByTokenSortType.Descending,
    sortBy = TopTradersByTokenSortBy.Volume,
    offset = 0,
    limit = 10,
    chain = "solana"
  } = TraderQuerySchema.parse(params)

  const payload = {
    address,
    time_frame: timeFrame,
    sort_type: sortType,
    sort_by: sortBy,
    offset,
    limit
  }

  try {
    return await queryBirdeye<TopTradersByTokenResponse>(
      "defi/v2/tokens/top_traders",
      payload,
      chain as ChainType
    )
  } catch (error) {
    throw new Error(`fetchBirdeyeTopTraders failed for ${address} on ${chain}: ${error}`)
  }
}
