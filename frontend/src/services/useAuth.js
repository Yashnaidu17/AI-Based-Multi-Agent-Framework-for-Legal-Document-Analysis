import React from 'react'

export const useAuth = () => {
  const [user, setUser] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(null)

  React.useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        setError('Failed to load user')
      }
    }
    setLoading(false)
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return { user, loading, error, logout, setUser }
}

export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState)

  return {
    isLoading,
    setLoading: setIsLoading,
    startLoading: () => setIsLoading(true),
    stopLoading: () => setIsLoading(false),
  }
}

export const useAsync = (asyncFunction, immediate = true) => {
  const [status, setStatus] = React.useState('idle')
  const [value, setValue] = React.useState(null)
  const [error, setError] = React.useState(null)

  const execute = React.useCallback(async () => {
    setStatus('pending')
    setValue(null)
    setError(null)
    try {
      const response = await asyncFunction()
      setValue(response)
      setStatus('success')
      return response
    } catch (error) {
      setError(error)
      setStatus('error')
      return null
    }
  }, [asyncFunction])

  React.useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return { execute, status, value, error }
}
