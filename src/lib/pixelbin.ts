/**
 * Pixelbin API 统一调用模块
 * 所有 AI 功能通过此模块调用 Pixelbin API
 */

const PIXELBIN_API_SECRET = import.meta.env.VITE_PIXELBIN_API_SECRET || ''
const PIXELBIN_CLOUD_NAME = import.meta.env.VITE_PIXELBIN_CLOUD_NAME || ''

// Pixelbin CDN 基础 URL
const CDN_BASE = `https://cdn.pixelbin.io/v2/${PIXELBIN_CLOUD_NAME}`

// 上传 API
const UPLOAD_API = 'https://api.pixelbin.io/service/platform/assets/v2.0/upload/direct'

/**
 * 上传图片到 Pixelbin
 */
async function uploadToPixelbin(file: File, folder: string = 'fixpic'): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('path', folder)
  formData.append('name', `${Date.now()}_${file.name}`)
  formData.append('access', 'public-read')
  formData.append('overwrite', 'true')

  const response = await fetch(UPLOAD_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PIXELBIN_API_SECRET}`,
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`)
  }

  const result = await response.json()
  return result.fileId || result.filePath
}

/**
 * 应用转换并获取结果图片
 */
async function applyTransformation(filePath: string, transformation: string): Promise<string> {
  const url = `${CDN_BASE}/${transformation}/${filePath}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Transformation failed: ${response.statusText}`)
  }

  const blob = await response.blob()
  return URL.createObjectURL(blob)
}

/**
 * 通用处理流程：上传 -> 转换 -> 返回结果
 */
