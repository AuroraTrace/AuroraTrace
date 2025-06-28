import { Wallet, WalletData, Coinbase } from "@coinbase/coinbase-sdk"
import { z } from "zod"
import { CdpAction, CdpActionResult, CdpActionSchemaAny } from "./actions/cdp-action"

interface EngineOptions {
  keyName?: string
  keySecret?: string
  clientLabel?: string
  version?: string
}

interface EngineWithWallet extends EngineOptions {
  chainId?: string
  walletJson?: string
}

export class ExecutionEngine {
  private wallet?: Wallet

  constructor(options: EngineOptions = {}) {
    const apiKeyName = options.keyName || process.env.CDP_API_KEY_NAME
    const privateKey = options.keySecret || process.env.CDP_API_KEY_PRIVATE_KEY
    const label = options.clientLabel || "execution-engine"

    if (!apiKeyName) throw new Error("API key name is missing")
    if (!privateKey) throw new Error("Private key is missing")

    Coinbase.configure({
      apiKeyName,
      privateKey: privateKey.replace(/\n/g, "\n"),
      source: label
    })
  }

  static async withWallet(cfg: EngineWithWallet = {}): Promise<ExecutionEngine> {
    const engine = new ExecutionEngine(cfg)
    const targetChain = cfg.chainId || process.env.NETWORK_ID || Coinbase.networks.BaseSepolia

    try {
      engine.wallet = cfg.walletJson
        ? await Wallet.import(JSON.parse(cfg.walletJson) as WalletData)
        : await Wallet.create({ networkId: targetChain })
    } catch (err) {
      throw new Error(`Wallet initialization failed: ${err}`)
    }

    return engine
  }

  async run<T extends CdpActionSchemaAny, R>(
    action: CdpAction<T, R>,
    payload: T
  ): Promise<CdpActionResult<R>> {
    if (!action.func) {
      throw new Error(`Action ${action.name} has no executable function`)
    }

    const requiresWallet = action.func.length > 1
    if (requiresWallet) {
      if (!this.wallet) {
        return { message: `Wallet context required for action: ${action.name}` }
      }
      return await action.func(this.wallet, payload)
    }

    return await (action.func as (input: z.infer<T>) => Promise<CdpActionResult<R>>)(payload)
  }

  async exportWallet(): Promise<string> {
    if (!this.wallet) throw new Error("No wallet to export")

    const exported = this.wallet.export()
    const primaryAddress = await this.wallet.getDefaultAddress()

    return JSON.stringify({
      ...exported,
      defaultAddressId: primaryAddress.getId()
    })
  }
}
