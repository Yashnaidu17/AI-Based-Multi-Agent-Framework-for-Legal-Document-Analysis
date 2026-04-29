import api from './api'

const OFFLINE_DEMO_USER = {
  id: 'offline-demo-user',
  email: 'demo@legal.com',
  full_name: 'Demo User',
}

const OFFLINE_DASHBOARD_METRICS = {
  documents_analyzed: 401,
  cases_predicted: 401,
  accuracy: 87.3,
  convictions: 214,
  acquittals: 123,
  avg_analysis_time_seconds: 12.7,
  success_rate: 95.3,
  victim_wins: 188,
  victim_losses: 76,
  court_sustainability: {
    supreme_court: { yes: 144, no: 32 },
    high_court: { yes: 173, no: 48 },
    lower_court: { yes: 219, no: 61 },
  },
  agent_confidence: [
    { name: 'Prosecutor', score: 85, role: 'Conviction Argument', avg_time_seconds: 3.2 },
    { name: 'Defense', score: 78, role: 'Acquittal Argument', avg_time_seconds: 3.1 },
    { name: 'Evidence Analyst', score: 92, role: 'Evidence Quality', avg_time_seconds: 3.0 },
    { name: 'Judge', score: 88, role: 'Final Verdict', avg_time_seconds: 3.4 },
  ],
  top_ipc_sections: [
    { section: '420', count: 83 },
    { section: '468', count: 64 },
    { section: '471', count: 58 },
    { section: '406', count: 42 },
    { section: '120B', count: 35 },
  ],
  monthly_trend: [
    { month: 'Jan 2026', count: 96 },
    { month: 'Feb 2026', count: 104 },
    { month: 'Mar 2026', count: 118 },
    { month: 'Apr 2026', count: 83 },
  ],
  multi_agent_enabled: true,
  average_ipc_sections_per_case: 3.2,
  evaluation_metrics: {
    clause_detection: {
      label: 'Clause Detection',
      description: 'Accuracy, precision, and recall evaluate how well the model identifies relevant legal clauses in documents.',
      metrics: [
        { name: 'Accuracy', value: 91.4, unit: '%', color: '#6366f1' },
        { name: 'Precision', value: 88.7, unit: '%', color: '#8b5cf6' },
        { name: 'Recall', value: 93.2, unit: '%', color: '#a78bfa' },
      ],
    },
    risk_analysis: {
      label: 'Risk Analysis',
      description: 'Risk accuracy and false positive rate assess how reliably the model flags legally risky clauses without over-alerting.',
      metrics: [
        { name: 'Risk Accuracy', value: 86.5, unit: '%', color: '#f59e0b' },
        { name: 'False Positive Rate', value: 7.2, unit: '%', color: '#fbbf24' },
      ],
    },
    case_law_retrieval: {
      label: 'Case Law Retrieval',
      description: 'Top-K accuracy and cosine similarity evaluate how effectively the model retrieves relevant precedents from its legal knowledge base.',
      metrics: [
        { name: 'Top-K Accuracy', value: 84.3, unit: '%', color: '#10b981' },
        { name: 'Cosine Similarity', value: 0.87, unit: '', color: '#34d399' },
      ],
    },
    summarization_quality: {
      label: 'Summarization Quality',
      description: 'ROUGE score and readability measure the quality and comprehensibility of AI-generated legal summaries.',
      metrics: [
        { name: 'ROUGE Score', value: 0.79, unit: '', color: '#3b82f6' },
        { name: 'Readability', value: 82.1, unit: '%', color: '#60a5fa' },
      ],
    },
    decision_support: {
      label: 'Decision Support',
      description: 'User satisfaction and output consistency evaluate the reliability and usefulness of final AI-assisted legal recommendations.',
      metrics: [
        { name: 'User Satisfaction', value: 4.4, unit: '/5', color: '#ec4899' },
        { name: 'Consistency', value: 89.6, unit: '%', color: '#f472b6' },
      ],
    },
  },
}

