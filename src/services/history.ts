import { supabase } from '../lib/supabase'

export interface HistoryRecord {
  id: string
  user_id: string
  tool_type: 'watermark' | 'background' | 'compress' | 'resize' | 'transparency'
  original_filename: string
  original_size: number
  result_size: number | null
  status: 'processing' | 'completed' | 'failed'
  created_at: string
  metadata: Record<string, unknown> | null
}

export interface CreateHistoryInput {
  tool_type: HistoryRecord['tool_type']
  original_filename: string
  original_size: number
  result_size?: number
  status?: HistoryRecord['status']
  metadata?: Record<string, unknown>
}

/**
 * 保存处理历史记录
 */
export async function saveHistory(input: CreateHistoryInput): Promise<HistoryRecord | null> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.log('User not logged in, skipping history save')
    return null
  }

  const { data, error } = await supabase
    .from('processing_history')
    .insert({
      user_id: user.id,
      tool_type: input.tool_type,
      original_filename: input.original_filename,
      original_size: input.original_size,
      result_size: input.result_size ?? null,
      status: input.status ?? 'completed',
      metadata: input.metadata ?? null
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to save history:', error)
    return null
  }

  return data as HistoryRecord
}

/**
 * 获取用户的处理历史
 */
export async function getHistory(limit = 50, offset = 0): Promise<HistoryRecord[]> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data, error } = await supabase
    .from('processing_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('Failed to get history:', error)
    return []
  }

  return data as HistoryRecord[]
}

/**
 * 删除历史记录
 */
export async function deleteHistory(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('processing_history')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete history:', error)
    return false
  }

  return true
}

/**
 * 清空所有历史记录
 */
export async function clearAllHistory(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return false
  }

  const { error } = await supabase
    .from('processing_history')
    .delete()
    .eq('user_id', user.id)

  if (error) {
    console.error('Failed to clear history:', error)
    return false
  }

  return true
}

/**
 * 获取工具类型的显示名称
 */
export function getToolDisplayName(toolType: HistoryRecord['tool_type']): string {
  const names: Record<HistoryRecord['tool_type'], string> = {
    watermark: 'Remove Watermark',
    background: 'Change Background',
    compress: 'Compress',
    resize: 'Resize',
    transparency: 'Remove Fake Transparency'
  }
  return names[toolType] || toolType
}

/**
 * 获取工具类型的图标
 */
export function getToolIcon(toolType: HistoryRecord['tool_type']): string {
  const icons: Record<HistoryRecord['tool_type'], string> = {
    watermark: '🔍',
    background: '🎨',
    compress: '📦',
    resize: '📐',
    transparency: '🔲'
  }
  return icons[toolType] || '📷'
}
