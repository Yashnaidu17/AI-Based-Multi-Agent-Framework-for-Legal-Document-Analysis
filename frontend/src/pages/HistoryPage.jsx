import React from 'react'
import { Download, Trash2, FileText, Calendar } from 'lucide-react'
import { Card, Loading, Alert } from '../components'
import { analysisService } from '../services'

export const HistoryPage = () => {
  const [history, setHistory] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState('')
  const [offline, setOffline] = React.useState(false)
  const [expandedId, setExpandedId] = React.useState(null)

  React.useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await analysisService.getHistory()
        setHistory(data.history || [])
        setOffline(Boolean(data.offline))
      } catch (err) {
        setError('Failed to load analysis history')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const handleDelete = (id) => {
    setHistory((prev) => prev.filter((doc) => doc.id !== id))
  }

  const handleDownload = (doc) => {
    const jsonStr = JSON.stringify(doc.analysis, null, 2)
    const element = document.createElement('a')
    element.setAttribute(
      'href',
      'data:application/json;charset=utf-8,' + encodeURIComponent(jsonStr)
    )
    element.setAttribute('download', `analysis_${doc.id}.json`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (loading) return <Loading message="Loading history..." />

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Analysis History
      </h1>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {offline && (
        <div className="mb-4">
          <Alert
            type="info"
            message="Backend is currently unavailable, so this page is showing demo history entries."
            onClose={() => setOffline(false)}
          />
        </div>
      )}

      {history.length === 0 ? (
        <Card className="text-center py-12">
          <FileText
            size={48}
            className="mx-auto text-gray-400 mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No documents analyzed yet
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Upload and analyze a legal document to see it appear here
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((doc) => (
            <Card key={doc.id} className="cursor-pointer hover:shadow-lg">
              <div
                onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                className="flex items-center justify-between p-2"
              >
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {doc.filename}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={16} />
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      doc.verdict?.includes('YES') || doc.verdict?.includes('Conviction')
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                        : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100'
                    }`}>
                      {doc.verdict}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload(doc)
                    }}
                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition-colors text-blue-600 dark:text-blue-400"
                    title="Download"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(doc.id)
                    }}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors text-red-600 dark:text-red-400"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === doc.id && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 space-y-4">
                  {/* Quick Research Actions */}
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 mb-4">
                    <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase mb-3">
                      Research Tools for this Document
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <a href={`/graph?docId=${doc.id}`} className="flex items-center justify-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors text-xs font-bold text-gray-700 dark:text-gray-300">
                        📊 Graph
                      </a>
                      <a href={`/simulation?docId=${doc.id}`} className="flex items-center justify-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors text-xs font-bold text-gray-700 dark:text-gray-300">
                        🧪 Simulation
                      </a>
                      <a href={`/courtroom?docId=${doc.id}`} className="flex items-center justify-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors text-xs font-bold text-gray-700 dark:text-gray-300">
                        ⚖️ Courtroom
                      </a>
                      <a href={`/chatbot?docId=${doc.id}`} className="flex items-center justify-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-xl border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors text-xs font-bold text-gray-700 dark:text-gray-300">
                        💬 Chat
                      </a>
                    </div>
                  </div>

                  {doc.analysis.case_facts && (
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                        Case Facts
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {doc.analysis.case_facts}
                      </p>
                    </div>
                  )}
                  {doc.analysis.ipc_sections && (
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                        IPC Sections
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {doc.analysis.ipc_sections.map((section) => (
                          <span
                            key={section}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded text-xs font-medium"
                          >
                            Section {section}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
