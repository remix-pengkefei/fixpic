import { useTranslation } from 'react-i18next'
import type { Tool } from '../types'

interface ToolSelectorProps {
  activeTool: Tool
  onToolChange: (tool: Tool) => void
}

export function ToolSelector({ activeTool, onToolChange }: ToolSelectorProps) {
  const { t } = useTranslation()

  const tools: { id: Tool; icon: string; labelKey: string }[] = [
    { id: 'ai-remove-bg', icon: '✨', labelKey: 'tools.aiRemoveBg' },
    { id: 'remove-watermark', icon: '💧', labelKey: 'tools.removeWatermark' },
    { id: 'remove-bg', icon: '🔲', labelKey: 'tools.removeFakeTransparency' },
    { id: 'compress', icon: '📦', labelKey: 'tools.compress' },
    { id: 'resize', icon: '📐', labelKey: 'tools.resize' },
  ]

  return (
    <div className="tool-selector">
      {tools.map(tool => (
        <button
          key={tool.id}
          className={`tool-btn ${activeTool === tool.id ? 'active' : ''}`}
          onClick={() => onToolChange(tool.id)}
        >
          <span className="tool-icon">{tool.icon}</span>
          <span>{t(tool.labelKey)}</span>
        </button>
      ))}
    </div>
  )
}
