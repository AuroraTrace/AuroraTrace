import { Wallet, WalletData, Coinbase } from "@coinbase/coinbase-sdk"
import { z } from "zod"
import { CdpAction, CdpActionResult, CdpActionSchemaAny } from "./actions/cdp-action"

type VaultEngineConfig = {
  apiKeyName?: string
  apiKeyPrivate?: string
  clientSource?: string
  versionTag?: string
}

type VaultEngineWithWallet = VaultEngineConfig & {
  networkId?: string
  walletPayload?: string
}

export class VaultEngine {
  private identity?: Wallet

  constructor(opts: VaultEngineConfig = {}) {
    const keyName = opts.apiKeyName || process.env.CDP_API_KEY_NAME
    const keySecret = opts.apiKeyPrivate || process.env.CDP_API_KEY_PRIVATE_KEY
    const source = opts.clientSource || "vault-engine"

    if (!keyName) throw new Error("Missing API Key Name")
    if (!keySecret) throw new Error("Missing API Private Key")

    Coinbase.configure({
      apiKeyName: keyName,
      privateKey: keySecret.replace(/\n/g, "
"),
      source,
    })
  }

  static async initWithWallet(cfg: VaultEngineWithWallet = {}): Promise<VaultEngine> {
    const instance = new VaultEngine(cfg)
    const chainId = cfg.networkId || process.env.NETWORK_ID || Coinbase.networks.BaseSepolia

    try {
      instance.identity = cfg.walletPayload
        ? await Wallet.import(JSON.parse(cfg.walletPayload) as WalletData)
        : await Wallet.create({ networkId: chainId })
    } catch (e) {
      throw new Error(`Wallet setup failed: ${e}`)
    }

    return instance
  }

  async execute<T extends CdpActionSchemaAny, R>(
    action: CdpAction<T, R>,
    input: T
  ): Promise<CdpActionResult<R>> {
    if (!action.func) throw new Error(`No execution function found for ${action.name}`)

    if (action.func.length > 1) {
      if (!this.identity) {
        return {
          message: `Wallet required for action: ${action.name}`,
        }
      }
      return await action.func(this.identity, input)
    }

    return await (action.func as (input: z.infer<T>) => Promise<CdpActionResult<R>>)(input)
  }

  async dumpWallet(): Promise<string> {
    if (!this.identity) {
      throw new Error("No wallet present to export")
    }

    const data = this.identity.export()
    const defaultAddr = await this.identity.getDefaultAddress()

    return JSON.stringify({
      ...data,
      defaultAddressId: defaultAddr.getId(),
    })
  }
}