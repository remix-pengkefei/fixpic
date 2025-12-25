/**
 * FixPic API 客户端
 * 支持本地 Flask 和 Modal 两种后端
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001'

// 检测是否为 Modal API（通过 URL 判断）
const isModalAPI = API_URL.includes('modal.run')

/**
 * 获取 Modal endpoint URL
 * Modal fastapi_endpoint 的 URL 格式：{base-url}-{method-name}.modal.run
 */
function getModalEndpoint(method: string): string {
  // API_URL 格式: https://workspace--app-class
  // 结果格式: https://workspace--app-class-method.modal.run
  return `${API_URL}-${method}.modal.run`
}

/**
 * 将 File 转换为 base64 字符串
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // 移除 data:image/xxx;base64, 前缀
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

interface RemoveBgOptions {
  image: File
}

interface ChangeBgOptions {
  image: File
  bgType: 'transparent' | 'color' | 'image'
  bgColor?: string
  bgImage?: File
}

interface SamSegmentOptions {
  image: File
  points: Array<{ x: number; y: number; label: number }>
}

interface ClothesParseOptions {
  image: File
}

interface ClothesSegmentOptions {
  image: File
  categories: number[]
}

interface ApiResponse {
  success: boolean
  image?: string
  width?: number
  height?: number
  score?: number
  categories?: Array<{
    id: number
    name: string
    name_cn: string
    pixels: number
  }>
  error?: string
}

/**
 * 自动抠图 - 去除背景
 */
export async function removeBg(options: RemoveBgOptions): Promise<ApiResponse> {
  if (isModalAPI) {
    const imageBase64 = await fileToBase64(options.image)
    const response = await fetch(getModalEndpoint('remove-bg'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: imageBase64 })
    })
    return response.json()
  } else {
    const formData = new FormData()
    formData.append('image', options.image)
    const response = await fetch(`${API_URL}/api/remove-bg`, {
      method: 'POST',
      body: formData
    })
    return response.json()
  }
}

/**
 * 换背景
 */
export async function changeBg(options: ChangeBgOptions): Promise<ApiResponse> {
  if (isModalAPI) {
    const imageBase64 = await fileToBase64(options.image)
    const body: Record<string, unknown> = {
      image_base64: imageBase64,
      bg_type: options.bgType,
    }
    if (options.bgColor) {
      body.bg_color = options.bgColor
    }
    if (options.bgImage) {
      body.bg_image_base64 = await fileToBase64(options.bgImage)
    }
    const response = await fetch(getModalEndpoint('change-bg'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return response.json()
  } else {
    const formData = new FormData()
    formData.append('image', options.image)
    if (options.bgType === 'color' && options.bgColor) {
      formData.append('bg_color', options.bgColor)
    }
    if (options.bgType === 'image' && options.bgImage) {
      formData.append('background', options.bgImage)
    }
    const endpoint = options.bgType === 'transparent' ? '/api/remove-bg' : '/api/change-bg'
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      body: formData
    })
    return response.json()
  }
}

/**
 * SAM 点击分割
 */
export async function samSegment(options: SamSegmentOptions): Promise<ApiResponse> {
  if (isModalAPI) {
    const imageBase64 = await fileToBase64(options.image)
    const response = await fetch(getModalEndpoint('sam-segment'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: imageBase64,
        points: options.points
      })
    })
    return response.json()
  } else {
    const formData = new FormData()
    formData.append('image', options.image)
    formData.append('points', JSON.stringify(options.points))
    const response = await fetch(`${API_URL}/api/sam-segment`, {
      method: 'POST',
      body: formData
    })
    return response.json()
  }
}

/**
 * 服装解析
 */
export async function clothesParse(options: ClothesParseOptions): Promise<ApiResponse> {
  if (isModalAPI) {
    const imageBase64 = await fileToBase64(options.image)
    const response = await fetch(getModalEndpoint('clothes-parse'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_base64: imageBase64 })
    })
    return response.json()
  } else {
    const formData = new FormData()
    formData.append('image', options.image)
    const response = await fetch(`${API_URL}/api/clothes-parse`, {
      method: 'POST',
      body: formData
    })
    return response.json()
  }
}

/**
 * 服装分割
 */
export async function clothesSegment(options: ClothesSegmentOptions): Promise<ApiResponse> {
  if (isModalAPI) {
    const imageBase64 = await fileToBase64(options.image)
    const response = await fetch(getModalEndpoint('clothes-segment'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_base64: imageBase64,
        categories: options.categories
      })
    })
    return response.json()
  } else {
    const formData = new FormData()
    formData.append('image', options.image)
    formData.append('categories', JSON.stringify(options.categories))
    const response = await fetch(`${API_URL}/api/clothes-segment`, {
      method: 'POST',
      body: formData
    })
    return response.json()
  }
}
