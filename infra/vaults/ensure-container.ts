import azureBlobClient from "./blob-client"

export async function ensureImageContainer(): Promise<ReturnType<typeof azureBlobClient.getContainerClient>> {
  const containerName = "images"
  const container = azureBlobClient.getContainerClient(containerName)

  try {
    const result = await container.createIfNotExists({ access: "blob" })
    if (result.succeeded) {
      console.log(`[Azure] Container '${containerName}' created`)
    } else {
      console.log(`[Azure] Container '${containerName}' already exists`)
    }
  } catch (err) {
    console.error(`[Azure] Failed to ensure container '${containerName}':`, err)
    throw err
  }

  return container
}