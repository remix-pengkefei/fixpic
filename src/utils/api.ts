// AI 背景移除
export async function aiRemoveBackground(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('image', file)

  const response = await fetch('/api/remove-bg', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to process image')
  }

  if (data.status === 'success') {
    return data.output
  }

  if (data.status === 'processing' && data.id) {
    return await pollForResult(data.id)
  }

  throw new Error('Unexpected response')
}

// 轮询获取结果
export async function pollForResult(id: string): Promise<string> {
  const maxAttempts = 60
  let attempts = 0

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000))

    const response = await fetch(`/api/remove-bg/${id}`)
    const data = await response.json()

    if (data.status === 'success') {
      return data.output
    }

    if (data.status === 'failed') {
      throw new Error(data.error || 'Processing failed')
    }

    attempts++
  }

  throw new Error('Processing timeout')
}

// 去水印 API
export async function removeWatermark(file: File, removeText: boolean): Promise<string> {
  const formData = new FormData()
  formData.append('image', file)
  if (removeText) {
    formData.append('remove_text', 'true')
  }

  const response = await fetch('/api/remove-watermark', {
    method: 'POST',
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to process image')
  }

  if (data.status === 'success') {
    return data.output
  }

  throw new Error('Unexpected response')
}

// 下载图片结果
export async function downloadImage(imageUrl: string, fileName: string): Promise<void> {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = fileName
    link.href = url
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    const link = document.createElement('a')
    link.download = fileName
    link.href = imageUrl
    link.click()
  }
}
