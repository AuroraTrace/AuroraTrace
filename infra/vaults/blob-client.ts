import { BlobServiceClient } from "@azure/storage-blob"

const baseUrl = process.env.NEXT_PUBLIC_STORAGE_URL
const sasToken = process.env.NEXT_PUBLIC_STORAGE_SAS

if (!baseUrl || !sasToken) {
  throw new Error("❌ Missing Azure Blob Storage config (URL or SAS token)")
}

const connectionUrl = `${baseUrl}?sv=${sasToken}`
const azureBlobClient = new BlobServiceClient(connectionUrl)

console.log("[Azure] Blob client initialized")

export default azureBlobClient
