import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Send, MessageCircle } from 'lucide-react'
import { Card, Loading, Alert, ResearchContextBar } from '../components'
import { chatService } from '../services'

export const ChatbotPage = () => {
  const [messages, setMessages] = React.useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your legal assistant. I can help you understand case concepts, legal procedures, evidence analysis, and more. What would you like to know about legal matters?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [activeDocId, setActiveDocId] = React.useState(null)
  const messagesEndRef = React.useRef(null)
  const location = useLocation()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const docId = urlParams.get('docId');
    if (docId) setActiveDocId(docId);
  }, [location.search]);

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const urlParams = new URLSearchParams(location.search);
    const docId = activeDocId || urlParams.get('docId');

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError('')

    try {
      const result = await chatService.sendMessage(input, docId)

      const assistantMessage = {
        id: messages.length + 2,
        type: 'assistant',
        content: result.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError('Failed to get response. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Legal Chatbot
      </h1>

      <ResearchContextBar 
          currentDocId={activeDocId} 
          onContextChange={(newId) => setActiveDocId(newId)} 
      />

      <Card className="flex flex-col h-screen md:h-96 max-w-4xl mx-auto">
        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.type === 'user' ? 'justify-end' : 'justify-start'
              } fade-in`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-legal-blue text-white'
                    : 'bg-gray-200 dark:bg-slate-700 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 dark:bg-slate-700 px-4 py-3 rounded-lg">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        {/* Input Form */}
        <form
          onSubmit={handleSendMessage}
          className="border-t border-gray-200 dark:border-slate-700 p-4 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a legal question..."
            className="flex-1 input-field"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </form>
      </Card>

      {/* Help Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-4xl mx-auto">
        <Card>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            📚 About Verdicts
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Ask me about convictions, acquittals, and how courts reach decisions.
          </p>
        </Card>
        <Card>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            ⚖️ Legal Concepts
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Learn about mens rea, actus reus, evidence standards, and more.
          </p>
        </Card>
        <Card>
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">
            📋 Procedures
          </h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Understand criminal procedure, IPC sections, and court processes.
          </p>
        </Card>
      </div>
    </div>
  )
}

