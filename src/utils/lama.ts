/**
 * LaMa (Large Mask Inpainting) ONNX Runtime implementation
 * Based on: https://huggingface.co/Carve/LaMa-ONNX
 */

import * as ort from 'onnxruntime-web'

// Model configuration
const MODEL_URL = 'https://huggingface.co/Carve/LaMa-ONNX/resolve/main/lama_fp32.onnx'
const MODEL_SIZE = 512 // Fixed input size for LaMa

// Singleton session
let session: ort.InferenceSession | null = null
let loadingPromise: Promise<ort.InferenceSession> | null = null

/**
 * Load the LaMa ONNX model
 */
export async function loadLamaModel(
  onProgress?: (progress: number) => void
): Promise<ort.InferenceSession> {
  // Return existing session if available
  if (session) {
    return session
  }

  // Return existing loading promise if in progress
  if (loadingPromise) {
    return loadingPromise
  }

  loadingPromise = (async () => {
    try {
      // Configure ONNX Runtime WASM paths
      ort.env.wasm.numThreads = 1
      ort.env.wasm.simd = true

      console.log('Starting LaMa model download...')
      onProgress?.(1)

      // Try to load from cache first
      let modelBuffer: ArrayBuffer
      let fromCache = false

      try {
        const cache = await caches.open('lama-model-cache-v1')
        const cachedResponse = await cache.match(MODEL_URL)

        if (cachedResponse) {
          console.log('Loading LaMa model from cache...')
          onProgress?.(10)
          modelBuffer = await cachedResponse.arrayBuffer()
          onProgress?.(90)
          fromCache = true
        } else {
          throw new Error('Not in cache')
        }
      } catch {
        console.log('Downloading LaMa model from HuggingFace...')

        const response = await fetch(MODEL_URL, {
          mode: 'cors',
          cache: 'default',
        })

        if (!response.ok) {
          throw new Error(`Failed to download model: ${response.status} ${response.statusText}`)
        }

        const contentLength = response.headers.get('content-length')
        const total = contentLength ? parseInt(contentLength, 10) : 220000000 // ~208MB estimate

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('Failed to get response reader')
        }

        const chunks: Uint8Array[] = []
        let loaded = 0

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          chunks.push(value)
          loaded += value.length

          const progress = Math.min(85, Math.round((loaded / total) * 85))
          onProgress?.(progress)
        }

        // Combine chunks into single buffer
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
        const fullArray = new Uint8Array(totalLength)
        let offset = 0
        for (const chunk of chunks) {
          fullArray.set(chunk, offset)
          offset += chunk.length
        }
        modelBuffer = fullArray.buffer

        console.log(`Model downloaded: ${(totalLength / 1024 / 1024).toFixed(1)} MB`)

        // Cache the model for future use
        try {
          const cache = await caches.open('lama-model-cache-v1')
          await cache.put(MODEL_URL, new Response(new Uint8Array(modelBuffer)))
          console.log('LaMa model cached successfully')
        } catch (e) {
          console.warn('Failed to cache model:', e)
        }
      }

      onProgress?.(90)
      console.log('Creating ONNX inference session...')

      session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'basic',
      })

      onProgress?.(100)
      console.log('LaMa model loaded successfully' + (fromCache ? ' (from cache)' : ''))
      return session
    } catch (error) {
      console.error('Failed to load LaMa model:', error)
      loadingPromise = null
      throw error
    }
  })()

  return loadingPromise
}

/**
 * Check if model is loaded
 */
export function isModelLoaded(): boolean {
  return session !== null
}

/**
 * Preprocess image canvas to model input tensor
 */
function preprocessImage(
  canvas: HTMLCanvasElement,
  targetSize: number
): { tensor: ort.Tensor; originalWidth: number; originalHeight: number } {
  const originalWidth = canvas.width
  const originalHeight = canvas.height

  // Create resized canvas
  const resizedCanvas = document.createElement('canvas')
  resizedCanvas.width = targetSize
  resizedCanvas.height = targetSize
  const ctx = resizedCanvas.getContext('2d')!

  // Fill with black and draw image scaled to fit
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, targetSize, targetSize)

  // Calculate scaling to fit image while maintaining aspect ratio
  const scale = Math.min(targetSize / originalWidth, targetSize / originalHeight)
  const scaledWidth = originalWidth * scale
  const scaledHeight = originalHeight * scale
  const offsetX = (targetSize - scaledWidth) / 2
  const offsetY = (targetSize - scaledHeight) / 2

  ctx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight)

  // Get image data and convert to Float32Array [1, 3, H, W]
  const imageData = ctx.getImageData(0, 0, targetSize, targetSize)
  const data = imageData.data

  const float32Data = new Float32Array(3 * targetSize * targetSize)

  for (let i = 0; i < targetSize * targetSize; i++) {
    // Normalize to [0, 1]
    float32Data[i] = data[i * 4] / 255.0 // R
    float32Data[targetSize * targetSize + i] = data[i * 4 + 1] / 255.0 // G
    float32Data[2 * targetSize * targetSize + i] = data[i * 4 + 2] / 255.0 // B
  }

  return {
    tensor: new ort.Tensor('float32', float32Data, [1, 3, targetSize, targetSize]),
    originalWidth,
    originalHeight,
  }
}

