import React, { useState, useCallback } from 'react'
import {
  Search, BookOpen, Scale, Calendar, Database,
  ExternalLink, ChevronRight, Filter, X, Loader2,
  FileText, AlertCircle, Building2, SlidersHorizontal,
} from 'lucide-react'
import { caseLawService } from '../services'

const COURT_OPTIONS = [
  { value: '', label: 'All Courts' },
  { value: 'supremecourt', label: 'Supreme Court' },
  { value: 'highcourts', label: 'All High Courts' },
  { value: 'delhi', label: 'Delhi HC' },
  { value: 'bombay', label: 'Bombay HC' },
  { value: 'allahabad', label: 'Allahabad HC' },
  { value: 'madras', label: 'Madras HC' },
  { value: 'calcutta', label: 'Calcutta HC' },
  { value: 'kerala', label: 'Kerala HC' },
  { value: 'karnataka', label: 'Karnataka HC' },
  { value: 'gujarat', label: 'Gujarat HC' },
  { value: 'delhidc', label: 'Delhi District Courts' },
  { value: 'tribunals', label: 'All Tribunals' },
]

/* ── Document viewer modal ───────────────────────────────────────────────── */
const DocumentModal = ({ tid, title, query, onClose }) => {
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState('fragment') // 'fragment' | 'full'

  React.useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        let data
        if (viewMode === 'fragment' && query) {
          data = await caseLawService.getFragment(tid, query)
        } else {
          data = await caseLawService.getDocument(tid)
        }
        setDoc(data)
      } catch (e) {
        setError('Failed to load document.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tid, query, viewMode])

  return (
    <div className="caselaw-modal-overlay" onClick={onClose}>
      <div className="caselaw-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="caselaw-modal-header">
          <div className="flex-1 min-w-0">
            <h2 className="caselaw-modal-title">{title}</h2>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setViewMode('fragment')}
                className={`caselaw-tab-btn ${viewMode === 'fragment' ? 'active' : ''}`}
              >
                Relevant Fragments
              </button>
              <button
                onClick={() => setViewMode('full')}
                className={`caselaw-tab-btn ${viewMode === 'full' ? 'active' : ''}`}
              >
                Full Document
              </button>
              <a
                href={`https://indiankanoon.org/doc/${tid}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="caselaw-tab-btn flex items-center gap-1"
              >
                Indian Kanoon <ExternalLink size={12} />
              </a>
            </div>
          </div>
          <button onClick={onClose} className="caselaw-modal-close">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="caselaw-modal-body">
          {loading ? (
            <div className="caselaw-loading-center">
              <Loader2 size={36} className="caselaw-spin text-indigo-400" />
              <p className="mt-3 text-slate-400">Loading document…</p>
            </div>
          ) : error ? (
            <div className="caselaw-error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : (
            <div className="caselaw-doc-content">
              {viewMode === 'fragment' ? (
                <>
                  {doc?.headline ? (
                    <div
                      className="caselaw-fragment-html"
                      dangerouslySetInnerHTML={{ __html: doc.headline }}
                    />
                  ) : (
                    <p className="text-slate-400">No fragments available for this query.</p>
                  )}
                </>
              ) : (
                <>
                  {doc?.doc ? (
                    <div
                      className="caselaw-full-html"
                      dangerouslySetInnerHTML={{ __html: doc.doc }}
                    />
                  ) : doc?.title ? (
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">{doc.title}</h3>
                      <p className="text-slate-300 text-sm">{doc.publishdate}</p>
                    </div>
                  ) : (
                    <p className="text-slate-400">Document content unavailable.</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Result card ─────────────────────────────────────────────────────────── */
const ResultCard = ({ doc, query, onClick }) => (
  <div className="caselaw-result-card" onClick={() => onClick(doc)}>
    <div className="caselaw-result-header">
      <div className="caselaw-result-source-badge">
        <Building2 size={12} />
        {doc.docsource || 'Unknown Court'}
      </div>
      {doc.publishdate && (
        <div className="caselaw-result-date">
          <Calendar size={12} />
          {doc.publishdate}
        </div>
      )}
    </div>

    <h3 className="caselaw-result-title">{doc.title}</h3>

    {doc.headline && (
      <div
        className="caselaw-result-snippet"
        dangerouslySetInnerHTML={{ __html: doc.headline.slice(0, 400) }}
      />
    )}

    <div className="caselaw-result-footer">
      {doc.docsize && (
        <span className="caselaw-result-size">
          <Database size={11} /> {(doc.docsize / 1000).toFixed(0)}k chars
        </span>
      )}
      <span className="caselaw-view-btn">
        View Case <ChevronRight size={14} />
      </span>
    </div>
  </div>
)

/* ── Main Page ───────────────────────────────────────────────────────────── */
export const CaseLawPage = () => {
  const [query, setQuery] = useState('')
  const [doctypes, setDoctypes] = useState('')
  const [fromdate, setFromdate] = useState('')
  const [todate, setTodate] = useState('')
  const [pagenum, setPagenum] = useState(0)

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [selectedDoc, setSelectedDoc] = useState(null)

  const doSearch = useCallback(async (pg = 0) => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setPagenum(pg)
    try {
      const data = await caseLawService.search({
        query: query.trim(),
        doctypes,
        fromdate,
        todate,
        pagenum: pg,
      })
      setResults(data)
    } catch (e) {
      setError(e?.response?.data?.detail || 'Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [query, doctypes, fromdate, todate])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') doSearch(0)
  }

  const clearFilters = () => {
    setDoctypes('')
    setFromdate('')
    setTodate('')
  }

  const docs = results?.docs || []
  const totalFound = results?.found || 0
  const categories = results?.categories || []

  return (
    <div className="caselaw-page">
      {/* Page header */}
      <div className="caselaw-page-header">
        <div className="caselaw-page-header-inner">
          <div className="caselaw-page-title-row">
            <div className="caselaw-page-icon">
              <Scale size={28} />
            </div>
            <div>
              <h1 className="caselaw-page-title">Case Law Search</h1>
              <p className="caselaw-page-subtitle">
                Search 3 crore+ Indian legal documents powered by Indian Kanoon
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="caselaw-search-row">
            <div className="caselaw-search-box">
              <Search size={18} className="caselaw-search-icon" />
              <input
                id="caselaw-search-input"
                type="text"
                placeholder='Search cases… e.g. "IPC 420 fraud" or "murder ANDD kidnapping"'
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="caselaw-search-input"
              />
              {query && (
                <button onClick={() => { setQuery(''); setResults(null) }} className="caselaw-search-clear">
                  <X size={15} />
                </button>
              )}
            </div>
            <button
              id="caselaw-filter-btn"
              onClick={() => setShowFilters(v => !v)}
              className={`caselaw-filter-btn ${showFilters ? 'active' : ''}`}
            >
              <SlidersHorizontal size={16} />
              Filters
              {(doctypes || fromdate || todate) && <span className="caselaw-filter-dot" />}
            </button>
            <button
              id="caselaw-search-btn"
              onClick={() => doSearch(0)}
              disabled={loading || !query.trim()}
              className="caselaw-search-btn"
            >
              {loading ? <Loader2 size={16} className="caselaw-spin" /> : <Search size={16} />}
              Search
            </button>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="caselaw-filters-panel">
              <div className="caselaw-filters-grid">
                <div className="caselaw-filter-group">
                  <label className="caselaw-filter-label">Court / Jurisdiction</label>
                  <select
                    id="caselaw-doctypes-select"
                    value={doctypes}
                    onChange={e => setDoctypes(e.target.value)}
                    className="caselaw-filter-select"
                  >
                    {COURT_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="caselaw-filter-group">
                  <label className="caselaw-filter-label">From Date (DD-MM-YYYY)</label>
                  <input
                    type="text"
                    placeholder="01-01-2000"
                    value={fromdate}
                    onChange={e => setFromdate(e.target.value)}
                    className="caselaw-filter-input"
                  />
                </div>
                <div className="caselaw-filter-group">
                  <label className="caselaw-filter-label">To Date (DD-MM-YYYY)</label>
                  <input
                    type="text"
                    placeholder="31-12-2024"
                    value={todate}
                    onChange={e => setTodate(e.target.value)}
                    className="caselaw-filter-input"
                  />
                </div>
              </div>
              {(doctypes || fromdate || todate) && (
                <button onClick={clearFilters} className="caselaw-clear-filters-btn">
                  <X size={13} /> Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="caselaw-main">
        {/* Error */}
        {error && (
          <div className="caselaw-error-banner">
            <AlertCircle size={16} /><span>{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!results && !loading && !error && (
          <div className="caselaw-empty-state">
            <div className="caselaw-empty-icon">
              <BookOpen size={48} />
            </div>
            <h2 className="caselaw-empty-title">Search India's Legal Database</h2>
            <p className="caselaw-empty-subtitle">
              Access over 3 crore court judgments from the Supreme Court, High Courts,
              District Courts, and Tribunals — all powered by Indian Kanoon.
            </p>
            <div className="caselaw-example-queries">
              {['IPC 302 murder conviction', 'bail application granted Supreme Court', 'fraud cheque dishonour'].map(q => (
                <button
                  key={q}
                  onClick={() => { setQuery(q); }}
                  className="caselaw-example-chip"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="caselaw-skeleton-list">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="caselaw-skeleton-card">
                <div className="caselaw-skeleton-line short" />
                <div className="caselaw-skeleton-line" />
                <div className="caselaw-skeleton-line medium" />
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="caselaw-results-layout">
            {/* Left: results */}
            <div className="caselaw-results-main">
              <div className="caselaw-results-meta">
                <span className="caselaw-found-badge">
                  <FileText size={14} />
                  {totalFound.toLocaleString()} documents found
                </span>
                <span className="caselaw-query-echo">"{query}"</span>
              </div>

              {docs.length === 0 ? (
                <div className="caselaw-no-results">
                  <AlertCircle size={32} className="text-slate-500 mb-3" />
                  <p>No results found. Try adjusting your query or filters.</p>
                </div>
              ) : (
                docs.map(doc => (
                  <ResultCard
                    key={doc.tid}
                    doc={doc}
                    query={query}
                    onClick={setSelectedDoc}
                  />
                ))
              )}

              {/* Pagination */}
              {totalFound > 10 && (
                <div className="caselaw-pagination">
                  <button
                    disabled={pagenum === 0}
                    onClick={() => doSearch(pagenum - 1)}
                    className="caselaw-page-btn"
                  >
                    ← Previous
                  </button>
                  <span className="caselaw-page-info">Page {pagenum + 1}</span>
                  <button
                    disabled={docs.length < 10}
                    onClick={() => doSearch(pagenum + 1)}
                    className="caselaw-page-btn"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>

            {/* Right: categories sidebar */}
            {categories.length > 0 && (
              <div className="caselaw-categories">
                <h3 className="caselaw-categories-title">
                  <Filter size={14} /> Refine by Category
                </h3>
                {categories.map(([catName, items], i) => (
                  <div key={i} className="caselaw-category-group">
                    <p className="caselaw-category-name">{catName}</p>
                    {items.slice(0, 5).map((item, j) => (
                      <button
                        key={j}
                        onClick={() => { setQuery(item.formInput || item.value); doSearch(0) }}
                        className="caselaw-category-item"
                      >
                        <ChevronRight size={11} />
                        <span>{item.value}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document modal */}
      {selectedDoc && (
        <DocumentModal
          tid={String(selectedDoc.tid)}
          title={selectedDoc.title}
          query={query}
          onClose={() => setSelectedDoc(null)}
        />
      )}
    </div>
  )
}
