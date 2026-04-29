import React from 'react'
import { Upload, File, AlertCircle } from 'lucide-react'

export const DocumentUploader = ({ onFileSelect, accept = '.pdf', maxSize = 10 }) => {
  const [dragActive, setDragActive] = React.useState(false)
  const [error, setError] = React.useState(null)
  const fileInputRef = React.useRef(null)

  const validateFile = (file) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed')
      return false
    }
    if (file.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return false
    }
    setError(null)
    return true
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      if (validateFile(files[0])) {
        onFileSelect(files[0])
      }
    }
  }

  const handleChange = (e) => {
    const files = e.target.files
    if (files && files[0]) {
      if (validateFile(files[0])) {
        onFileSelect(files[0])
      }
    }
  }

  return (
    <div>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${dragActive
            ? 'border-legal-blue bg-blue-50 dark:bg-blue-900'
            : 'border-gray-300 dark:border-slate-600 hover:border-legal-blue dark:hover:border-blue-400'
          }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        <Upload className="mx-auto mb-4 text-legal-blue" size={32} />
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          Upload your legal document
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Drag and drop or click to select a PDF file
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Maximum file size: {maxSize}MB
        </p>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-100">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  )
}
