import { useState, useRef, useCallback } from 'react'

interface BeforeAfterSliderProps {
  beforeImage: string
  afterImage: string
  beforeLabel?: string
  afterLabel?: string
  beforeAlt?: string
  afterAlt?: string
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
  beforeAlt = 'Before',
  afterAlt = 'After',
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.min(Math.max((x / rect.width) * 100, 0), 100)
    setSliderPosition(percentage)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    handleMove(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    handleMove(e.clientX)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    handleMove(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    handleMove(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  return (
    <div
      ref={containerRef}
      className="before-after-slider"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* After image (background) */}
      <div className="slider-image-container">
        <img src={afterImage} alt={afterAlt} className="slider-image" draggable={false} loading="lazy" />
        <span className="slider-label slider-label-after">{afterLabel}</span>
      </div>

      {/* Before image (clipped) */}
      <div
        className="slider-image-container slider-before"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img src={beforeImage} alt={beforeAlt} className="slider-image" draggable={false} loading="lazy" />
        <span className="slider-label slider-label-before">{beforeLabel}</span>
      </div>

      {/* Slider handle */}
      <div
        className="slider-handle"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="slider-line" />
        <div className="slider-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
            <polyline points="9 18 15 12 9 6" transform="translate(6, 0)" />
          </svg>
        </div>
      </div>
    </div>
  )
}
