/**
 * Image inpainting utility
 * Uses Modal API with LaMa model for watermark removal
 */

import { inpaint } from '../api'

/**
 * Convert canvas to base64 (without data URL prefix)
 */
function canvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png').split(',')[1]
}

/**
 * Convert mask canvas to binary mask (white = inpaint, black = keep)
 */
function createBinaryMask(maskCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const binaryCanvas = document.createElement('canvas')
  binaryCanvas.width = maskCanvas.width
  binaryCanvas.height = maskCanvas.height
  const ctx = binaryCanvas.getContext('2d')!

  // Get mask data
  const maskCtx = maskCanvas.getContext('2d')!
  const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)

  // Create binary image data
  const binaryData = ctx.createImageData(maskCanvas.width, maskCanvas.height)

  for (let i = 0; i < maskData.data.length; i += 4) {
    // If there's any color (red channel or alpha has value), mark as white (inpaint)
    const isMasked = maskData.data[i] > 0 || maskData.data[i + 3] > 0
    const value = isMasked ? 255 : 0
    binaryData.data[i] = value     // R
    binaryData.data[i + 1] = value // G
    binaryData.data[i + 2] = value // B
    binaryData.data[i + 3] = 255   // A (fully opaque)
  }

  ctx.putImageData(binaryData, 0, 0)
  return binaryCanvas
}

/**
 * Run AI inpainting using Modal API (LaMa model)
 */
export async function runAIInpainting(
  imageCanvas: HTMLCanvasElement,
  maskCanvas: HTMLCanvasElement,
  onProgress?: (status: string) => void
): Promise<HTMLCanvasElement> {
  onProgress?.('准备图像...')

  // Create binary mask
  const binaryMask = createBinaryMask(maskCanvas)

  // Convert to base64
  const imageBase64 = canvasToBase64(imageCanvas)
  const maskBase64 = canvasToBase64(binaryMask)

  onProgress?.('AI 处理中...')

  // Call Modal API
  const response = await inpaint({
    imageBase64,
    maskBase64,
  })

  if (!response.success) {
    throw new Error(response.error || 'Inpainting failed')
  }

  onProgress?.('渲染结果...')

  // Convert data URL to canvas
  const resultCanvas = document.createElement('canvas')
  const ctx = resultCanvas.getContext('2d')!

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resultCanvas.width = img.width
      resultCanvas.height = img.height
      ctx.drawImage(img, 0, 0)
      resolve(resultCanvas)
    }
    img.onerror = () => reject(new Error('Failed to load result image'))
    img.src = response.image!
  })
}

/**
 * Simple client-side inpainting fallback using canvas
 * Uses basic color averaging (not as good as AI but works offline)
 */
export async function runSimpleInpainting(
  imageCanvas: HTMLCanvasElement,
  maskCanvas: HTMLCanvasElement,
  onProgress?: (status: string) => void
): Promise<HTMLCanvasElement> {
  onProgress?.('Processing locally...')

  const width = imageCanvas.width
  const height = imageCanvas.height

  // Get image data
  const imageCtx = imageCanvas.getContext('2d')!
  const imageData = imageCtx.getImageData(0, 0, width, height)
  const pixels = imageData.data

  // Get mask data
  const maskCtx = maskCanvas.getContext('2d')!
  const maskData = maskCtx.getImageData(0, 0, width, height)
  const mask = maskData.data

  // Create result canvas
  const resultCanvas = document.createElement('canvas')
  resultCanvas.width = width
  resultCanvas.height = height
  const resultCtx = resultCanvas.getContext('2d')!
  const resultData = resultCtx.createImageData(width, height)
  const result = resultData.data

  // Copy original image
  for (let i = 0; i < pixels.length; i++) {
    result[i] = pixels[i]
  }

  // Simple inpainting: for each masked pixel, average nearby unmasked pixels
  const radius = 10
  const iterations = 5

  for (let iter = 0; iter < iterations; iter++) {
    onProgress?.(`Processing locally... (${iter + 1}/${iterations})`)

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4

        // Check if pixel is masked (red channel or alpha > 0)
        if (mask[idx] > 0 || mask[idx + 3] > 0) {
          // Find nearby unmasked pixels and average
          let r = 0, g = 0, b = 0, count = 0

          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx
              const ny = y + dy
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nidx = (ny * width + nx) * 4
                // Only use unmasked pixels
                if (mask[nidx] === 0 && mask[nidx + 3] === 0) {
                  const dist = Math.sqrt(dx * dx + dy * dy)
                  const weight = 1 / (1 + dist)
                  r += result[nidx] * weight
                  g += result[nidx + 1] * weight
                  b += result[nidx + 2] * weight
                  count += weight
                }
              }
            }
          }

          if (count > 0) {
            result[idx] = r / count
            result[idx + 1] = g / count
            result[idx + 2] = b / count
            result[idx + 3] = 255
          }
        }
      }
    }
  }

  resultCtx.putImageData(resultData, 0, 0)
  return resultCanvas
}
