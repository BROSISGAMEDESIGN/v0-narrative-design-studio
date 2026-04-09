'use client'

import { useEffect, useRef, useState } from 'react'
import {
  clearLegacyZustandPersist,
  hasMeaningfulLocalData,
  isLikelyEmptyProject,
  mergeEngineState,
  pickEngineState,
  readLegacyZustandPersist,
} from '@/lib/engine-state-sync'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { useEngineStore } from '@/lib/store'
import { DEFAULT_ENGINE_STATE } from '@/lib/types'

const PROJECT_SLUG = process.env.NEXT_PUBLIC_ENGINE_PROJECT_SLUG ?? 'main'
const SAVE_DEBOUNCE_MS = 900
const REMOTE_SILENCE_MS = 1200

interface SupabaseEngineSyncProps {
  children: React.ReactNode
}

export function SupabaseEngineSync({ children }: SupabaseEngineSyncProps) {
  const [ready, setReady] = useState(false)
  const remoteSilenceUntil = useRef(0)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      console.warn(
        '[Brosis] NEXT_PUBLIC_SUPABASE_URL veya NEXT_PUBLIC_SUPABASE_ANON_KEY eksik; veri yalnızca bu oturum için bellekte kalır.'
      )
      setReady(true)
      return
    }

    let cancelled = false
    let saveTimer: ReturnType<typeof setTimeout> | null = null
    let unsubscribeStore: (() => void) | null = null
    const channel = supabase.channel(`engine_projects:${PROJECT_SLUG}`)

    const silenceRemoteEcho = () => {
      remoteSilenceUntil.current = Date.now() + REMOTE_SILENCE_MS
    }

    const pushState = async (state: ReturnType<typeof pickEngineState>) => {
      if (Date.now() < remoteSilenceUntil.current) return
      const { error } = await supabase
        .from('engine_projects')
        .update({ state })
        .eq('slug', PROJECT_SLUG)
      if (error) {
        console.error('[Brosis] Supabase kayıt hatası:', error.message)
      }
    }

    const scheduleSave = () => {
      if (Date.now() < remoteSilenceUntil.current) return
      if (saveTimer) clearTimeout(saveTimer)
      saveTimer = setTimeout(() => {
        saveTimer = null
        void pushState(pickEngineState(useEngineStore.getState()))
      }, SAVE_DEBOUNCE_MS)
    }

    const flushSave = () => {
      if (Date.now() < remoteSilenceUntil.current) return
      if (saveTimer) {
        clearTimeout(saveTimer)
        saveTimer = null
      }
      void pushState(pickEngineState(useEngineStore.getState()))
    }

    void (async () => {
      const { data: row, error: fetchError } = await supabase
        .from('engine_projects')
        .select('state, updated_at')
        .eq('slug', PROJECT_SLUG)
        .maybeSingle()

      if (cancelled) return

      if (fetchError) {
        console.error('[Brosis] Supabase okuma hatası:', fetchError.message)
        setReady(true)
        return
      }

      const legacy = readLegacyZustandPersist()
      let nextState = row ? mergeEngineState(row.state) : { ...DEFAULT_ENGINE_STATE }

      if (!row) {
        const initial =
          legacy && hasMeaningfulLocalData(legacy) ? legacy : { ...DEFAULT_ENGINE_STATE }
        const { error: upsertError } = await supabase.from('engine_projects').upsert(
          { slug: PROJECT_SLUG, state: initial },
          { onConflict: 'slug' }
        )
        if (upsertError) {
          console.error('[Brosis] Supabase ilk kayıt hatası:', upsertError.message)
        } else if (legacy && hasMeaningfulLocalData(legacy)) {
          clearLegacyZustandPersist()
        }
        nextState = initial
      } else if (legacy && isLikelyEmptyProject(nextState) && hasMeaningfulLocalData(legacy)) {
        silenceRemoteEcho()
        const migrated = legacy
        const { error: migrateError } = await supabase
          .from('engine_projects')
          .update({ state: migrated })
          .eq('slug', PROJECT_SLUG)
        if (migrateError) {
          console.error('[Brosis] Eski veriyi taşıma hatası:', migrateError.message)
        } else {
          clearLegacyZustandPersist()
          nextState = migrated
        }
      }

      if (cancelled) return

      silenceRemoteEcho()
      useEngineStore.setState(nextState)

      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'engine_projects',
          filter: `slug=eq.${PROJECT_SLUG}`,
        },
        (payload) => {
          const raw = (payload.new as { state?: unknown })?.state
          if (raw === undefined) return
          silenceRemoteEcho()
          useEngineStore.setState(mergeEngineState(raw))
        }
      )

      await channel.subscribe()

      unsubscribeStore = useEngineStore.subscribe((state, prev) => {
        const a = pickEngineState(state)
        const b = pickEngineState(prev)
        if (
          a.projectName === b.projectName &&
          a.scenes === b.scenes &&
          a.chapters === b.chapters &&
          a.characters === b.characters &&
          a.teamNotes === b.teamNotes &&
          a.lastSaved === b.lastSaved
        ) {
          return
        }
        if (Date.now() < remoteSilenceUntil.current) return
        scheduleSave()
        if (a.lastSaved !== b.lastSaved) {
          flushSave()
        }
      })

      setReady(true)
    })()

    return () => {
      cancelled = true
      if (saveTimer) clearTimeout(saveTimer)
      unsubscribeStore?.()
      void supabase.removeChannel(channel)
    }
  }, [])

  if (!ready) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-sm text-muted-foreground">
        Proje senkronize ediliyor…
      </div>
    )
  }

  return <>{children}</>
}
