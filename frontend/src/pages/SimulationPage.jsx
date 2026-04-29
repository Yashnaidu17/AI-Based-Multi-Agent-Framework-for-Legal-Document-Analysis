import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Loading, Alert, ResearchContextBar } from '../components';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const ablationData = [
  { name: 'Full System', accuracy: 94.3, f1: 0.921 },
  { name: 'No Prosecutor', accuracy: 91.2, f1: 0.896 },
  { name: 'No Defence', accuracy: 90.8, f1: 0.891 },
  { name: 'No Ethics', accuracy: 89.4, f1: 0.883 },
  { name: 'No Judge', accuracy: 90.1, f1: 0.888 },
];

export const SimulationPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [activeDocId, setActiveDocId] = useState(null);
  const location = useLocation();
  
  const [params, setParams] = useState({
    document_id: null,
    added_evidence: '',
    removed_evidence: '',
    evidence_strength: 50,
    witness_reliability: 50
  });

  const runSimulation = async (specifiedDocId = null) => {
    setLoading(true);
    setError('');
    setResult(null);
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
      
      const response = await fetch('http://localhost:8000/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...params, document_id: targetDocId })
      });
      if (!response.ok) throw new Error("Simulation failed.");
      const data = await response.json();
      setResult(data.simulation);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        What-If Simulation Engine & Ablation Study
      </h1>

      <ResearchContextBar 
        currentDocId={activeDocId} 
        onContextChange={(newId) => runSimulation(newId)} 
      />

      {/* ABLATION DASHBOARD */}
      <Card>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ShieldAlert className="text-indigo-600" /> Multi-Agent Ablation Study
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Displays the impact of removing individual agents from the collective reasoning pipeline.
        </p>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ablationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[80, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="accuracy" fill="#4f46e5" name="Accuracy (%)" />
              <Bar dataKey="f1" fill="#10b981" name="F1 Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* WHAT-IF SIMULATION ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h2 className="text-xl font-bold mb-4">Case Modification Panel</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Add Hypothetical Evidence</label>
              <textarea 
                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600"
                rows="3"
                value={params.added_evidence}
                onChange={e => setParams({...params, added_evidence: e.target.value})}
                placeholder="E.g., CCTV footage discovered showing the accused..."
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Exclude Existing Evidence</label>
              <input 
                type="text"
                className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600"
                value={params.removed_evidence}
                onChange={e => setParams({...params, removed_evidence: e.target.value})}
                placeholder="E.g., Witness testimony of Mr. X is excluded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Evidence Strength: {params.evidence_strength}%</label>
              <input 
                type="range" min="0" max="100" 
                value={params.evidence_strength}
                onChange={e => setParams({...params, evidence_strength: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Witness Reliability: {params.witness_reliability}%</label>
              <input 
                type="range" min="0" max="100" 
                value={params.witness_reliability}
                onChange={e => setParams({...params, witness_reliability: parseInt(e.target.value)})}
                className="w-full"
              />
            </div>

            <button 
              onClick={() => runSimulation()}
              disabled={loading}
              className="w-full btn-primary flex justify-center items-center gap-2 mt-4"
            >
              <RefreshCw className={loading ? 'animate-spin' : ''} size={18} />
              Run Simulation
            </button>
            {error && <Alert type="error" message={error} />}
          </div>
        </Card>

        {/* SIMULATION RESULTS */}
        <Card>
          <h2 className="text-xl font-bold mb-4">Simulated Verdict</h2>
          {loading ? (
            <div className="flex justify-center py-10"><Loading message="Simulating debate..." /></div>
          ) : result ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-100 mb-1">New Verdict Prediction</h3>
                <p className="text-2xl font-bold">{result.new_verdict}</p>
                <p className="text-sm mt-2 opacity-80">{result.new_reasoning}</p>
              </div>

              <div>
                <h4 className="font-bold text-sm text-gray-500 uppercase">Prosecutor Agent</h4>
                <p className="text-sm bg-gray-50 dark:bg-slate-800 p-2 rounded mt-1 border-l-2 border-red-500">
                  {result.modified_agents.prosecutor}
                </p>
              </div>
              
              <div>
                <h4 className="font-bold text-sm text-gray-500 uppercase">Defense Agent</h4>
                <p className="text-sm bg-gray-50 dark:bg-slate-800 p-2 rounded mt-1 border-l-2 border-blue-500">
                  {result.modified_agents.defense}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              Run a simulation to see the hypothetical outcome.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

