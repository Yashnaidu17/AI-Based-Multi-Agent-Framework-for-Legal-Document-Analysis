import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactFlow, { Background, Controls, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { Card, Alert, Loading, ResearchContextBar } from '../components';
import { authService } from '../services';

// Helper to fetch graph data
const fetchGraphData = async (specifiedDocId = null) => {
    const token = localStorage.getItem('token');
    
    let targetDocId = specifiedDocId;

    if (!targetDocId) {
        // First, fetch the user's history to get the latest document ID
        const historyRes = await fetch('http://localhost:8000/api/history', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!historyRes.ok) throw new Error("Failed to fetch history");
        const historyData = await historyRes.json();
        
        if (!historyData.history || historyData.history.length === 0) {
            throw new Error("No documents found. Please analyze a document first.");
        }
        
        targetDocId = historyData.history[0].id;
    }

    const response = await fetch('http://localhost:8000/api/graph', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ document_id: targetDocId })
    });
    if (!response.ok) throw new Error("Failed to load graph");
    const data = await response.json();
    return { graph: data.graph, docId: targetDocId };
};

export const GraphPage = () => {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeDocId, setActiveDocId] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const docId = params.get('docId');
        loadGraph(docId);
    }, [location.search]);

    const loadGraph = async (docId) => {
        setLoading(true);
        try {
            const res = await fetchGraphData(docId);
            const graphData = res.graph;
            setActiveDocId(res.docId);
            
            // Format for React Flow
            const rfNodes = graphData.nodes.map((n, i) => ({
                id: n.id,
                position: { x: (i % 3) * 250, y: Math.floor(i / 3) * 150 },
                data: { label: n.label },
                style: {
                    background: n.type === 'claim' ? '#ebf8ff' : '#f0fff4',
                    border: '1px solid #3182ce',
                    borderRadius: '8px',
                    padding: '10px',
                    width: 200,
                    fontWeight: 'bold',
                    color: '#2d3748'
                }
            }));
            
            const rfEdges = graphData.edges.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target,
                label: e.label,
                animated: true,
                style: { stroke: e.label === 'supports' ? '#38a169' : '#e53e3e', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: e.label === 'supports' ? '#38a169' : '#e53e3e' }
            }));

            setNodes(rfNodes);
            setEdges(rfEdges);
        } catch (err) {
            setError(err.message || "Could not load argument graph.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Argument Graph Visualization
            </h1>

            <ResearchContextBar 
                currentDocId={activeDocId} 
                onContextChange={(newId) => loadGraph(newId)} 
            />

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            
            <Card className="flex-1 min-h-[600px] p-0 overflow-hidden relative">
                {loading ? (
                    <Loading message="Generating Legal Argument Graph..." />
                ) : (
                    <div style={{ width: '100%', height: '600px' }}>
                        <ReactFlow nodes={nodes} edges={edges} fitView>
                            <Background />
                            <Controls />
                        </ReactFlow>
                    </div>
                )}
            </Card>
            
            <div className="mt-4 flex gap-4 text-sm font-medium">
                <span className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div> Supports Edge</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div> Contradicts Edge</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-100 border border-blue-400 rounded"></div> Claim Node</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 bg-green-50 border border-green-400 rounded"></div> Evidence Node</span>
            </div>
        </div>
    );
};

