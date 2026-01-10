// 去除假透明背景
export async function removeFakeTransparency(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      const sampleSize = Math.min(20, Math.floor(Math.min(canvas.width, canvas.height) / 10))
      let minVal = 255
      let grayCount = 0
      let totalSamples = 0

      const sampleCorner = (startX: number, startY: number) => {
        for (let y = startY; y < startY + sampleSize && y < canvas.height; y++) {
          for (let x = startX; x < startX + sampleSize && x < canvas.width; x++) {
            const idx = (y * canvas.width + x) * 4
            const r = data[idx], g = data[idx + 1], b = data[idx + 2]
            const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b))
            if (diff < 20) {
              grayCount++
              minVal = Math.min(minVal, r, g, b)
            }
            totalSamples++
          }
        }
      }

      sampleCorner(0, 0)
      sampleCorner(canvas.width - sampleSize, 0)
      sampleCorner(0, canvas.height - sampleSize)
      sampleCorner(canvas.width - sampleSize, canvas.height - sampleSize)

      const isGrayBg = grayCount / totalSamples > 0.7
      const threshold = isGrayBg ? Math.max(150, minVal - 10) : 220

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2]
        const isGray = r > threshold && g > threshold && b > threshold
        const isSimilar = Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20
        if (isGray && isSimilar) {
          data[i + 3] = 0
        }
      }

      ctx.putImageData(imageData, 0, 0)
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      }, 'image/png')
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// 压缩图片
export async function compressImage(
  file: File,
  outputFormat: 'webp' | 'png' | 'jpeg',
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      const mimeType = outputFormat === 'webp' ? 'image/webp'
        : outputFormat === 'png' ? 'image/png' : 'image/jpeg'
      const q = outputFormat === 'png' ? undefined : quality / 100

      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      }, mimeType, q)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// 调整尺寸
export async function resizeImage(
  file: File,
  resizeWidth: number | null,
  resizeHeight: number | null,
  keepAspectRatio: boolean,
  resizeFormat: 'webp' | 'png' | 'jpeg',
  resizeQuality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let width = resizeWidth || img.width
      let height = resizeHeight || img.height

      if (keepAspectRatio) {
        if (resizeWidth && !resizeHeight) {
          height = Math.round(img.height * (resizeWidth / img.width))
        } else if (resizeHeight && !resizeWidth) {
          width = Math.round(img.width * (resizeHeight / img.height))
        } else if (resizeWidth && resizeHeight) {
          const ratio = Math.min(resizeWidth / img.width, resizeHeight / img.height)
          width = Math.round(img.width * ratio)
          height = Math.round(img.height * ratio)
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      const mimeType = resizeFormat === 'webp' ? 'image/webp'
        : resizeFormat === 'png' ? 'image/png' : 'image/jpeg'
      const q = resizeFormat === 'png' ? undefined : resizeQuality / 100

      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create blob'))
      }, mimeType, q)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// 格式化文件大小
export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}
