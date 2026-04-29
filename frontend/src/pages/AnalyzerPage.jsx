import React from 'react'
import { DocumentUploader, Card, Loading, Alert } from '../components'
import { analysisService } from '../services'
import { Check, AlertCircle, Code, Scale, TrendingUp, TrendingDown, ArrowUpCircle, BookOpen, ExternalLink, Building2, Calendar } from 'lucide-react'

const CourtBadge = ({ sustainable }) => {
  const isYes = sustainable?.toUpperCase() === 'YES'
  return (
    <span
      className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide ${isYes
        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
        }`}
    >
      {isYes ? '✔ SUSTAINABLE' : '✘ NOT SUSTAINABLE'}
    </span>
  )
}

const CourtSustainabilitySection = ({ courtData }) => {
  if (!courtData) return null
  const courts = [
    { key: 'supreme_court', label: '🏛️ Supreme Court' },
    { key: 'high_court', label: '⚖️ High Court' },
    { key: 'lower_court', label: '📋 Lower Court / Sessions' },
  ]
  return (
    <Card>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Scale size={20} className="text-indigo-600" />
        Court Sustainability Analysis
      </h3>
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-600">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-600">
          <thead className="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Court</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Verdict</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Reason</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
            {courts.map(({ key, label }) => {
              const info = courtData[key] || {}
              return (
                <tr key={key}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{label}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <CourtBadge sustainable={info.sustainable} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{info.reason || '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

const VictimReasoningCard = ({ reasoning }) => {
  if (!reasoning) return null
  const isWin = reasoning.toUpperCase().includes('WIN') || reasoning.toUpperCase().includes('LIKELY TO WIN')
  return (
    <Card className={`border-l-4 ${isWin ? 'border-green-500 bg-green-50 dark:bg-green-900' : 'border-red-500 bg-red-50 dark:bg-red-900'}`}>
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
        {isWin
          ? <TrendingUp size={20} className="text-green-600" />
          : <TrendingDown size={20} className="text-red-600" />}
        Victim Outcome Prediction
      </h3>
      <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-3 ${isWin
        ? 'bg-green-200 text-green-900 dark:bg-green-700 dark:text-green-100'
        : 'bg-red-200 text-red-900 dark:bg-red-700 dark:text-red-100'
        }`}>
        {isWin ? '⬆ LIKELY TO WIN' : '⬇ LIKELY TO LOSE'}
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{reasoning}</p>
    </Card>
  )
}

