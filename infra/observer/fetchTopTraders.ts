import { queryBirdeye } from "./base"
import { ChainType } from "@/app/_contexts/chain-context"

import {
  TopTradersByTokenTimeFrame,
  TopTradersByTokenSortType,
  TopTradersByTokenSortBy,
  TopTradersByTokenResponse
} from "./types"

type TraderQueryParams = {
  address: string
  timeFrame?: TopTradersByTokenTimeFrame
  sortType?: TopTradersByTokenSortType
  sortBy?: TopTradersByTokenSortBy
  offset?: number
  limit?: number
  chain?: ChainType
}

export async function fetchBirdeyeTopTraders({
  address,
  timeFrame = TopTradersByTokenTimeFrame.TwentyFourHours,
  sortType = TopTradersByTokenSortType.Descending,
  sortBy = TopTradersByTokenSortBy.Volume,
  offset = 0,
  limit = 10,
  chain = "solana"
}: TraderQueryParams): Promise<TopTradersByTokenResponse> {
  if (!address || address.length < 32) {
    throw new Error("Invalid token address")
  }

  if (limit < 1 || limit > 100) {
    throw new Error("Limit must be between 1 and 100")
  }

  const payload = {
    address,
    time_frame: timeFrame,
    sort_type: sortType,
    sort_by: sortBy,
    offset,
    limit
  }

  return queryBirdeye<TopTradersByTokenResponse>(
    "defi/v2/tokens/top_traders",
    payload,
    chain
  )
}
