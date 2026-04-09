'use client'

import { useState } from 'react'
import { Header } from './header'
import { Sidebar } from './sidebar'
import { CinemaMode } from './cinema-mode'
import { SupabaseEngineSync } from './supabase-engine-sync'

interface EngineLayoutProps {
  children: React.ReactNode
}

export function EngineLayout({ children }: EngineLayoutProps) {
  const [isCinemaOpen, setIsCinemaOpen] = useState(false)

  return (
    <SupabaseEngineSync>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Header onPlay={() => setIsCinemaOpen(true)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>

        <CinemaMode
          isOpen={isCinemaOpen}
          onClose={() => setIsCinemaOpen(false)}
        />
      </div>
    </SupabaseEngineSync>
  )
}
