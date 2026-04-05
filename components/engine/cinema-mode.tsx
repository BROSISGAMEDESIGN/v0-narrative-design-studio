'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, SkipForward, SkipBack } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useEngineStore } from '@/lib/store'

interface CinemaModeProps {
  isOpen: boolean
  onClose: () => void
}

export function CinemaMode({ isOpen, onClose }: CinemaModeProps) {
  const { scenes, characters } = useEngineStore()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)

  // Get scenes that belong to a chapter, sorted by position
  const orderedScenes = scenes
    .filter(s => s.chapterId)
    .sort((a, b) => a.position.x - b.position.x)

  const currentScene = orderedScenes[currentIndex]
  const currentCharacter = currentScene 
    ? characters.find(c => c.id === currentScene.characterId) 
    : null

  const totalDuration = orderedScenes.reduce((sum, s) => sum + s.duration, 0)
  const elapsedDuration = orderedScenes
    .slice(0, currentIndex)
    .reduce((sum, s) => sum + s.duration, 0)

  // Auto-advance based on duration
  useEffect(() => {
    if (!isOpen || isPaused || !currentScene) return

    const duration = currentScene.duration * 1000 // Convert to ms
    let elapsed = 0
    const interval = 100

    const timer = setInterval(() => {
      elapsed += interval
      setProgress((elapsed / duration) * 100)

      if (elapsed >= duration) {
        if (currentIndex < orderedScenes.length - 1) {
          setCurrentIndex(prev => prev + 1)
          setProgress(0)
        } else {
          setIsPaused(true)
        }
      }
    }, interval)

    return () => clearInterval(timer)
  }, [isOpen, isPaused, currentScene, currentIndex, orderedScenes.length])

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
      setIsPaused(false)
      setProgress(0)
    }
  }, [isOpen])

  const handleNext = useCallback(() => {
    if (currentIndex < orderedScenes.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setProgress(0)
    }
  }, [currentIndex, orderedScenes.length])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setProgress(0)
    }
  }, [currentIndex])

  // Keyboard controls
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case ' ':
          e.preventDefault()
          setIsPaused(prev => !prev)
          break
        case 'ArrowRight':
          handleNext()
          break
        case 'ArrowLeft':
          handlePrev()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, handleNext, handlePrev])

  if (orderedScenes.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex flex-col"
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Main content */}
          <div className="flex-1 flex items-center justify-center relative">
            <AnimatePresence mode="wait">
              {currentScene && (
                <motion.div
                  key={currentScene.id}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {/* Media */}
                  {currentScene.media.url && (
                    <div className="absolute inset-0">
                      {currentScene.media.type === 'video' ? (
                        <video
                          src={currentScene.media.url}
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          loop
                        />
                      ) : (
                        <img
                          src={currentScene.media.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Gradient overlay for text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    </div>
                  )}

                  {/* Dialogue */}
                  {currentScene.dialogue && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="absolute bottom-24 left-0 right-0 px-8"
                    >
                      <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4">
                          {/* Character avatar */}
                          {currentCharacter && (
                            <div 
                              className="shrink-0 w-16 h-16 rounded-full border-2 flex items-center justify-center text-lg font-bold"
                              style={{ 
                                borderColor: currentCharacter.dialogueColor,
                                backgroundColor: `${currentCharacter.dialogueColor}20`
                              }}
                            >
                              {currentCharacter.avatar ? (
                                <img 
                                  src={currentCharacter.avatar} 
                                  alt={currentCharacter.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span style={{ color: currentCharacter.dialogueColor }}>
                                  {currentCharacter.name.charAt(0)}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Dialogue text */}
                          <div className="flex-1">
                            {currentCharacter && (
                              <p 
                                className="text-sm font-semibold mb-1"
                                style={{ color: currentCharacter.dialogueColor }}
                              >
                                {currentCharacter.name}
                              </p>
                            )}
                            <p className="text-xl text-white leading-relaxed">
                              {currentScene.dialogue}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Controls */}
          <div className="p-6 space-y-4">
            {/* Scene progress */}
            <Progress value={progress} className="h-1" />

            {/* Total progress and controls */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">
                Scene {currentIndex + 1} of {orderedScenes.length}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="text-white hover:bg-white/10 disabled:opacity-30"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPaused(!isPaused)}
                  className="text-white hover:bg-white/10"
                >
                  {isPaused ? (
                    <Play className="h-5 w-5" />
                  ) : (
                    <Pause className="h-5 w-5" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={currentIndex === orderedScenes.length - 1}
                  className="text-white hover:bg-white/10 disabled:opacity-30"
                >
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              <span className="text-sm text-white/60">
                {Math.floor(elapsedDuration / 60)}:{String(elapsedDuration % 60).padStart(2, '0')} / 
                {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