async function processImage(
  file: File,
  transformation: string,
  folder: string = 'fixpic'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // 1. 上传图片
    const filePath = await uploadToPixelbin(file, folder)

    // 2. 应用转换
    const resultUrl = await applyTransformation(filePath, transformation)

    return { success: true, url: resultUrl }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

// ============ AI 工具接口 ============

export interface RemoveBgOptions {
  industryType?: 'general' | 'ecommerce' | 'car' | 'human'
  addShadow?: boolean
}

/**
 * AI 背景去除
 */
export async function removeBg(file: File, options: RemoveBgOptions = {}) {
  const params: string[] = []
  if (options.industryType) params.push(`i:${options.industryType}`)
  if (options.addShadow) params.push('shadow:true')

  const transformation = params.length > 0
    ? `erase.bg(${params.join(',')})`
    : 'erase.bg()'

  return processImage(file, transformation, 'bg_removal')
}

export interface UpscaleOptions {
  scale?: '2x' | '4x'
  enhanceFace?: boolean
  enhanceQuality?: boolean
  model?: 'Picasso' | 'Flash'
}

/**
 * AI 图片放大
 */
export async function upscaleImage(file: File, options: UpscaleOptions = {}) {
  const params: string[] = []
  if (options.scale) params.push(`t:${options.scale}`)
  if (options.model) params.push(`model:${options.model}`)
  if (options.enhanceFace) params.push('enhance_face:true')
  if (options.enhanceQuality) params.push('enhance_quality:true')

  const transformation = params.length > 0
    ? `sr.upscale(${params.join(',')})`
    : 'sr.upscale()'

  return processImage(file, transformation, 'upscale')
}

export interface RemoveWatermarkOptions {
  removeText?: boolean
  removeLogo?: boolean
}

/**
 * AI 水印去除
 */
export async function removeWatermark(file: File, options: RemoveWatermarkOptions = {}) {
  const params: string[] = []
  if (options.removeText) params.push('rem_text:true')
  if (options.removeLogo) params.push('rem_logo:true')

  const transformation = params.length > 0
    ? `wm.remove(${params.join(',')})`
    : 'wm.remove()'

  return processImage(file, transformation, 'watermark')
}

export interface GenerateBgOptions {
  prompt: string
  focus?: 'Product' | 'Background'
}

/**
 * AI 背景生成
 */
export async function generateBg(file: File, options: GenerateBgOptions) {
  // Prompt 需要 base64 编码
  const encodedPrompt = btoa(options.prompt)
  const params = [`p:${encodedPrompt}`]
  if (options.focus) params.push(`focus:${options.focus}`)

  const transformation = `generate.bg(${params.join(',')})`

  return processImage(file, transformation, 'bg_generate')
}

// ============ 新增 AI 工具接口 ============

export interface SharpenOptions {
  sigma?: number // 0.1-10, default 1.5
}

/**
 * 图片锐化
 */
export async function sharpenImage(file: File, options: SharpenOptions = {}) {
  const params: string[] = []
  if (options.sigma) params.push(`s:${options.sigma}`)

  const transformation = params.length > 0
    ? `t.sharpen(${params.join(',')})`
    : 't.sharpen()'

  return processImage(file, transformation, 'sharpen')
}

export interface DenoiseOptions {
  // af.remove 没有参数
}

/**
 * AI 去噪点/去压缩伪影
 */
export async function denoiseImage(file: File, _options: DenoiseOptions = {}) {
  return processImage(file, 'af.remove()', 'denoise')
}

export interface ShadowOptions {
  angle?: number // 65-145, shadow angle
  intensity?: number // 0-1, shadow intensity
  backgroundColor?: string // hex color without #
}

/**
 * AI 阴影生成
 */
export async function generateShadow(file: File, options: ShadowOptions = {}) {
  const params: string[] = []
  if (options.angle) params.push(`a:${options.angle}`)
  if (options.intensity !== undefined) params.push(`i:${options.intensity}`)
  if (options.backgroundColor) params.push(`bgc:${options.backgroundColor}`)

  const transformation = params.length > 0
    ? `shadow.gen(${params.join(',')})`
    : 'shadow.gen()'

  return processImage(file, transformation, 'shadow')
}

export interface SmartCropOptions {
  width?: number
  height?: number
  aspectRatio?: string // e.g., "16_9", "4_3", "1_1"
  gravity?: 'object' | 'foreground' | 'face' | 'none'
  objectType?: string // e.g., "person", "car", "product"
  direction?: 'north_west' | 'north' | 'north_east' | 'west' | 'center' | 'east' | 'south_west' | 'south' | 'south_east'
  padding?: number // percentage
  maintainAspect?: boolean
}

/**
 * AI 智能裁剪
 */
export async function smartCrop(file: File, options: SmartCropOptions = {}) {
  const params: string[] = []
  if (options.width) params.push(`w:${options.width}`)
  if (options.height) params.push(`h:${options.height}`)
  if (options.aspectRatio) params.push(`ar:${options.aspectRatio}`)
  if (options.gravity) params.push(`g:${options.gravity}`)
  if (options.objectType) params.push(`obj:${options.objectType}`)
  if (options.direction) params.push(`d:${options.direction}`)
  if (options.padding) params.push(`p:${options.padding}`)
  if (options.maintainAspect) params.push(`ma:${options.maintainAspect}`)

  const transformation = params.length > 0
    ? `ic.crop(${params.join(',')})`
    : 'ic.crop()'

  return processImage(file, transformation, 'smartcrop')
}

export interface ExtendOptions {
  top?: number // 0-500, default 10
  left?: number // 0-500, default 10
  bottom?: number // 0-500, default 10
  right?: number // 0-500, default 10
  backgroundColor?: string // hex color without #
  borderType?: 'constant' | 'replicate' | 'reflect' | 'wrap'
}

/**
 * 图片扩展/填充
 */
export async function extendImage(file: File, options: ExtendOptions = {}) {
  const params: string[] = []
  if (options.top) params.push(`t:${options.top}`)
  if (options.left) params.push(`l:${options.left}`)
  if (options.bottom) params.push(`b:${options.bottom}`)
  if (options.right) params.push(`r:${options.right}`)
  if (options.backgroundColor) params.push(`bc:${options.backgroundColor}`)
  if (options.borderType) params.push(`bt:${options.borderType}`)

  const transformation = params.length > 0
    ? `t.extend(${params.join(',')})`
    : 't.extend()'

  return processImage(file, transformation, 'extend')
}

// 导出配置检查
export function isPixelbinConfigured(): boolean {
  return !!(PIXELBIN_API_SECRET && PIXELBIN_CLOUD_NAME)
}

export { uploadToPixelbin, applyTransformation }