const OFFLINE_HISTORY = [
  {
    id: 1,
    filename: 'sample-criminal-appeal.pdf',
    created_at: '2026-04-02T10:15:00Z',
    verdict: 'Conviction likely to sustain',
    analysis: {
      case_facts: 'Alleged cheating and forged documentation in a property transaction.',
      ipc_sections: ['420', '468', '471'],
    },
  },
  {
    id: 2,
    filename: 'bail-order-review.pdf',
    created_at: '2026-04-04T14:40:00Z',
    verdict: 'Acquittal arguments available',
    analysis: {
      case_facts: 'Bail challenge involving evidentiary inconsistencies and procedural delay.',
      ipc_sections: ['406', '120B'],
    },
  },
]

const isBackendUnavailable = (error) => error?.response?.status === 503

const enableOfflineDemo = () => {
  localStorage.setItem('token', 'offline-demo-token')
  localStorage.setItem('offline_demo', 'true')
  localStorage.setItem('user', JSON.stringify(OFFLINE_DEMO_USER))
}

// Authentication API calls
export const authService = {
  register: async (email, password, confirmPassword, fullName) => {
    const response = await api.post('auth/register', {
      email,
      password,
      name: fullName,
      confirm_password: confirmPassword,
    })
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  },

  login: async (email, password) => {
    try {
      const response = await api.post('auth/login', {
        email,
        password,
      })
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token)
        localStorage.removeItem('offline_demo')
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }
      return response.data
    } catch (error) {
      const isDemoLogin = email.trim().toLowerCase() === OFFLINE_DEMO_USER.email && password === 'demo123'
      if (isBackendUnavailable(error) && isDemoLogin) {
        enableOfflineDemo()
        return {
          access_token: 'offline-demo-token',
          user: OFFLINE_DEMO_USER,
          offline: true,
        }
      }
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('offline_demo')
    localStorage.removeItem('user')
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem('token')
    if (!token) return null

    if (localStorage.getItem('offline_demo') === 'true') {
      return OFFLINE_DEMO_USER
    }

    try {
      const response = await api.get('auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    } catch {
      return null
    }
  },
}

// Document analysis API calls
export const analysisService = {
  analyzeDocument: async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('analyze-document', formData)
    return response.data
  },

  predictCase: async (file) => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('predict-case', formData)
    return response.data
  },

  getHistory: async () => {
    try {
      const response = await api.get('history')
      return response.data
    } catch (error) {
      if (isBackendUnavailable(error)) {
        return { history: OFFLINE_HISTORY, offline: true }
      }
      throw error
    }
  },

  getDashboardMetrics: async () => {
    try {
      const response = await api.get('dashboard-metrics')
      return response.data
    } catch (error) {
      if (isBackendUnavailable(error)) {
        return { success: true, metrics: OFFLINE_DASHBOARD_METRICS, offline: true }
      }
      throw error
    }
  },
}

// Chatbot API calls
export const chatService = {
  sendMessage: async (message, documentId = null) => {
    const response = await api.post('chat', {
      message,
      document_id: documentId,
    })
    return response.data
  },
}

// Indian Kanoon Case Law API calls
export const caseLawService = {
  search: async ({ query, doctypes = '', fromdate = '', todate = '', title = '', pagenum = 0 }) => {
    const response = await api.post('ik/search', {
      query,
      doctypes,
      fromdate,
      todate,
      title,
      pagenum,
    })
    return response.data?.data || {}
  },

  getDocument: async (tid) => {
    const response = await api.get(`ik/document/${tid}`)
    return response.data?.data || {}
  },

  getFragment: async (tid, query = '') => {
    const response = await api.get(`ik/fragment/${tid}`, { params: { query } })
    return response.data?.data || {}
  },

  getMeta: async (tid) => {
    const response = await api.get(`ik/meta/${tid}`)
    return response.data?.data || {}
  },
}

