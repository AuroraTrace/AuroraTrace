import { z } from "zod"
import { Wallet } from "@coinbase/coinbase-sdk"
import { ActionCore, ActionResponse, GenericSchema } from "../../base-action"

export type VaultSchema = GenericSchema
export type VaultResult<T> = ActionResponse<T>

export interface VaultAction<T extends VaultSchema, R> extends ActionCore<T, R, Wallet> {
  /**
   * Execute the action with a Wallet and validated input.
   */
  execute: (params: {
    wallet: Wallet
    input: z.infer<T>
  }) => Promise<VaultResult<R>>
}
