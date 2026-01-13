/**
 * GPT 翻译工具模块
 *
 * 翻译流程：
 * 中文(原文) → GPT润色 → 英语 → GPT翻译 → 其他语言
 */

import OpenAI from 'openai'

// 支持的语言列表
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh-CN', name: 'Simplified Chinese', nativeName: '简体中文' },
  { code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
]

// 获取语言信息
export function getLanguageInfo(code: string) {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code)
}

// 创建 OpenAI 客户端
export function createOpenAIClient(apiKey?: string) {
  const key = apiKey || process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('OPENAI_API_KEY is not set. Please set it in environment variables.')
  }
  return new OpenAI({ apiKey: key })
}

// 从中文润色到英语（SEO优化）
export async function polishChineseToEnglish(
  client: OpenAI,
  chineseText: string,
  context?: string
): Promise<string> {
  const systemPrompt = `You are a professional SEO copywriter and translator. Your task is to translate Chinese text to English with the following requirements:

TRANSLATION REQUIREMENTS:
1. The translation should be natural, fluent, and professionally polished
2. Maintain the original meaning while optimizing for English search engines
3. Use terminology that English speakers actually search for online
4. Preserve markdown formatting (headers, lists, links, bold, etc.)
5. Keep brand names (FixPic, Midjourney, Lovart, etc.) unchanged

SEO OPTIMIZATION:
- Use keywords that rank well in Google/Bing
- Write compelling, click-worthy titles and descriptions
- Include natural calls-to-action
- Optimize for featured snippets where applicable

${context ? `SPECIFIC CONTEXT:\n${context}` : ''}

Output ONLY the translated English text, nothing else. Do not add explanations or notes.`

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: chineseText }
    ],
    temperature: 0.3,
  })

  return response.choices[0]?.message?.content?.trim() || ''
}

// 从英语翻译到目标语言（SEO优化）
export async function translateEnglishToLanguage(
  client: OpenAI,
  englishText: string,
  targetLangCode: string,
  context?: string
): Promise<string> {
  const targetLang = getLanguageInfo(targetLangCode)
  if (!targetLang) {
    throw new Error(`Unsupported language code: ${targetLangCode}`)
  }

  // 如果目标语言是英语，直接返回
  if (targetLangCode === 'en') {
    return englishText
  }

  const systemPrompt = `You are a professional SEO-focused translator and content localizer. Your task is to translate English text to ${targetLang.name} (${targetLang.nativeName}) with the following requirements:

TRANSLATION REQUIREMENTS:
1. The translation must be natural, fluent, and native-sounding in ${targetLang.name}
2. Maintain the original meaning while adapting for local search intent
3. Use terminology that ${targetLang.name} speakers actually search for online
4. Preserve markdown formatting (headers, lists, links, bold, etc.)
5. Keep brand names (FixPic, Midjourney, Lovart, etc.) unchanged

SEO OPTIMIZATION:
- Adapt keywords to match how ${targetLang.name} speakers search
- Ensure the text would rank well in ${targetLang.name} search engines
- Make titles and descriptions compelling for click-through
- Include natural calls-to-action in the target language

${context ? `SPECIFIC CONTEXT:\n${context}` : ''}

Output ONLY the translated ${targetLang.name} text, nothing else. Do not add explanations or notes.`

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: englishText }
    ],
    temperature: 0.3,
  })

  return response.choices[0]?.message?.content?.trim() || ''
}

// 完整翻译流程：中文 → 英语 → 目标语言
export async function translateFromChinese(
  client: OpenAI,
  chineseText: string,
  targetLangCode: string,
  context?: string
): Promise<{ english: string; translated: string }> {
  // 第一步：中文润色到英语
  console.log(`  润色中文到英语...`)
  const english = await polishChineseToEnglish(client, chineseText, context)

  // 如果目标语言是英语或中文，直接返回
  if (targetLangCode === 'en') {
    return { english, translated: english }
  }

  if (targetLangCode === 'zh-CN') {
    return { english, translated: chineseText }
  }

  // 第二步：英语翻译到目标语言
  console.log(`  翻译英语到 ${targetLangCode}...`)
  const translated = await translateEnglishToLanguage(client, english, targetLangCode, context)

  return { english, translated }
}

// 批量翻译到所有语言
export async function translateToAllLanguages(
  client: OpenAI,
  chineseText: string,
  context?: string,
  excludeLanguages: string[] = ['zh-CN'] // 默认排除简体中文（源语言）
): Promise<Record<string, string>> {
  const results: Record<string, string> = {
    'zh-CN': chineseText // 保留原始中文
  }

  // 第一步：润色到英语
  console.log('润色中文到英语...')
  const english = await polishChineseToEnglish(client, chineseText, context)
  results['en'] = english

  // 第二步：翻译到其他语言
  const otherLanguages = SUPPORTED_LANGUAGES.filter(
    lang => lang.code !== 'en' && lang.code !== 'zh-CN' && !excludeLanguages.includes(lang.code)
  )

  for (const lang of otherLanguages) {
    console.log(`翻译到 ${lang.name} (${lang.code})...`)
    try {
      results[lang.code] = await translateEnglishToLanguage(client, english, lang.code, context)
      // 添加延迟避免 rate limit
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(`  翻译到 ${lang.code} 失败:`, error)
      results[lang.code] = english // 失败时使用英语作为 fallback
    }
  }

  return results
}

// 翻译 JSON 对象（递归处理嵌套对象）
export async function translateJsonObject(
  client: OpenAI,
  obj: Record<string, unknown>,
  targetLangCode: string,
  context?: string
): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // 翻译字符串值
      const { translated } = await translateFromChinese(client, value, targetLangCode, context)
      result[key] = translated
      await new Promise(resolve => setTimeout(resolve, 300)) // 避免 rate limit
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // 递归处理嵌套对象
      result[key] = await translateJsonObject(client, value as Record<string, unknown>, targetLangCode, context)
    } else {
      // 保持其他类型不变
      result[key] = value
    }
  }

  return result
}
