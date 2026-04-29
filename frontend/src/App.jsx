import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Header, Sidebar } from './components'
import {
  LoginPage,
  RegisterPage,
  DashboardPage,
  AnalyzerPage,
  PredictPage,
  ChatbotPage,
  HistoryPage,
  CaseLawPage,
  GraphPage,
  SimulationPage,
  PrecedentsPage,
  CourtroomPage,
} from './pages'
import { useAuth } from './services/useAuth'
import { useTheme } from './services/hooks'

const ProtectedRoute = ({ element }) => {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>
  
  return user ? element : <Navigate to="/login" />
}

function App() {
  const { user, loading } = useAuth()
  const { isDark } = useTheme()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center">
          <div className="loading-spinner mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="container-main">
        {user ? (
          <>
            <Sidebar
              isOpen={sidebarOpen}
              toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />
            <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <main className="main-content pt-20 pb-8 px-6 md:px-8">
              <Routes>
                <Route
                  path="/dashboard"
                  element={<ProtectedRoute element={<DashboardPage />} />}
                />
                <Route
                  path="/analyze"
                  element={<ProtectedRoute element={<AnalyzerPage />} />}
                />
                <Route
                  path="/predict"
                  element={<ProtectedRoute element={<PredictPage />} />}
                />
                <Route
                  path="/chatbot"
                  element={<ProtectedRoute element={<ChatbotPage />} />}
                />
                <Route
                  path="/history"
                  element={<ProtectedRoute element={<HistoryPage />} />}
                />
                <Route
                  path="/case-law"
                  element={<ProtectedRoute element={<CaseLawPage />} />}
                />
                <Route
                  path="/graph"
                  element={<ProtectedRoute element={<GraphPage />} />}
                />
                <Route
                  path="/simulation"
                  element={<ProtectedRoute element={<SimulationPage />} />}
                />
                <Route
                  path="/precedents"
                  element={<ProtectedRoute element={<PrecedentsPage />} />}
                />
                <Route
                  path="/courtroom"
                  element={<ProtectedRoute element={<CourtroomPage />} />}
                />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </main>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  )
}

export default App
