import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Loading, Alert, ResearchContextBar } from '../components';
import { Search, Percent } from 'lucide-react';

export const PrecedentsPage = () => {
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeDocId, setActiveDocId] = useState(null);
    const location = useLocation();

    useEffect(() => {
        loadSimilarCases();
    }, []);

    const loadSimilarCases = async (specifiedDocId = null) => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const urlParams = new URLSearchParams(location.search);
            let targetDocId = specifiedDocId || urlParams.get('docId');

            if (!targetDocId) {
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

            setActiveDocId(targetDocId);

            const response = await fetch('http://localhost:8000/api/similar-cases', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ document_id: targetDocId })
            });
            if (!response.ok) throw new Error("Failed to load similar cases.");
            const data = await response.json();
            setCases(data.similar_cases);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Case Similarity & Precedent Finder
                </h1>
                <button onClick={() => loadSimilarCases()} className="btn-secondary">
                    <Search size={16} className="inline mr-2" /> Find Similar
                </button>
            </div>

            <ResearchContextBar 
                currentDocId={activeDocId} 
                onContextChange={(newId) => loadSimilarCases(newId)} 
            />
            
            <p className="text-gray-600 dark:text-gray-400">
                Displays the top similar historical cases using semantic embeddings and cosine similarity.
            </p>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            {loading ? (
                <div className="mt-10"><Loading message="Computing vector similarity across case dataset..." /></div>
            ) : (
                <div className="grid gap-6 mt-6">
                    {cases.map((c, i) => (
                        <Card key={i} className="hover:shadow-lg transition-shadow border-l-4 border-indigo-500">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{c.case_name}</h3>
                                <div className="flex items-center gap-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100 px-3 py-1 rounded-full text-sm font-bold">
                                    <Percent size={14} /> {c.similarity_percent} Match
                                </div>
                            </div>
                            <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded">
                                    <p className="font-semibold text-gray-500 uppercase text-xs mb-1">Key Differences from Current Case</p>
                                    <p className="text-gray-800 dark:text-gray-200">{c.key_differences}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

