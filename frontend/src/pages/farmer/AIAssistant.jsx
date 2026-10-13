import { useEffect, useRef, useState } from 'react'
import { Bot, Send, User } from 'lucide-react'

import { api } from '../../api'
import ErrorMessage from '../../components/ErrorMessage'
import LoadingSpinner from '../../components/LoadingSpinner'
import PageHeader from '../../components/PageHeader'
import StatusBadge from '../../components/StatusBadge'
import { formatDateTime } from '../../utils/helpers'

export default function AIAssistant() {
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  const loadConversations = async () => {
    try {
      const res = await api.aiConversations()
      setConversations(res.data.results || res.data || [])
      if (res.data.results?.length) selectConversation(res.data.results[0].id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load conversations.')
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (id) => {
    setActiveId(id)
    setError('')
    try {
      const res = await api.aiConversationMessages(id)
      setMessages(res.data.messages || res.data || [])
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load conversation.')
    }
  }

  useEffect(() => {
    loadConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    setError('')
    try {
      const res = await api.aiChat({ message: text, conversation_id: activeId })
      setActiveId(res.data.conversation_id)
      setMessages(res.data.messages)
      loadConversations()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get a response.')
    } finally {
      setSending(false)
    }
  }

  const handleNewChat = async () => {
    setError('')
    try {
      const res = await api.aiChat({ message: 'Hello' })
      setActiveId(res.data.conversation_id)
      setMessages(res.data.messages)
      loadConversations()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start a new chat.')
    }
  }

  return (
    <div>
      <PageHeader title="AI Farming Assistant" subtitle="Ask DhartiX AI about crops, pests, best practices and more" />

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="card lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Conversations</h3>
            <button onClick={handleNewChat} className="btn-primary !px-3 !py-1 !text-xs">New chat</button>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : conversations.length === 0 ? (
            <p className="text-sm text-gray-500">No conversations yet. Start a new chat!</p>
          ) : (
            <div className="space-y-1">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectConversation(c.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${activeId === c.id ? 'bg-primary-700 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <p className="truncate font-medium">{c.title}</p>
                  <p className={`text-xs ${activeId === c.id ? 'text-primary-100' : 'text-gray-400'}`}>{formatDateTime(c.created_at)}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card flex flex-col gap-4 lg:col-span-3">
          {error && <ErrorMessage message={error} />}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                <Bot className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Hello! I'm AgroBot</h3>
              <p className="mt-1 max-w-md text-sm text-gray-500">
                I can answer questions about crop management, pest control, soil health, irrigation and general farming best practices.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['What to plant in clay soil?', 'How to control aphids on tomatoes?', 'NPK ratio for wheat?', 'Best irrigation for rice?'].map((q) => (
                  <button key={q} onClick={() => handleQuickQuestion(q)} className="badge cursor-pointer bg-gray-100 text-gray-700 hover:bg-primary-50 hover:text-primary-700">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-4 overflow-y-auto pr-1" style={{ maxHeight: '55vh' }}>
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[80%] items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-primary-700 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-800'}`}>
                      <div className="whitespace-pre-wrap">{m.content}</div>
                      <p className={`mt-1 text-[10px] ${m.role === 'user' ? 'text-primary-200' : 'text-gray-400'}`}>
                        <StatusBadge status={m.sender} type="role" /> • {formatDateTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="flex max-w-[80%] items-start gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-gray-600"><Bot className="h-4 w-4" /></div>
                    <div className="rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-gray-500">Typing…</div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          <form onSubmit={handleSend} className="flex gap-2 border-t border-gray-100 pt-3">
            <input
              className="input"
              placeholder="Ask AgroBot anything about your farm…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={sending || !input.trim()} className="btn-primary"><Send className="h-4 w-4" /></button>
          </form>
        </div>
      </div>
    </div>
  )

  function handleQuickQuestion(q) {
    setInput(q)
    document.querySelector('input')?.focus()
  }
}