'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Pause, SkipForward, SkipBack } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useEngineStore } from '@/lib/store'
import type { Scene } from '@/lib/types'
import { DEFAULT_DIALOGUE_TREE } from '@/lib/types'

interface CinemaModeProps {
  isOpen: boolean
  onClose: () => void
}

export function CinemaMode({ isOpen, onClose }: CinemaModeProps) {
  const { scenes, characters } = useEngineStore()
  const musicRef = useRef<HTMLAudioElement>(null)
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [sceneHistory, setSceneHistory] = useState<string[]>([])

  // Play scene music when scene changes
  useEffect(() => {
    const scene = scenes.find(s => s.id === currentSceneId)
    if (!scene || !musicRef.current) return
    
    if (scene.music?.url) {
      musicRef.current.src = scene.music.url
      musicRef.current.play().catch(() => {}) // Ignore autoplay errors
    } else {
      musicRef.current.pause()
      musicRef.current.src = ''
    }
  }, [currentSceneId, scenes])

  // Get scenes sorted by position for initial playback
  const orderedScenes = useMemo(() => 
    scenes
      .filter(s => s.chapterId)
      .sort((a, b) => a.position.x - b.position.x)
  , [scenes])

  const currentScene = scenes.find(s => s.id === currentSceneId)
  const dialogueTree = currentScene?.dialogueTree || DEFAULT_DIALOGUE_TREE
  const questionCharacter = currentScene 
    ? characters.find(c => c.id === dialogueTree.questionCharacterId) 
    : null

  // Check if current scene has branching options
  const hasBranchingOptions = dialogueTree.answers.length > 0

  const totalDuration = orderedScenes.reduce((sum, s) => sum + s.duration, 0)
  const currentIndex = orderedScenes.findIndex(s => s.id === currentSceneId)
  const elapsedDuration = orderedScenes
    .slice(0, Math.max(0, currentIndex))
    .reduce((sum, s) => sum + s.duration, 0)

  // Auto-advance based on duration (only if no branching options)
  useEffect(() => {
    if (!isOpen || isPaused || !currentScene || hasBranchingOptions) return

    const duration = currentScene.duration * 1000 // Convert to ms
    let elapsed = 0
    const interval = 100

    const timer = setInterval(() => {
      elapsed += interval
      setProgress((elapsed / duration) * 100)

      if (elapsed >= duration) {
        // Find next scene in order
        const nextIndex = currentIndex + 1
        if (nextIndex < orderedScenes.length) {
          setSceneHistory(prev => [...prev, currentScene.id])
          setCurrentSceneId(orderedScenes[nextIndex].id)
          setProgress(0)
        } else {
          setIsPaused(true)
        }
      }
    }, interval)

    return () => clearInterval(timer)
  }, [isOpen, isPaused, currentScene, currentIndex, orderedScenes, hasBranchingOptions])

  // Reset when opening
  useEffect(() => {
    if (isOpen && orderedScenes.length > 0) {
      setCurrentSceneId(orderedScenes[0].id)
      setIsPaused(false)
      setProgress(0)
      setSceneHistory([])
    }
  }, [isOpen, orderedScenes])

  const handleNext = useCallback(() => {
    if (!currentScene) return
    
    const nextIndex = currentIndex + 1
    if (nextIndex < orderedScenes.length) {
      setSceneHistory(prev => [...prev, currentScene.id])
      setCurrentSceneId(orderedScenes[nextIndex].id)
      setProgress(0)
    }
  }, [currentScene, currentIndex, orderedScenes])

  const handlePrev = useCallback(() => {
    if (sceneHistory.length > 0) {
      const prevSceneId = sceneHistory[sceneHistory.length - 1]
      setSceneHistory(prev => prev.slice(0, -1))
      setCurrentSceneId(prevSceneId)
      setProgress(0)
    } else if (currentIndex > 0) {
      setCurrentSceneId(orderedScenes[currentIndex - 1].id)
      setProgress(0)
    }
  }, [sceneHistory, currentIndex, orderedScenes])

  // Handle branching option selection
  const handleSelectOption = useCallback((targetSceneId: string | null) => {
    if (!currentScene) return
    
    setSceneHistory(prev => [...prev, currentScene.id])
    
    if (targetSceneId) {
      setCurrentSceneId(targetSceneId)
    } else {
      // No target - go to next scene in order
      const nextIndex = currentIndex + 1
      if (nextIndex < orderedScenes.length) {
        setCurrentSceneId(orderedScenes[nextIndex].id)
      }
    }
    setProgress(0)
  }, [currentScene, currentIndex, orderedScenes])

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
          if (!hasBranchingOptions) {
            setIsPaused(prev => !prev)
          }
          break
        case 'ArrowRight':
          if (!hasBranchingOptions) handleNext()
          break
        case 'ArrowLeft':
          handlePrev()
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
          // Number keys select branching options
          if (hasBranchingOptions) {
            const optionIndex = parseInt(e.key) - 1
            if (optionIndex < dialogueTree.answers.length) {
              handleSelectOption(dialogueTree.answers[optionIndex].targetSceneId)
            }
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, handleNext, handlePrev, hasBranchingOptions, dialogueTree.answers, handleSelectOption])

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
          {/* Hidden audio element for scene music */}
          <audio ref={musicRef} loop />
          
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

                  {/* Question Dialogue (Q) */}
                  {dialogueTree.questionText && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="absolute bottom-48 left-0 right-0 px-8"
                    >
                      <div className="max-w-4xl mx-auto">
                        <div className="flex items-start gap-4">
                          {/* Character avatar */}
                          {questionCharacter && (
                            <div 
                              className="shrink-0 w-16 h-16 rounded-full border-2 flex items-center justify-center text-lg font-bold"
                              style={{ 
                                borderColor: questionCharacter.dialogueColor,
                                backgroundColor: `${questionCharacter.dialogueColor}20`
                              }}
                            >
                              {questionCharacter.avatar ? (
                                <img 
                                  src={questionCharacter.avatar} 
                                  alt={questionCharacter.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span style={{ color: questionCharacter.dialogueColor }}>
                                  {questionCharacter.name.charAt(0)}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Dialogue text */}
                          <div className="flex-1">
                            {questionCharacter && (
                              <p 
                                className="text-sm font-semibold mb-1"
                                style={{ color: questionCharacter.dialogueColor }}
                              >
                                {questionCharacter.name}
                              </p>
                            )}
                            <p className="text-xl text-white leading-relaxed">
                              {dialogueTree.questionText}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Branching Options (A) - RPG Dialogue Wheel Style */}
                  {hasBranchingOptions && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="absolute bottom-24 left-0 right-0 px-8"
                    >
                      <div className="max-w-3xl mx-auto">
                        <div className="grid gap-3">
                          {dialogueTree.answers.map((option, index) => {
                            const optionCharacter = characters.find(c => c.id === option.characterId)
                            return (
                              <motion.button
                                key={option.id}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.7 + index * 0.1 }}
                                onClick={() => handleSelectOption(option.targetSceneId)}
                                className="flex items-center gap-4 p-4 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 hover:border-primary transition-all group text-left"
                              >
                                {/* Option number */}
                                <span className="shrink-0 w-8 h-8 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-sm font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                  {index + 1}
                                </span>
                                
                                {/* Character avatar (if any) */}
                                {optionCharacter && (
                                  <div 
                                    className="shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-bold"
                                    style={{ 
                                      borderColor: optionCharacter.dialogueColor,
                                      backgroundColor: `${optionCharacter.dialogueColor}20`
                                    }}
                                  >
                                    {optionCharacter.avatar ? (
                                      <img 
                                        src={optionCharacter.avatar} 
                                        alt={optionCharacter.name}
                                        className="w-full h-full rounded-full object-cover"
                                      />
                                    ) : (
                                      <span style={{ color: optionCharacter.dialogueColor }}>
                                        {optionCharacter.name.charAt(0)}
                                      </span>
                                    )}
                                  </div>
                                )}
                                
                                {/* Option text */}
                                <span 
                                  className="flex-1 text-lg"
                                  style={{ color: optionCharacter?.dialogueColor || 'white' }}
                                >
                                  {option.text || `Option ${index + 1}`}
                                </span>
                              </motion.button>
                            )
                          })}
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
            {/* Scene progress (only show if not branching) */}
            {!hasBranchingOptions && (
              <Progress value={progress} className="h-1" />
            )}

            {/* Total progress and controls */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">
                {currentScene?.title || `Scene ${currentIndex + 1}`} 
                {hasBranchingOptions && ' - Choose an option'}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrev}
                  disabled={sceneHistory.length === 0 && currentIndex === 0}
                  className="text-white hover:bg-white/10 disabled:opacity-30"
                >
                  <SkipBack className="h-5 w-5" />
                </Button>
                
                {!hasBranchingOptions && (
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
                )}
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={hasBranchingOptions || currentIndex === orderedScenes.length - 1}
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
