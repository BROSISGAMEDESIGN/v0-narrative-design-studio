'use client'

import { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Plus, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SceneNode } from './scene-node'
import { useEngineStore } from '@/lib/store'
import type { Scene } from '@/lib/types'

const nodeTypes = {
  scene: SceneNode,
}

export function InfiniteCanvas() {
  const { scenes, addScene, updateScene, chapters } = useEngineStore()

  // Convert scenes to React Flow nodes
  const initialNodes = useMemo(() => 
    scenes.map((scene) => ({
      id: scene.id,
      type: 'scene',
      position: scene.position,
      data: { scene },
    }))
  , [scenes])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Sync nodes with store when scenes change
  useEffect(() => {
    setNodes(
      scenes.map((scene) => ({
        id: scene.id,
        type: 'scene',
        position: scene.position,
        data: { scene },
      }))
    )
  }, [scenes, setNodes])

  // Handle node position changes
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateScene(node.id, { position: node.position })
    },
    [updateScene]
  )

  // Handle connections
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({
        ...connection,
        animated: true,
        style: { stroke: 'var(--engine-neon)', strokeWidth: 2 },
      }, eds))
    },
    [setEdges]
  )

  // Add new scene
  const handleAddScene = useCallback(() => {
    // Find a good position for the new node
    const existingPositions = scenes.map(s => s.position)
    let newX = 100
    let newY = 100
    
    if (existingPositions.length > 0) {
      const maxX = Math.max(...existingPositions.map(p => p.x))
      newX = maxX + 400
      newY = existingPositions[existingPositions.length - 1]?.y || 100
    }

    const newScene: Scene = {
      id: `scene-${Date.now()}`,
      media: { type: null, url: null, name: null },
      dialogue: '',
      characterId: null,
      duration: 5,
      chapterId: chapters[0]?.id || null,
      position: { x: newX, y: newY },
      createdAt: Date.now(),
      isCompleted: false,
    }
    
    addScene(newScene)
  }, [scenes, chapters, addScene])

  // Fit view to all nodes
  const handleFitView = useCallback(() => {
    // The fit view functionality is handled by the Controls component
    // This is a placeholder for a custom fit view if needed
  }, [])

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: 'var(--engine-neon)', strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1}
          color="var(--border)"
        />
        <Controls />
        <MiniMap 
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        
        {/* Custom panel for add button */}
        <Panel position="top-right" className="flex gap-2">
          <Button
            onClick={handleAddScene}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Scene
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  )
}
