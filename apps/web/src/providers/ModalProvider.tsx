'use client'
import { createContext, useContext, useState, useCallback } from 'react'
import { X } from 'lucide-react'

interface ModalContextType {
  isOpen: boolean
  title?: string
  content?: React.ReactNode
  openModal: (title: string, content: React.ReactNode) => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState<string>()
  const [content, setContent] = useState<React.ReactNode>()

  const openModal = useCallback((modalTitle: string, modalContent: React.ReactNode) => {
    setTitle(modalTitle)
    setContent(modalContent)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setTimeout(() => {
      setTitle(undefined)
      setContent(undefined)
    }, 300)
  }, [])

  return (
    <ModalContext.Provider value={{ isOpen, title, content, openModal, closeModal }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/50 dark:bg-stone-950/50 animate-in fade-in duration-300">
          <div className="h-screen flex flex-col bg-white dark:bg-stone-900 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800">
              <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50">{title}</h1>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-stone-600 dark:text-stone-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {content}
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (context === undefined) {
    throw new Error('useModal must be used within ModalProvider')
  }
  return context
}
