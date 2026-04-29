import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, ResearchContextBar } from '../components';
import { Gavel, User, Scale, Activity } from 'lucide-react';

export const CourtroomPage = () => {
    const [messages, setMessages] = useState([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [error, setError] = useState('');
    const [activeDocId, setActiveDocId] = useState(null);
    const location = useLocation();

    const startSimulation = async (specifiedDocId = null) => {
        setIsSimulating(true);
        setMessages([]);
        setError('');

        const token = localStorage.getItem('token');
        
        try {
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

            const response = await fetch(`http://localhost:8000/api/courtroom/${targetDocId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error("Failed to start courtroom simulation.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (let line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.substring(6));
                        
                        setMessages(prev => {
                            // If typing, add temporary typing message
                            if (data.status === 'typing') {
                                return [...prev.filter(m => m.status !== 'typing'), data];
                            }
                            // If done, replace typing message with actual message
                            if (data.status === 'done') {
                                return [...prev.filter(m => m.status !== 'typing'), data];
                            }
                            return prev;
                        });
                    }
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSimulating(false);
        }
    };

    const getIconForSpeaker = (speaker) => {
        switch (speaker) {
            case 'Prosecutor': return <Activity size={20} className="text-red-500" />;
            case 'Defence': return <User size={20} className="text-blue-500" />;
            case 'Ethics': return <Scale size={20} className="text-green-500" />;
            case 'Judge': return <Gavel size={20} className="text-purple-500" />;
            default: return <User size={20} />;
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Gavel /> Courtroom Simulation Mode
                </h1>
                <button 
                    onClick={() => startSimulation()} 
                    disabled={isSimulating}
                    className="btn-primary"
                >
                    {isSimulating ? 'Simulation in Progress...' : 'Start Debate'}
                </button>
            </div>

            <ResearchContextBar 
                currentDocId={activeDocId} 
                onContextChange={(newId) => startSimulation(newId)} 
            />
            
            <p className="text-gray-600 dark:text-gray-400">
                Watch a real-time autonomous debate between the Prosecutor, Defence, and Ethics agents, concluding with a Judge's verdict.
            </p>

            {error && <div className="text-red-500 font-bold">{error}</div>}

            <Card className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900 flex flex-col space-y-4 p-6 border-2 border-gray-200 dark:border-slate-700">
                {messages.length === 0 && !isSimulating && (
                    <div className="text-center text-gray-400 mt-20">
                        Click 'Start Debate' to begin the courtroom simulation.
                    </div>
                )}
                
                {messages.map((msg, i) => (
                    <div 
                        key={i} 
                        className={`flex gap-4 ${msg.speaker === 'Prosecutor' ? 'flex-row' : msg.speaker === 'Defence' ? 'flex-row-reverse' : 'flex-row justify-center'}`}
                    >
                        <div className={`p-4 rounded-xl max-w-[80%] shadow-md ${
                            msg.speaker === 'Judge' ? 'bg-purple-100 dark:bg-purple-900 border border-purple-300 w-full text-center' :
                            msg.speaker === 'Ethics' ? 'bg-green-100 dark:bg-green-900 border border-green-300 w-full text-center' :
                            msg.speaker === 'Prosecutor' ? 'bg-white dark:bg-slate-800 border border-red-200' :
                            'bg-blue-50 dark:bg-slate-800 border border-blue-200'
                        }`}>
                            <div className={`flex items-center gap-2 font-bold mb-2 ${
                                msg.speaker === 'Judge' ? 'justify-center text-purple-800 dark:text-purple-200 text-lg' :
                                msg.speaker === 'Ethics' ? 'justify-center text-green-800 dark:text-green-200' :
                                msg.speaker === 'Prosecutor' ? 'text-red-800 dark:text-red-200' :
                                'text-blue-800 dark:text-blue-200 flex-row-reverse'
                            }`}>
                                {msg.speaker !== 'Judge' && msg.speaker !== 'Ethics' && getIconForSpeaker(msg.speaker)}
                                {msg.speaker.toUpperCase()}
                                {(msg.speaker === 'Judge' || msg.speaker === 'Ethics') && getIconForSpeaker(msg.speaker)}
                            </div>
                            
                            {msg.status === 'typing' ? (
                                <div className="flex gap-1 items-center justify-center py-2">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                                </div>
                            ) : (
                                <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                    {msg.message}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </Card>
        </div>
    );
};

