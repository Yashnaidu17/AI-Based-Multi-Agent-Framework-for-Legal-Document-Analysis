import React from 'react'
import { DocumentUploader, Card, Loading, Alert } from '../components'
import { analysisService } from '../services'
import { TrendingUp, TrendingDown, Users, CheckCircle, Scale, ArrowUpCircle, BookOpen, ExternalLink, Building2, Calendar } from 'lucide-react'

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
  if (!courtData || Object.keys(courtData).length === 0) return null
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

const VictimOutcomeCard = ({ outcome }) => {
  if (!outcome) return null
  const isWin = outcome.toUpperCase().includes('WIN') || outcome.toUpperCase().includes('LIKELY TO WIN')
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
      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">{outcome}</p>
    </Card>
  )
}

const IpcOnAppealSection = ({ appealSections }) => {
  if (!appealSections || appealSections.length === 0) return null
  return (
    <Card>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <ArrowUpCircle size={20} className="text-purple-600" />
        Additional IPC Sections Recommended on Appeal
      </h3>
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

export const PredictPage = () => {
  const [selectedFile, setSelectedFile] = React.useState(null)
  const [prediction, setPrediction] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleFileSelect = async (file) => {
    setSelectedFile(file)
    setLoading(true)
    setError('')
    setPrediction(null)

    try {
      const result = await analysisService.predictCase(file)
      setPrediction(result)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to predict case')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Case Prediction AI
      </h1>

      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {!prediction ? (
        <Card className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Upload Case Document
          </h2>
          <DocumentUploader onFileSelect={handleFileSelect} />
        </Card>
      ) : null}

      {loading && <Loading message="Predicting case outcome..." />}

      {prediction && (
        <div className="space-y-6 fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Prediction Results
            </h2>
            <button
              onClick={() => {
                setPrediction(null)
                setSelectedFile(null)
              }}
              className="btn-secondary"
            >
              Predict Another
            </button>
          </div>

          {/* Main Verdict Card */}
          <Card className={`border-l-4 ${prediction.verdict?.includes('YES') || prediction.verdict?.includes('Sustainable')
            ? 'bg-green-50 dark:bg-green-900 border-green-600'
            : 'bg-orange-50 dark:bg-orange-900 border-orange-600'
            }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Case Verdict Prediction
                </h3>
                <p className={`text-2xl font-bold ${prediction.verdict?.includes('YES')
                  ? 'text-green-700 dark:text-green-100'
                  : 'text-orange-700 dark:text-orange-100'
                  }`}>
                  {prediction.verdict}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Confidence Score
                </p>
                <p className="text-3xl font-bold text-legal-blue">
                  {(prediction.confidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>

          {/* Agent Reasoning */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Multi-Agent Legal Reasoning
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prosecutor */}
              <Card>
                <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Users size={18} className="text-red-600" />
                  Prosecutor Agent
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {prediction.agents?.prosecutor}
                </p>
              </Card>

              {/* Defense */}
              <Card>
                <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Users size={18} className="text-blue-600" />
                  Defense Agent
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {prediction.agents?.defense}
                </p>
              </Card>

              {/* Evidence Analyst */}
              <Card>
                <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <TrendingUp size={18} className="text-green-600" />
                  Evidence Analyst
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {prediction.agents?.evidence_analyst}
                </p>
              </Card>

              {/* Judge */}
              <Card>
                <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <CheckCircle size={18} className="text-purple-600" />
                  Judge Synthesis
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {prediction.reasoning || 'Based on the comprehensive analysis of all agents, the court issues its legal judgment considering all arguments and evidence presented.'}
                </p>
              </Card>
            </div>
          </div>

          {/* Court Sustainability */}
          <CourtSustainabilitySection courtData={prediction.court_sustainability} />

          {/* IPC on Appeal */}
          <IpcOnAppealSection appealSections={prediction.additional_ipc_on_appeal} />

          {/* Victim Outcome */}
          <VictimOutcomeCard outcome={prediction.victim_outcome} />

          {/* Indian Kanoon Precedents */}
          <PrecedentsSection precedents={prediction.precedents} />

          {/* Analysis Details */}
          <Card className="bg-gray-50 dark:bg-slate-700">
            <h4 className="font-bold text-gray-900 dark:text-white mb-3">
              Analysis Information
            </h4>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p><strong>File:</strong> {selectedFile?.name}</p>
              <p><strong>Date Analyzed:</strong> {new Date().toLocaleDateString()}</p>
              <p><strong>Model:</strong> Multi-Agent Legal Reasoning</p>
              <p><strong>Analysis Type:</strong> Four-Agent Judicial Simulation</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
