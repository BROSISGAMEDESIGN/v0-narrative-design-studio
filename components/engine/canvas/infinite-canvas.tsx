'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SceneNode } from './scene-node'
import { useEngineStore } from '@/lib/store'
import { createDefaultScene, DEFAULT_DIALOGUE_TREE } from '@/lib/types'

const nodeTypes = {
  scene: SceneNode,
}

// Custom edge style with neon glow
const edgeStyle = {
  stroke: 'var(--engine-neon)',
  strokeWidth: 2,
  filter: 'drop-shadow(0 0 4px var(--engine-neon))',
}

export function InfiniteCanvas() {
  const { scenes, addScene, updateScene, chapters, updateDialogueOption } = useEngineStore()

  // Convert scenes to React Flow nodes
  const initialNodes = useMemo(() => 
    scenes.map((scene) => ({
      id: scene.id,
      type: 'scene',
      position: scene.position,
      data: { scene },
    }))
  , [scenes])

  // Build edges from dialogue tree connections
  const initialEdges = useMemo(() => {
    const edges: Edge[] = []
    scenes.forEach((scene) => {
      const dialogueTree = scene.dialogueTree || DEFAULT_DIALOGUE_TREE
      dialogueTree.answers.forEach((option, index) => {
        if (option.targetSceneId) {
          edges.push({
            id: `${scene.id}-${option.id}`,
            source: scene.id,
            sourceHandle: option.id,
            target: option.targetSceneId,
            animated: true,
            style: edgeStyle,
            label: `A${index + 1}`,
            labelStyle: { 
              fill: 'var(--engine-cyan)', 
              fontSize: 10, 
              fontWeight: 'bold' 
            },
            labelBgStyle: { 
              fill: 'var(--engine-panel)', 
              fillOpacity: 0.8 
            },
          })
        }
      })
    })
    return edges
  }, [scenes])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

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

  // Sync edges when scenes change (for dialogue tree connections)
  useEffect(() => {
    const newEdges: Edge[] = []
    scenes.forEach((scene) => {
      const dialogueTree = scene.dialogueTree || DEFAULT_DIALOGUE_TREE
      dialogueTree.answers.forEach((option, index) => {
        if (option.targetSceneId) {
          newEdges.push({
            id: `${scene.id}-${option.id}`,
            source: scene.id,
            sourceHandle: option.id,
            target: option.targetSceneId,
            animated: true,
            style: edgeStyle,
            label: `A${index + 1}`,
            labelStyle: { 
              fill: 'var(--engine-cyan)', 
              fontSize: 10, 
              fontWeight: 'bold' 
            },
            labelBgStyle: { 
              fill: 'var(--engine-panel)', 
              fillOpacity: 0.8 
            },
          })
        }
      })
    })
    setEdges(newEdges)
  }, [scenes, setEdges])

  // Handle node position changes
  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node) => {
      updateScene(node.id, { position: node.position })
    },
    [updateScene]
  )

  // Handle connections - update dialogue tree when edges are created via drag
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return
      
      // If sourceHandle is provided, it's an answer option handle
      if (connection.sourceHandle && connection.sourceHandle !== 'default') {
        // Update the dialogue option with the target scene ID
        updateDialogueOption(connection.source, connection.sourceHandle, {
          targetSceneId: connection.target
        })
      }
      
      // Add visual edge (will be synced from store anyway)
      setEdges((eds) => addEdge({
        ...connection,
        animated: true,
        style: edgeStyle,
      }, eds))
    },
    [setEdges, updateDialogueOption]
  )

  // Handle edge deletion
  const onEdgesDelete = useCallback(
    (deletedEdges: Edge[]) => {
      deletedEdges.forEach((edge) => {
        if (edge.sourceHandle && edge.sourceHandle !== 'default') {
          // Clear the target from the dialogue option
          updateDialogueOption(edge.source, edge.sourceHandle, {
            targetSceneId: null
          })
        }
      })
    },
    [updateDialogueOption]
  )

  // Add new scene
  const handleAddScene = useCallback(() => {
    // Find a good position for the new node
    const existingPositions = scenes.map(s => s.position)
    let newX = 100
    let newY = 100
    
    if (existingPositions.length > 0) {
      const maxX = Math.max(...existingPositions.map(p => p.x))
      newX = maxX + 450
      newY = existingPositions[existingPositions.length - 1]?.y || 100
    }

    const newScene = createDefaultScene(
      { x: newX, y: newY },
      chapters[0]?.id
    )
    
    addScene(newScene)
  }, [scenes, chapters, addScene])

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid
        snapGrid={[20, 20]}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          animated: true,
          style: edgeStyle,
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
          style={{
            backgroundColor: 'var(--engine-panel)',
          }}
          nodeColor={(node) => {
            const scene = scenes.find(s => s.id === node.id)
            const chapter = chapters.find(c => c.id === scene?.chapterId)
            return chapter?.color || 'var(--engine-neon)'
          }}
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
