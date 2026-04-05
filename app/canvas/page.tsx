'use client'

import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with React Flow
const InfiniteCanvas = dynamic(
  () => import('@/components/engine/canvas/infinite-canvas').then(mod => mod.InfiniteCanvas),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading canvas...</div>
      </div>
    )
  }
)

export default function CanvasPage() {
  return <InfiniteCanvas />
}
