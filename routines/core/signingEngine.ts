import { Wallet, WalletData, Coinbase } from "@coinbase/coinbase-sdk"

interface SigningEngineConfig {
  apiKeyName?: string
  apiKeySecret?: string
  label?: string
  networkId?: string
  walletPayload?: string
}

export class SigningEngine {
  private wallet?: Wallet

  constructor(config: SigningEngineConfig) {
    const keyName = config.apiKeyName || process.env.CDP_API_KEY_NAME
    const keySecret = config.apiKeySecret || process.env.CDP_API_KEY_PRIVATE_KEY
    const clientLabel = config.label || "signing-engine"

    if (!keyName || !keySecret) {
      throw new Error("Missing API credentials for Coinbase SDK")
    }

    Coinbase.configure({
      apiKeyName: keyName,
      privateKey: keySecret.replace(/\n/g, "\n"),
      source: clientLabel
    })
  }

  async initializeWallet(): Promise<void> {
    if (this.wallet) return

    const network = process.env.NETWORK_ID || Coinbase.networks.BaseSepolia
    this.wallet = await Wallet.create({ networkId: network })
  }

  async loadWalletFromPayload(payload: string): Promise<void> {
    const data = JSON.parse(payload) as WalletData
    this.wallet = await Wallet.import(data)
  }

  async signMessage(message: string): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not initialized")
    const signature = await this.wallet.signMessage(message)
    return signature.toBase58()
  }

  async signTransaction(rawTx: Uint8Array): Promise<Uint8Array> {
    if (!this.wallet) throw new Error("Wallet not initialized")
    return await this.wallet.signTransaction(rawTx)
  }

  async getPublicKey(): Promise<string> {
    if (!this.wallet) throw new Error("Wallet not initialized")
    const address = await this.wallet.getDefaultAddress()
    return address.getPublicKey().toBase58()
  }

  async export(): Promise<string> {
    if (!this.wallet) throw new Error("No wallet to export")
    const exported = this.wallet.export()
    const defaultAddr = await this.wallet.getDefaultAddress()
    return JSON.stringify({ ...exported, defaultAddressId: defaultAddr.getId() })
  }
}
