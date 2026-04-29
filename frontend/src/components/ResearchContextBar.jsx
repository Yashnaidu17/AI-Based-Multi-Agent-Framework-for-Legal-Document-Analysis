import React, { useState } from 'react';
import { Upload, FileText, ChevronDown } from 'lucide-react';
import { Card, Loading } from './UI';
import { analysisService } from '../services';

export const ResearchContextBar = ({ onContextChange, currentDocId }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [fileName, setFileName] = useState('');

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setError('');
        try {
            const result = await analysisService.analyzeDocument(file);
            setFileName(file.name);
            if (onContextChange) {
                onContextChange(result.document_id);
            }
        } catch (err) {
            setError('Failed to upload and analyze document.');
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="mb-6 bg-slate-50 dark:bg-slate-900/50 border-indigo-100 dark:border-indigo-900/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Active Research Context</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {fileName ? `Analyzing: ${fileName}` : currentDocId ? `Document ID: ${currentDocId}` : 'No document selected'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <label className={`btn-secondary flex items-center gap-2 cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload size={16} />
                        {isUploading ? 'Analyzing...' : 'Upload New Document'}
                        <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </Card>
    );
};
