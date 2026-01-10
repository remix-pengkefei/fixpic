export type Tool = 'ai-remove-bg' | 'remove-watermark' | 'remove-bg' | 'compress' | 'resize'

export const urlToTool: Record<string, Tool> = {
  'ai-remove-background': 'ai-remove-bg',
  'remove-watermark': 'remove-watermark',
  'remove-fake-transparency': 'remove-bg',
  'compress': 'compress',
  'resize': 'resize'
}

export const toolToUrl: Record<Tool, string> = {
  'ai-remove-bg': 'ai-remove-background',
  'remove-watermark': 'remove-watermark',
  'remove-bg': 'remove-fake-transparency',
  'compress': 'compress',
  'resize': 'resize'
}

export const supportedLangs = [
  'en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'es', 'pt', 'fr', 'de', 'it', 'ru',
  'vi', 'th', 'id', 'ms', 'tr', 'nl', 'el', 'cs', 'hu', 'uk', 'ar'
]

export interface PendingFile {
  file: File
  preview: string
}

export interface ProcessedImage {
  original: File
  result: Blob
  originalSize: number
  resultSize: number
  preview: string
}
