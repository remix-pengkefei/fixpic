import { useTranslation } from 'react-i18next'

interface CompressOptionsProps {
  quality: number
  setQuality: (q: number) => void
  outputFormat: 'webp' | 'png' | 'jpeg'
  setOutputFormat: (f: 'webp' | 'png' | 'jpeg') => void
}

export function CompressOptions({ quality, setQuality, outputFormat, setOutputFormat }: CompressOptionsProps) {
  const { t } = useTranslation()

  return (
    <div className="options">
      <div className="option-group">
        <label>{t('options.outputFormat')}</label>
        <div className="format-btns">
          {(['webp', 'jpeg', 'png'] as const).map(fmt => (
            <button
              key={fmt}
              className={outputFormat === fmt ? 'active' : ''}
              onClick={() => setOutputFormat(fmt)}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="option-group">
        <label>
          {t('options.compression')} {outputFormat === 'png'
            ? ''
            : `${quality}%${quality >= 80 ? ` (${t('options.highQuality')})` : quality >= 50 ? ` (${t('options.slightLoss')})` : ` (${t('options.poorQuality')})`}`}
        </label>
        {outputFormat === 'png' ? (
          <div style={{ fontSize: '12px', color: '#999' }}>{t('options.pngLossless')}</div>
        ) : (
          <input
            type="range"
            min="10"
            max="100"
            value={quality}
            onChange={e => setQuality(Number(e.target.value))}
          />
        )}
      </div>
    </div>
  )
}

interface ResizeOptionsProps {
  resizeWidth: number | null
  setResizeWidth: (w: number | null) => void
  resizeHeight: number | null
  setResizeHeight: (h: number | null) => void
  keepAspectRatio: boolean
  setKeepAspectRatio: (k: boolean) => void
  resizeFormat: 'webp' | 'png' | 'jpeg'
  setResizeFormat: (f: 'webp' | 'png' | 'jpeg') => void
}

export function ResizeOptions({
  resizeWidth,
  setResizeWidth,
  resizeHeight,
  setResizeHeight,
  keepAspectRatio,
  setKeepAspectRatio,
  resizeFormat,
  setResizeFormat,
}: ResizeOptionsProps) {
  const { t } = useTranslation()

  return (
    <div className="options">
      <div className="option-group">
        <label>{t('options.width')}</label>
        <div className="width-input">
          <input
            type="number"
            placeholder={t('options.auto')}
            value={resizeWidth || ''}
            onChange={e => setResizeWidth(e.target.value ? Number(e.target.value) : null)}
          />
          <span>{t('options.px')}</span>
        </div>
      </div>

      <div className="option-group">
        <label>{t('options.height')}</label>
        <div className="width-input">
          <input
            type="number"
            placeholder={t('options.auto')}
            value={resizeHeight || ''}
            onChange={e => setResizeHeight(e.target.value ? Number(e.target.value) : null)}
          />
          <span>{t('options.px')}</span>
        </div>
      </div>

      <div className="option-group">
        <label>{t('options.keepAspectRatio')}</label>
        <div className="format-btns">
          <button
            className={keepAspectRatio ? 'active' : ''}
            onClick={() => setKeepAspectRatio(true)}
          >
            {t('options.yes')}
          </button>
          <button
            className={!keepAspectRatio ? 'active' : ''}
            onClick={() => setKeepAspectRatio(false)}
          >
            {t('options.no')}
          </button>
        </div>
      </div>

      <div className="option-group">
        <label>{t('options.outputFormat')}</label>
        <div className="format-btns">
          {(['png', 'webp', 'jpeg'] as const).map(fmt => (
            <button
              key={fmt}
              className={resizeFormat === fmt ? 'active' : ''}
              onClick={() => setResizeFormat(fmt)}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface WatermarkOptionsProps {
  removeText: boolean
  setRemoveText: (r: boolean) => void
}

export function WatermarkOptions({ removeText, setRemoveText }: WatermarkOptionsProps) {
  const { t } = useTranslation()

  return (
    <div className="options" style={{ marginBottom: '20px' }}>
      <div className="option-group">
        <label>{t('options.removeText')}</label>
        <div className="format-btns">
          <button
            className={removeText ? 'active' : ''}
            onClick={() => setRemoveText(true)}
          >
            {t('options.yes')}
          </button>
          <button
            className={!removeText ? 'active' : ''}
            onClick={() => setRemoveText(false)}
          >
            {t('options.no')}
          </button>
        </div>
      </div>
    </div>
  )
}
