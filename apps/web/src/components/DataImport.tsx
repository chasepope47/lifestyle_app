'use client'
import { useState, useRef } from 'react'
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useAuth } from '@/providers/AuthProvider'

interface ImportResult {
  success: boolean
  message: string
  count?: number
  type?: string
}

export function DataImport() {
  const { householdId } = useHousehold()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ImportResult[]>([])
  const [dragActive, setDragActive] = useState(false)

  const handleFile = async (file: File) => {
    if (!householdId || !user) return

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('householdId', householdId)
    formData.append('userId', user.id)

    try {
      const response = await fetch('/api/import/health', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.results) {
        setResults(data.results)
      } else {
        setResults([{ success: false, message: data.error || 'Failed to process file' }])
      }
    } catch (error) {
      setResults([{ success: false, message: error instanceof Error ? error.message : 'An error occurred' }])
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  return (
    <div className="px-6 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-2">Import Health Data</h2>
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Upload your data from Apple Health or Garmin to automatically import workouts, steps, heart rate, sleep, and more.
        </p>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-stone-300 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xml,.tcx,.gpx"
          multiple
          onChange={handleChange}
          className="hidden"
        />
        <Upload className="w-12 h-12 text-stone-400 dark:text-stone-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-stone-900 dark:text-stone-50 mb-1">
          Drag and drop your files here
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
          or click to select (XML, TCX, GPX)
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 inline mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            'Select Files'
          )}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-8 space-y-3">
          <h3 className="font-semibold text-stone-900 dark:text-stone-50">Import Results</h3>
          {results.map((result, idx) => (
            <div
              key={idx}
              className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${
                result.success
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <p className={result.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}>
                  {result.message}
                </p>
                {result.count !== undefined && (
                  <p className={`text-xs mt-1 ${result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                    {result.count} {result.type || 'items'} imported
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 pt-8 border-t border-stone-200 dark:border-stone-800">
        <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-3">How to Export Your Data</h3>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Apple Health</h4>
            <ol className="text-sm text-stone-600 dark:text-stone-400 space-y-1 ml-4 list-decimal">
              <li>Open Health app on your iPhone</li>
              <li>Tap your profile icon</li>
              <li>Export Health Data</li>
              <li>Share the XML file</li>
            </ol>
          </div>
          <div>
            <h4 className="text-sm font-medium text-stone-700 dark:text-stone-300 mb-1">Garmin Activities (TCX/GPX)</h4>
            <ol className="text-sm text-stone-600 dark:text-stone-400 space-y-1 ml-4 list-decimal">
              <li>Visit Garmin Connect (connect.garmin.com)</li>
              <li>Go to Activities and select an activity</li>
              <li>Click Export and choose TCX or GPX format</li>
              <li>Upload the TCX/GPX file here</li>
              <li>Repeat for each activity you want to import</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