/**
 * Preprocess mask canvas to model input tensor
 */
function preprocessMask(
  maskCanvas: HTMLCanvasElement,
  imageCanvas: HTMLCanvasElement,
  targetSize: number
): ort.Tensor {
  const originalWidth = imageCanvas.width
  const originalHeight = imageCanvas.height

  // Create resized canvas for mask
  const resizedCanvas = document.createElement('canvas')
  resizedCanvas.width = targetSize
  resizedCanvas.height = targetSize
  const ctx = resizedCanvas.getContext('2d')!

  // Fill with black (no mask)
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, targetSize, targetSize)

  // Calculate same scaling as image
  const scale = Math.min(targetSize / originalWidth, targetSize / originalHeight)
  const scaledWidth = originalWidth * scale
  const scaledHeight = originalHeight * scale
  const offsetX = (targetSize - scaledWidth) / 2
  const offsetY = (targetSize - scaledHeight) / 2

  ctx.drawImage(maskCanvas, offsetX, offsetY, scaledWidth, scaledHeight)

  // Get mask data and convert to Float32Array [1, 1, H, W]
  const maskData = ctx.getImageData(0, 0, targetSize, targetSize)
  const data = maskData.data

  const float32Data = new Float32Array(targetSize * targetSize)

  for (let i = 0; i < targetSize * targetSize; i++) {
    // Any non-zero alpha or red channel means mask
    const isMasked = data[i * 4] > 0 || data[i * 4 + 3] > 0
    float32Data[i] = isMasked ? 1.0 : 0.0
  }

  return new ort.Tensor('float32', float32Data, [1, 1, targetSize, targetSize])
}

/**
 * Postprocess model output to canvas
 */
function postprocessOutput(
  outputTensor: ort.Tensor,
  originalCanvas: HTMLCanvasElement,
  modelSize: number
): HTMLCanvasElement {
  const originalWidth = originalCanvas.width
  const originalHeight = originalCanvas.height

  // Create model output canvas
  const modelCanvas = document.createElement('canvas')
  modelCanvas.width = modelSize
  modelCanvas.height = modelSize
  const modelCtx = modelCanvas.getContext('2d')!

  // Get output data [1, 3, H, W]
  const outputData = outputTensor.data as Float32Array
  const imageData = modelCtx.createImageData(modelSize, modelSize)

  for (let i = 0; i < modelSize * modelSize; i++) {
    // Denormalize from [0, 1] and clamp
    imageData.data[i * 4] = Math.max(0, Math.min(255, outputData[i] * 255)) // R
    imageData.data[i * 4 + 1] = Math.max(0, Math.min(255, outputData[modelSize * modelSize + i] * 255)) // G
    imageData.data[i * 4 + 2] = Math.max(0, Math.min(255, outputData[2 * modelSize * modelSize + i] * 255)) // B
    imageData.data[i * 4 + 3] = 255 // A
  }

  modelCtx.putImageData(imageData, 0, 0)

  // Create final canvas and scale back to original size
  const finalCanvas = document.createElement('canvas')
  finalCanvas.width = originalWidth
  finalCanvas.height = originalHeight
  const finalCtx = finalCanvas.getContext('2d')!

  // Calculate the region to extract from model output
  const scale = Math.min(modelSize / originalWidth, modelSize / originalHeight)
  const scaledWidth = originalWidth * scale
  const scaledHeight = originalHeight * scale
  const offsetX = (modelSize - scaledWidth) / 2
  const offsetY = (modelSize - scaledHeight) / 2

  // Draw the relevant portion back to original size
  finalCtx.drawImage(
    modelCanvas,
    offsetX, offsetY, scaledWidth, scaledHeight,
    0, 0, originalWidth, originalHeight
  )

  return finalCanvas
}

/**
 * Run LaMa inpainting
 */
export async function runLamaInpainting(
  imageCanvas: HTMLCanvasElement,
  maskCanvas: HTMLCanvasElement,
  onProgress?: (status: string) => void
): Promise<HTMLCanvasElement> {
  if (!session) {
    throw new Error('Model not loaded. Call loadLamaModel() first.')
  }

  onProgress?.('Preprocessing image...')

  // Preprocess inputs
  const { tensor: imageTensor } = preprocessImage(imageCanvas, MODEL_SIZE)
  const maskTensor = preprocessMask(maskCanvas, imageCanvas, MODEL_SIZE)

  onProgress?.('Running AI inpainting...')

  // Run inference
  const feeds = {
    image: imageTensor,
    mask: maskTensor,
  }

  const results = await session.run(feeds)

  onProgress?.('Postprocessing result...')

  // Get output tensor (the key name may vary, check model outputs)
  const outputTensor = results['output'] || results[Object.keys(results)[0]]

  // Postprocess to canvas
  const resultCanvas = postprocessOutput(outputTensor, imageCanvas, MODEL_SIZE)

  return resultCanvas
}

/**
 * Clear cached model (for memory management)
 */
export function clearLamaModel(): void {
  session = null
  loadingPromise = null
}