const IpcOnAppealSection = ({ existingSections, appealSections }) => {
  if (!appealSections || appealSections.length === 0) return null
  return (
    <Card>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <ArrowUpCircle size={20} className="text-purple-600" />
        IPC Sections — Existing &amp; Recommended on Appeal
      </h3>

      {/* Existing Sections */}
      {existingSections && existingSections.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Currently Applied</p>
          <div className="flex flex-wrap gap-2">
            {existingSections.map((sec) => (
              <span key={sec} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm font-medium">
                Section {sec}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Additional on Appeal */}
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Recommended for Higher Court Appeal</p>
      <div className="space-y-3">
        {appealSections.map((item) => (
          <div key={item.section} className="flex gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700">
            <div className="shrink-0">
              <span className="inline-block px-2 py-1 bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100 rounded text-xs font-bold">§ {item.section}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{item.reason}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

const PrecedentsSection = ({ precedents }) => {
  if (!precedents || precedents.length === 0) return null
  return (
    <Card>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <BookOpen size={20} className="text-indigo-500" />
        Related Precedents from Indian Kanoon
      </h3>
      <div className="space-y-3">
        {precedents.map((p, i) => (
          <a
            key={p.tid || i}
            href={`https://indiankanoon.org/doc/${p.tid}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 rounded-lg border border-gray-200 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                  {p.title}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {p.docsource && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Building2 size={10} />{p.docsource}
                    </span>
                  )}
                  {p.publishdate && (
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar size={10} />{p.publishdate}
                    </span>
                  )}
                </div>
                {p.headline && (
                  <p
                    className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: p.headline.slice(0, 200) }}
                  />
                )}
              </div>
              <ExternalLink size={14} className="shrink-0 text-gray-400 group-hover:text-indigo-500 mt-0.5" />
            </div>
          </a>
        ))}
      </div>
    </Card>
  )
}

export const AnalyzerPage = () => {
  const [analysis, setAnalysis] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [selectedFile, setSelectedFile] = React.useState(null)
  const [documentId, setDocumentId] = React.useState(null)

  const handleFileSelect = async (file) => {
    setSelectedFile(file)
    setLoading(true)
    setError('')
    setAnalysis(null)
    setDocumentId(null)

    try {
      const result = await analysisService.analyzeDocument(file)
      setAnalysis(result.analysis)
      setDocumentId(result.document_id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Legal Document Analyzer
      </h1>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {!analysis ? (
        <Card className="mb-8">
          <DocumentUploader onFileSelect={handleFileSelect} />
        </Card>
      ) : null}

      {loading && <Loading message="Analyzing document..." />}

      {analysis && (
        <div className="space-y-6 fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analysis Results
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setAnalysis(null)
                  setSelectedFile(null)
                  setDocumentId(null)
                }}
                className="btn-secondary"
              >
                Analyze Another
              </button>
            </div>
          </div>

          {/* Research Navigation Section */}
          <Card className="bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30">
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider mb-4">
              Advanced Research Tools (Context: {selectedFile?.name})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <a href={`/graph?docId=${documentId}`} className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-indigo-100 dark:border-indigo-900/50 hover:shadow-md transition-all group">
                <span className="text-indigo-600 mb-1 group-hover:scale-110 transition-transform">📊</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Arg Graph</span>
              </a>
              <a href={`/simulation?docId=${documentId}`} className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-indigo-100 dark:border-indigo-900/50 hover:shadow-md transition-all group">
                <span className="text-indigo-600 mb-1 group-hover:scale-110 transition-transform">🧪</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Simulation</span>
              </a>
              <a href={`/courtroom?docId=${documentId}`} className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-indigo-100 dark:border-indigo-900/50 hover:shadow-md transition-all group">
                <span className="text-indigo-600 mb-1 group-hover:scale-110 transition-transform">⚖️</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Courtroom</span>
              </a>
              <a href={`/chatbot?docId=${documentId}`} className="flex flex-col items-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-indigo-100 dark:border-indigo-900/50 hover:shadow-md transition-all group">
                <span className="text-indigo-600 mb-1 group-hover:scale-110 transition-transform">💬</span>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Chat Context</span>
              </a>
            </div>
          </Card>

          {/* Case Facts */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Check size={20} className="text-green-600" />
              Case Facts
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {analysis.case_facts}
            </p>
          </Card>

          {/* IPC Sections */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Code size={20} className="text-blue-600" />
              Applicable IPC Sections
            </h3>
            <div className="flex flex-wrap gap-2">
              {analysis.ipc_sections?.map((section) => (
                <span
                  key={section}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full text-sm font-medium"
                >
                  Section {section}
                </span>
              ))}
            </div>
          </Card>

          {/* IPC on Appeal */}
          <IpcOnAppealSection existingSections={analysis.ipc_sections} appealSections={analysis.additional_ipc_on_appeal} />

          {/* Evidence Analysis */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Evidence Analysis
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {analysis.evidence_analysis}
            </p>
          </Card>

          {/* Mens Rea Analysis */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Mens Rea (Criminal Intent) Analysis
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {analysis.mens_rea_analysis}
            </p>
          </Card>

          {/* Procedural Issues */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <AlertCircle size={20} className="text-yellow-600" />
              Procedural Issues
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {analysis.procedural_issues}
            </p>
          </Card>

          {/* Legal Reasoning */}
          <Card>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
              Legal Reasoning
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              {analysis.legal_reasoning}
            </p>
          </Card>

          {/* Verdict */}
          <Card className="bg-green-50 dark:bg-green-900 border-l-4 border-green-600">
            <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
              Final Verdict
            </h3>
            <p className="text-green-800 dark:text-green-100 text-lg font-bold">
              {analysis.verdict}
            </p>
          </Card>

          {/* Court Sustainability */}
          <CourtSustainabilitySection courtData={analysis.court_sustainability} />

          {/* Victim Outcome */}
          <VictimReasoningCard reasoning={analysis.victim_reasoning} />

          {/* Indian Kanoon Precedents */}
          <PrecedentsSection precedents={analysis.precedents} />

          {/* File Info */}
          <Card className="bg-gray-50 dark:bg-slate-700 text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              <strong>File analyzed:</strong> {selectedFile?.name}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              <strong>Date:</strong> {new Date().toLocaleDateString()}
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
