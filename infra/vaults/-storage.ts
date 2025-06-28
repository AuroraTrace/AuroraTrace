import { ensureImageContainer } from "@/services/storage"

export async function storeImage(file: File): Promise<string> {
  const container = await ensureImageContainer()
  const blob = container.getBlockBlobClient(file.name)

  try {
    if (await blob.exists()) {
      console.warn(\`[Azure] Overwriting existing blob: \${file.name}\`)
      await blob.delete()
    }

    const buffer = await file.arrayBuffer()
    await blob.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: file.type || "application/octet-stream" },
    })

    console.log(\`[Azure] Uploaded image: \${file.name}\`)
    return blob.url.split("?")[0]
  } catch (err) {
    console.error(\`[Azure] Failed to upload image: \${file.name}\`, err)
    throw err
  }
}

export async function removeImage(fileName: string): Promise<void> {
  const container = await ensureImageContainer()
  const blob = container.getBlockBlobClient(fileName)

  try {
    if (await blob.exists()) {
      await blob.delete()
      console.log(\`[Azure] Deleted image: \${fileName}\`)
    } else {
      console.warn(\`[Azure] Tried to delete non-existent image: \${fileName}\`)
    }
  } catch (err) {
    console.error(\`[Azure] Failed to delete image: \${fileName}\`, err)
    throw err
  }
}