/**
 * UI 翻译脚本
 *
 * 使用 GPT 将 zh-CN.json 翻译到所有其他语言
 * 流程：中文(原文) → GPT润色 → 英语 → GPT翻译 → 其他语言
 *
 * 用法：
 *   OPENAI_API_KEY=xxx npx tsx scripts/translate-ui.ts
 *   OPENAI_API_KEY=xxx npx tsx scripts/translate-ui.ts --lang=ja  # 只翻译日语
 */

import * as fs from 'fs'
import * as path from 'path'
import {
  createOpenAIClient,
  polishChineseToEnglish,
  translateEnglishToLanguage,
  SUPPORTED_LANGUAGES,
} from './gpt-translator'

const LOCALES_DIR = path.join(process.cwd(), 'src/i18n/locales')
const SOURCE_FILE = path.join(LOCALES_DIR, 'zh-CN.json')

interface TranslationValue {
  [key: string]: string | TranslationValue
}

// 递归翻译 JSON 对象
async function translateNestedObject(
  client: ReturnType<typeof createOpenAIClient>,
  obj: TranslationValue,
  targetLangCode: string,
  englishCache: Map<string, string>,
  keyPath: string = ''
): Promise<TranslationValue> {
  const result: TranslationValue = {}

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = keyPath ? `${keyPath}.${key}` : key

    if (typeof value === 'string') {
      // 翻译字符串值
      console.log(`    翻译: ${currentPath}`)

      // 检查英语缓存
      let englishText = englishCache.get(currentPath)
      if (!englishText) {
        // 先润色到英语
        englishText = await polishChineseToEnglish(
          client,
          value,
          'UI text for an image processing tool website'
        )
        englishCache.set(currentPath, englishText)
        await delay(300)
      }

      // 如果目标是英语，直接使用
      if (targetLangCode === 'en') {
        result[key] = englishText
      } else if (targetLangCode === 'zh-CN') {
        result[key] = value
      } else if (targetLangCode === 'zh-TW') {
        // 繁体中文直接从简体中文转换
        const traditional = await translateEnglishToLanguage(
          client,
          value, // 使用原始中文
          'zh-TW',
          'Convert Simplified Chinese to Traditional Chinese for UI text'
        )
        result[key] = traditional
        await delay(300)
      } else {
        // 从英语翻译到目标语言
        const translated = await translateEnglishToLanguage(
          client,
          englishText,
          targetLangCode,
          'UI text for an image processing tool website'
        )
        result[key] = translated
        await delay(300)
      }
    } else if (typeof value === 'object' && value !== null) {
      // 递归处理嵌套对象
      result[key] = await translateNestedObject(
        client,
        value as TranslationValue,
        targetLangCode,
        englishCache,
        currentPath
      )
    } else {
      result[key] = value
    }
  }

  return result
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 解析命令行参数
function parseArgs(): { targetLang?: string } {
  const args = process.argv.slice(2)
  const result: { targetLang?: string } = {}

  for (const arg of args) {
    if (arg.startsWith('--lang=')) {
      result.targetLang = arg.split('=')[1]
    }
  }

  return result
}

async function main() {
  const args = parseArgs()

  // 读取源文件
  console.log('读取中文源文件...')
  const sourceContent = fs.readFileSync(SOURCE_FILE, 'utf-8')
  const sourceJson: TranslationValue = JSON.parse(sourceContent)

  // 创建 OpenAI 客户端
  const client = createOpenAIClient()
  console.log('OpenAI 客户端已创建')

  // 英语翻译缓存（避免重复翻译）
  const englishCache = new Map<string, string>()

  // 确定要翻译的语言
  let targetLanguages = SUPPORTED_LANGUAGES.filter(lang => lang.code !== 'zh-CN')

  if (args.targetLang) {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === args.targetLang)
    if (!lang) {
      console.error(`不支持的语言代码: ${args.targetLang}`)
      console.log('支持的语言:', SUPPORTED_LANGUAGES.map(l => l.code).join(', '))
      process.exit(1)
    }
    targetLanguages = [lang]
  }

  // 先生成英语版本（其他语言都基于英语翻译）
  if (!args.targetLang || args.targetLang === 'en') {
    console.log('\n=== 翻译到 English (en) ===')
    const englishResult = await translateNestedObject(
      client,
      sourceJson,
      'en',
      englishCache
    )

    const englishFile = path.join(LOCALES_DIR, 'en.json')
    fs.writeFileSync(englishFile, JSON.stringify(englishResult, null, 2) + '\n')
    console.log(`已保存: ${englishFile}`)
  }

  // 翻译到其他语言
  for (const lang of targetLanguages) {
    if (lang.code === 'en') continue // 英语已经处理

    console.log(`\n=== 翻译到 ${lang.name} (${lang.code}) ===`)

    try {
      const translated = await translateNestedObject(
        client,
        sourceJson,
        lang.code,
        englishCache
      )

      const outputFile = path.join(LOCALES_DIR, `${lang.code}.json`)
      fs.writeFileSync(outputFile, JSON.stringify(translated, null, 2) + '\n')
      console.log(`已保存: ${outputFile}`)

      // 语言之间添加延迟
      await delay(1000)
    } catch (error) {
      console.error(`翻译到 ${lang.code} 失败:`, error)
    }
  }

  console.log('\n翻译完成!')
}

main().catch(console.error)
