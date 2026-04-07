import { useState, useEffect, useRef } from 'react'
import { addTask, editTask, deleteTask, toggleTaskComplete, getWeekTasks } from '../../../api/scheduleApi.js'
import {
    CalendarIcon, PlusIcon, TrashIcon, CheckCircleIcon,
    ArrowRightIcon, ChevronDownIcon, ChevronUpIcon,
    StarIcon, PencilIcon, ExclamationTriangleIcon,
    SparklesIcon, XMarkIcon, PaperAirplaneIcon, ChevronRightIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile'

function TimeSelect({ value, onChange, label }) {
    const toH = (v) => { if (!v) return '12'; const [h] = v.split(':').map(Number); return h % 12 === 0 ? '12' : String(h % 12) }
    const toM = (v) => { if (!v) return '00'; return v.split(':')[1] }
    const toAP = (v) => { if (!v) return 'AM'; const [h] = v.split(':').map(Number); return h >= 12 ? 'PM' : 'AM' }
    const hours = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11']
    const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']
    const emit = (h, m, ap) => {
        let hour = parseInt(h)
        if (ap === 'PM' && hour !== 12) hour += 12
        if (ap === 'AM' && hour === 12) hour = 0
        onChange(`${String(hour).padStart(2, '0')}:${m}`)
    }
    const sel = "flex-1 px-2 py-2 rounded-xl border-2 border-gray-100 focus:border-violet-200 outline-none text-sm font-bold text-gray-700 bg-white appearance-none text-center cursor-pointer"
    return (
        <div>
            {label && <label className="block text-sm font-bold text-gray-700 mb-1">{label}</label>}
            <div className="flex gap-1.5 items-center">
                <select value={toH(value)} onChange={e => emit(e.target.value, toM(value), toAP(value))} className={sel}>{hours.map(h => <option key={h}>{h}</option>)}</select>
                <span className="text-gray-400 font-black text-sm">:</span>
                <select value={toM(value)} onChange={e => emit(toH(value), e.target.value, toAP(value))} className={sel}>{minutes.map(m => <option key={m}>{m}</option>)}</select>
                <select value={toAP(value)} onChange={e => emit(toH(value), toM(value), e.target.value)} className={sel}><option>AM</option><option>PM</option></select>
            </div>
        </div>
    )
}

function AIAgent({ tasks, setTasks, activeDay, setActiveDay, externalOpen, setExternalOpen }) {
    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState([{
        role: 'assistant',
        content: "Hi! I'm your AI schedule assistant 🧠✨\n\nI can help you:\n\n• **Add tasks** — \"Add gym 7-8am Monday\"\n• **Delete tasks** — \"Remove math revision\"\n• **Move tasks** — \"Move yoga to Thursday 6pm\"\n• **Clear a day** — \"Clear all Sunday tasks\"\n• **Fill your day** — \"Fill Wednesday with study blocks\"\n• **Ask anything** — \"What's my busiest day?\"\n\nJust tell me what you need!"
    }])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [pending, setPending] = useState(null)
    const bottomRef = useRef(null)
    const inputRef = useRef(null)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])
    useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100) }, [open])
    useEffect(() => { if (externalOpen) { setOpen(true); if (setExternalOpen) setExternalOpen(false) } }, [externalOpen])

    const buildPrompt = () => {
        const snapshot = days.map(day => {
            const dt = tasks[day]
            if (!dt.length) return `${day}: (empty)`
            return `${day}:\n` + dt.map(t =>
                `  - [id:${t.id}] "${t.title}" ${t.startTime}→${t.endTime} [${t.detectedType || 'OTHER'}]${t.completed ? ' ✓done' : ''}${t.notes ? ` notes:"${t.notes}"` : ''}`
            ).join('\n')
        }).join('\n')

        return `You are a smart, friendly AI scheduling assistant inside a weekly planner app. The user is currently viewing: ${activeDay}.

CURRENT SCHEDULE:
${snapshot}

RULES:
- Always reply with ONLY raw JSON, no markdown, no backticks, no extra text.
- JSON format: { "message": "friendly reply", "actions": [ ...array of actions or empty ] }

ACTION TYPES:
{ "type": "add", "day": "Monday", "task": { "title": "...", "startTime": "HH:MM", "endTime": "HH:MM", "notes": "" } }
{ "type": "delete", "day": "Monday", "taskId": 123 }
{ "type": "edit", "day": "Monday", "taskId": 123, "changes": { "title":"...", "startTime":"HH:MM", "endTime":"HH:MM", "notes":"..." } }
{ "type": "complete", "day": "Monday", "taskId": 123, "completed": true }
{ "type": "move", "fromDay": "Monday", "toDay": "Tuesday", "taskId": 123, "newStartTime": "HH:MM", "newEndTime": "HH:MM" }
{ "type": "clearDay", "day": "Monday" }
{ "type": "switchDay", "day": "Monday" }

SMART TIME RULES:
- "morning" = 08:00-09:00, "mid-morning" = 10:00-11:00, "noon/lunch" = 12:00-13:00
- "afternoon" = 14:00-15:00, "late afternoon" = 16:00-17:00, "evening" = 18:00-19:00, "night" = 20:00-21:00
- Default duration: 1h general, 30min breaks, 90min gym/workout, 2h deep study
- "today" = ${activeDay}, "tomorrow" = ${days[(days.indexOf(activeDay) + 1) % 7]}
- NEVER schedule overlapping tasks — pick next free slot if conflict
- Be warm, encouraging, use 1-2 emojis max in message
- If request is unclear, ask for clarification with actions=[]`
    }

    const applyActions = (actions) => {
        setTasks(prev => {
            const updated = {}
            days.forEach(d => { updated[d] = [...(prev[d] || [])] })
            for (const a of actions) {
                if (a.type === 'add') {
                    updated[a.day] = [...updated[a.day], { ...a.task, id: Date.now() + Math.random(), completed: false, detectedType: 'OTHER' }]
                } else if (a.type === 'delete') {
                    updated[a.day] = updated[a.day].filter(t => t.id !== a.taskId)
                } else if (a.type === 'edit') {
                    updated[a.day] = updated[a.day].map(t => t.id === a.taskId ? { ...t, ...a.changes } : t)
                } else if (a.type === 'complete') {
                    updated[a.day] = updated[a.day].map(t => t.id === a.taskId ? { ...t, completed: a.completed } : t)
                } else if (a.type === 'move') {
                    const task = updated[a.fromDay].find(t => t.id === a.taskId)
                    if (task) {
                        updated[a.fromDay] = updated[a.fromDay].filter(t => t.id !== a.taskId)
                        updated[a.toDay] = [...updated[a.toDay], { ...task, startTime: a.newStartTime || task.startTime, endTime: a.newEndTime || task.endTime, id: Date.now() + Math.random() }]
                    }
                } else if (a.type === 'clearDay') {
                    updated[a.day] = []
                }
            }
            return updated
        })
        const sw = actions.find(a => a.type === 'switchDay')
        if (sw) setActiveDay(sw.day)
    }

    const send = async () => {
        if (!input.trim() || loading) return
        const userText = input.trim()
        setInput('')
        const newMessages = [...messages, { role: 'user', content: userText }]
        setMessages(newMessages)
        setLoading(true)
        setPending(null)

        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                },
                body: JSON.stringify({
                    model: GROQ_MODEL,
                    temperature: 0.3,
                    max_tokens: 1024,
                    messages: [
                        { role: 'system', content: buildPrompt() },
                        ...newMessages.map(m => ({ role: m.role, content: m.content }))
                    ]
                })
            })

            const data = await res.json()
            const raw = data.choices?.[0]?.message?.content || ''
            let parsed = { message: raw, actions: [] }

            try {
                const clean = raw.replace(/```json|```/g, '').trim()
                const match = clean.match(/\{[\s\S]*\}/)
                if (match) parsed = JSON.parse(match[0])
            } catch { /* use raw as message */ }

            if (parsed.actions?.length > 0) {
                setPending(parsed.actions)
                setMessages(prev => [...prev, { role: 'assistant', content: parsed.message, actions: parsed.actions, pendingConfirm: true }])
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: parsed.message }])
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: `Oops, something went wrong: ${err.message}. Please try again! 🙏` }])
        }
        setLoading(false)
    }

    const confirm = () => {
        if (!pending) return
        applyActions(pending)
        setPending(null)
        setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, pendingConfirm: false, confirmed: true } : m))
    }

    const cancel = () => {
        setPending(null)
        setMessages(prev => [
            ...prev.map((m, i) => i === prev.length - 1 ? { ...m, pendingConfirm: false, cancelled: true } : m),
            { role: 'assistant', content: "No problem, cancelled! What else can I help with? 😊" }
        ])
    }

    const fmt = (text) => {
        if (!text) return null
        return text.split('\n').map((line, li, arr) => {
            const parts = line.split(/(\*\*[^*]+\*\*)/g)
            return <span key={li}>{parts.map((p, pi) => p.startsWith('**') && p.endsWith('**') ? <strong key={pi}>{p.slice(2, -2)}</strong> : <span key={pi}>{p}</span>)}{li < arr.length - 1 && <br />}</span>
        })
    }

    const actionLabel = (a) => {
        if (a.type === 'add') return `➕ Add "${a.task?.title}" on ${a.day}`
        if (a.type === 'delete') return `🗑 Delete task on ${a.day}`
        if (a.type === 'edit') return `✏️ Edit task on ${a.day}`
        if (a.type === 'complete') return `✅ Mark task ${a.completed ? 'done' : 'undone'} on ${a.day}`
        if (a.type === 'move') return `📦 Move task: ${a.fromDay} → ${a.toDay}`
        if (a.type === 'clearDay') return `🧹 Clear all tasks on ${a.day}`
        if (a.type === 'switchDay') return `👁 Switch view to ${a.day}`
        return null
    }

    const suggestions = [
        "What's my busiest day?",
        "Add morning workout Monday",
        "Fill Wednesday with study",
        "What free time do I have?",
    ]

    return (
        <>
            {open && (
                <div
                    className="fixed top-[72px] right-4 z-50 w-[370px] max-w-[calc(100vw-2rem)] flex flex-col bg-white rounded-2xl border-2 border-violet-200 overflow-hidden"
                    style={{ height: '580px', maxHeight: 'calc(100vh-5rem)', boxShadow: '0 20px 60px rgba(167,139,250,0.25), 0 8px 32px rgba(0,0,0,0.12)' }}
                >
                    {/* Header */}
                    <div className="flex-shrink-0 bg-gradient-to-r from-violet-400 to-purple-500 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center">
                                <SparklesIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-black text-sm">Schedule Planner</p>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                                    <p className="text-white/80 text-xs font-medium">Powered by Groq · Llama 3.3</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors">
                            <XMarkIcon className="w-4 h-4 text-white" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {messages.map((msg, idx) => {
                            const isUser = msg.role === 'user'
                            const visibleActions = msg.actions?.filter(a => a.type !== 'switchDay') || []
                            return (
                                <div key={idx} className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                    {!isUser && (
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-300 to-purple-400 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                                            <SparklesIcon className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                    <div className="max-w-[85%]">
                                        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'bg-violet-400 text-white rounded-tr-sm' : 'bg-gray-50 border border-gray-200 text-gray-800 rounded-tl-sm'}`}>
                                            {fmt(msg.content)}
                                        </div>

                                        {visibleActions.length > 0 && !msg.cancelled && (
                                            <div className="mt-2 bg-amber-50 border-2 border-amber-200 rounded-xl p-3">
                                                <p className="text-[10px] font-black text-amber-700 uppercase tracking-wide mb-2">Proposed Changes</p>
                                                <div className="space-y-1 mb-3">
                                                    {visibleActions.map((a, i) => (
                                                        <div key={i} className="text-xs text-gray-700 font-medium flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full flex-shrink-0" />
                                                            {actionLabel(a)}
                                                        </div>
                                                    ))}
                                                </div>
                                                {msg.pendingConfirm && (
                                                    <div className="flex gap-2">
                                                        <button onClick={cancel} className="flex-1 py-1.5 rounded-lg border-2 border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                                                        <button onClick={confirm} className="flex-1 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors">✓ Apply</button>
                                                    </div>
                                                )}
                                                {msg.confirmed && <p className="text-xs font-bold text-violet-600 text-center">✓ Applied to your schedule!</p>}
                                                {msg.cancelled && <p className="text-xs font-bold text-gray-400 text-center">Cancelled</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}

                        {loading && (
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-300 to-purple-400 flex items-center justify-center flex-shrink-0">
                                    <SparklesIcon className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div className="bg-gray-50 border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                                    <div className="flex gap-1.5 items-center">
                                        {[0, 1, 2].map(i => <div key={i} className="w-2 h-2 bg-violet-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    {/* Suggestions */}
                    {messages.length <= 1 && (
                        <div className="flex-shrink-0 px-4 pb-2 flex flex-wrap gap-1.5">
                            {suggestions.map((s, i) => (
                                <button key={i} onClick={() => setInput(s)}
                                    className="text-xs bg-violet-50 border border-violet-200 text-violet-600 font-bold px-2.5 py-1 rounded-full hover:bg-violet-100 transition-colors flex items-center gap-1">
                                    <ChevronRightIcon className="w-3 h-3" />{s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="flex-shrink-0 p-3 border-t border-gray-100">
                        <div className="flex gap-2 items-end">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                                placeholder="Ask me anything about your schedule..."
                                rows={1}
                                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-100 focus:border-violet-300 outline-none text-sm resize-none font-medium text-gray-800 transition-colors"
                                style={{ maxHeight: '100px', overflowY: 'auto' }}
                            />
                            <button onClick={send} disabled={!input.trim() || loading}
                                className="w-10 h-10 rounded-xl bg-violet-400 text-white flex items-center justify-center hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex-shrink-0">
                                <PaperAirplaneIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center mt-1.5">Enter to send · Shift+Enter for new line</p>
                    </div>
                </div>
            )}
        </>
    )
}

export default function Schedule({ tasks, setTasks, activeDay, setActiveDay, user }) {
    const [showAddTask, setShowAddTask] = useState(false)
    const [newTask, setNewTask] = useState({ startTime: '09:00', endTime: '10:00', title: '', notes: '' })
    const [overlapError, setOverlapError] = useState('')
    const [showPushModal, setShowPushModal] = useState(false)
    const [pushNonConflicts, setPushNonConflicts] = useState([])
    const [pushConflicts, setPushConflicts] = useState([])
    const [conflictTimes, setConflictTimes] = useState({})
    const [pushError, setPushError] = useState('')
    const [expandedTask, setExpandedTask] = useState(null)
    const [dayRatings, setDayRatings] = useState({})
    const [editingTask, setEditingTask] = useState(null)
    const [editData, setEditData] = useState({})
    const [editError, setEditError] = useState('')
    const [openAgent, setOpenAgent] = useState(false)
    const [addWarnings, setAddWarnings] = useState([])
    const [editWarnings, setEditWarnings] = useState([])
    const [isSaving, setIsSaving] = useState(false)

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    // ✅ REMOVED: mapGradeToClass function - backend handles this
    // ✅ REMOVED: studyCapMap hardcoded caps - backend has these in database

    const normaliseTask = (task) => {
        if (task.startTime) return task
        const raw = task.time || ''
        const match = raw.match(/(\d+):(\d+)\s*(AM|PM)?/i)
        if (!match) return { ...task, startTime: '00:00', endTime: '01:00' }
        let h = parseInt(match[1]); const m = match[2]; const ap = (match[3] || '').toUpperCase()
        if (ap === 'PM' && h !== 12) h += 12
        if (ap === 'AM' && h === 12) h = 0
        return { ...task, startTime: `${String(h).padStart(2, '0')}:${m}`, endTime: `${String((h + 1) % 24).padStart(2, '0')}:${m}` }
    }

    const toMins = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m }
    const fmtTime = (t) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}` }
    const getDur = (s, e) => { const d = toMins(e) - toMins(s); if (d <= 0) return ''; const h = Math.floor(d / 60), m = d % 60; return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m` }
    const totalMins = () => normTasks.reduce((a, t) => { const d = toMins(t.endTime) - toMins(t.startTime); return a + (d > 0 ? d : 0) }, 0)
    const hasOverlap = (day, s, e, excl = null) => tasks[day].some(r => { const t = normaliseTask(r); if (t.id === excl) return false; return toMins(s) < toMins(t.endTime) && toMins(e) > toMins(t.startTime) })

    const dayIdx = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }
    const isToday = (d) => dayIdx[d] === new Date().getDay()
    const isPast = (d) => dayIdx[d] < new Date().getDay()
    const isOverdue = (t) => {
        if (t.completed) return false
        if (isPast(activeDay)) return true
        if (isToday(activeDay)) { const n = new Date(); return toMins(t.endTime) < n.getHours() * 60 + n.getMinutes() }
        return false
    }

    const nextDay = days[(days.indexOf(activeDay) + 1) % 7]
    const normTasks = tasks[activeDay].map(normaliseTask)
    const totalT = normTasks.length
    const doneT = normTasks.filter(t => t.completed).length
    const pct = totalT > 0 ? Math.round((doneT / totalT) * 100) : 0
    const incomplete = tasks[activeDay].filter(t => !t.completed).length
    const sorted = [...normTasks].sort((a, b) => a.startTime.localeCompare(b.startTime))
    const tMins = totalMins()
    const tHrs = Math.floor(tMins / 60)
    const tMin = tMins % 60

    // ✅ REMOVED: Frontend study cap calculation - backend handles this via Rule 2
    // ✅ REMOVED: Frontend wellness warning logic - backend handles this via Rule 8

    const typeColors = {
        Study: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
        Wellness: { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
        Other: { bg: 'bg-violet-400', light: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
    }

    const isValidConflict = (id) => {
        const t = conflictTimes[id]; if (!t) return false
        if (toMins(t.endTime) <= toMins(t.startTime)) return false
        if (hasOverlap(nextDay, t.startTime, t.endTime)) return false
        if (pushNonConflicts.some(x => toMins(t.startTime) < toMins(x.endTime) && toMins(t.endTime) > toMins(x.startTime))) return false
        if (pushConflicts.some(x => { if (x.id === id) return false; const o = conflictTimes[x.id]; if (!o) return false; return toMins(t.startTime) < toMins(o.endTime) && toMins(t.endTime) > toMins(o.startTime) })) return false
        return true
    }

    const handleAdd = async () => {
        setOverlapError('')
        setAddWarnings([])
        if (!newTask.title || !newTask.startTime || !newTask.endTime) return
        if (toMins(newTask.endTime) <= toMins(newTask.startTime)) {
            setOverlapError('End time must be after start time.')
            return
        }
        setIsSaving(true)
        try {
            const saved = await addTask(
                user.id,
                activeDay,
                newTask.title,
                newTask.startTime,
                newTask.endTime,
                newTask.notes
            )
            // saved is the TaskResponse from backend with detectedType and warnings
            setTasks(prev => ({
                ...prev,
                [activeDay]: [...prev[activeDay], { ...saved, completed: false }]
            }))
            if (saved.warnings && saved.warnings.length > 0) {
                setAddWarnings(saved.warnings)
                // keep modal open briefly to show warnings, then close after 3s
                setTimeout(() => {
                    setAddWarnings([])
                    setShowAddTask(false)
                    setNewTask({ startTime: '09:00', endTime: '10:00', title: '', notes: '' })
                }, 3000)
            } else {
                setNewTask({ startTime: '09:00', endTime: '10:00', title: '', notes: '' })
                setShowAddTask(false)
            }
        } catch (err) {
            setOverlapError(err.message || 'Could not save task. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (e, id) => {
        e.stopPropagation()
        try {
            await deleteTask(id)
            setTasks(prev => ({ ...prev, [activeDay]: prev[activeDay].filter(t => t.id !== id) }))
            if (expandedTask === id) setExpandedTask(null)
        } catch (err) {
            console.error('Delete failed:', err.message)
        }
    }

    const toggleDone = async (id) => {
        try {
            const saved = await toggleTaskComplete(id)
            setTasks(prev => ({
                ...prev,
                [activeDay]: prev[activeDay].map(t => t.id === id ? { ...t, completed: saved.completed } : t)
            }))
        } catch (err) {
            console.error('Toggle failed:', err.message)
        }
    }

    const openEdit = (e, task) => {
        e.stopPropagation()
        setEditingTask(task)
        setEditData({ title: task.title, startTime: task.startTime, endTime: task.endTime, notes: task.notes || '' })
        setEditError('')
        setEditWarnings([])
    }

    const saveEdit = async () => {
        setEditError('')
        setEditWarnings([])
        if (!editData.title || !editData.startTime || !editData.endTime) return
        if (toMins(editData.endTime) <= toMins(editData.startTime)) {
            setEditError('End time must be after start time.')
            return
        }
        setIsSaving(true)
        try {
            const saved = await editTask(
                editingTask.id,
                user.id,
                activeDay,
                editData.title,
                editData.startTime,
                editData.endTime,
                editData.notes
            )
            setTasks(prev => ({
                ...prev,
                [activeDay]: prev[activeDay].map(t => t.id === editingTask.id ? { ...t, ...saved } : t)
            }))
            if (saved.warnings && saved.warnings.length > 0) {
                setEditWarnings(saved.warnings)
                setTimeout(() => {
                    setEditWarnings([])
                    setEditingTask(null)
                }, 3000)
            } else {
                setEditingTask(null)
            }
        } catch (err) {
            setEditError(err.message || 'Could not save changes. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const initPush = () => {
        const inc = tasks[activeDay].filter(t => !t.completed).map(normaliseTask)
        const nc = inc.filter(t => !hasOverlap(nextDay, t.startTime, t.endTime))
        const c = inc.filter(t => hasOverlap(nextDay, t.startTime, t.endTime))
        setPushNonConflicts(nc); setPushConflicts(c)
        const init = {}; c.forEach(t => { init[t.id] = { startTime: t.startTime, endTime: t.endTime } })
        setConflictTimes(init); setPushError(''); setShowPushModal(true)
    }

    const doPush = () => {
        setPushError('')
        for (const t of pushConflicts) {
            if (toMins(conflictTimes[t.id].endTime) <= toMins(conflictTimes[t.id].startTime)) { setPushError(`"${t.title}" has invalid times.`); return }
            if (!isValidConflict(t.id)) { setPushError(`"${t.title}" still conflicts.`); return }
        }
        const toMove = [
            ...pushNonConflicts.map(t => ({ ...t, id: Date.now() + Math.random() })),
            ...pushConflicts.map(t => ({ ...t, ...conflictTimes[t.id], id: Date.now() + Math.random() }))
        ]
        setTasks(p => ({ ...p, [activeDay]: p[activeDay].filter(t => t.completed), [nextDay]: [...p[nextDay], ...toMove] }))
        setShowPushModal(false); setPushNonConflicts([]); setPushConflicts([]); setConflictTimes({}); setPushError('')
    }

    const closePush = () => { setShowPushModal(false); setPushNonConflicts([]); setPushConflicts([]); setConflictTimes({}); setPushError('') }
    const setRating = (day, r) => setDayRatings(p => ({ ...p, [day]: p[day] === r ? 0 : r }))

    return (
        <div className="font-lora relative">

            <AIAgent tasks={tasks} setTasks={setTasks} activeDay={activeDay} setActiveDay={setActiveDay} externalOpen={openAgent} setExternalOpen={setOpenAgent} />

            {/* Header */}
            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-black mb-2">My Schedule 📅</h1>
                    <p className="text-gray-600 font-medium">Plan your week for success and balance</p>
                </div>
                <button
                    onClick={() => setOpenAgent(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-400 to-purple-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-all duration-200 flex-shrink-0"
                    style={{ boxShadow: '0 4px 16px rgba(167,139,250,0.4)' }}
                >
                    <SparklesIcon className="w-4 h-4" />
                    Schedule Planner
                    <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                </button>
            </div>

            {/* Progress */}
            {totalT > 0 && (
                <div className="mb-6 bg-white border-2 border-violet-200 rounded-2xl p-4">
                    <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-black text-sm">{activeDay}'s Progress</span>
                            {pct === 100 && <span className="text-xs bg-green-100 text-green-700 font-black px-2 py-0.5 rounded-full border border-green-200">✓ All done!</span>}
                            {tMins > 0 && <span className="text-xs bg-violet-50 text-violet-500 font-black px-2 py-0.5 rounded-full border border-violet-100">⏱ {tHrs > 0 ? `${tHrs}h ` : ''}{tMin > 0 ? `${tMin}m` : ''} scheduled</span>}
                        </div>
                        <span className="text-sm font-bold text-black">{doneT}/{totalT} tasks</span>
                    </div>
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-700 ease-out bg-gradient-to-r from-green-400 to-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="relative h-1.5 mt-2">
                        {[25, 50, 75, 100].map(m => (
                            <span key={m} className={`absolute text-[10px] font-bold -translate-x-1/2 ${pct >= m ? 'text-green-500' : 'text-gray-300'}`} style={{ left: `${m}%` }}>{m}%</span>
                        ))}
                    </div>

                    {/* ✅ REMOVED: Frontend study cap progress bar - backend validates this */}

                    {/* Star Rating */}
                    <div className="mt-3 pt-3 border-t border-violet-100 flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-black text-gray-500">Rate your day:</span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(s => {
                                const filled = (dayRatings[activeDay] || 0) >= s
                                return <button key={s} onClick={() => setRating(activeDay, s)} className="transition-transform hover:scale-125">{filled ? <StarSolid className="w-5 h-5 text-yellow-400" /> : <StarIcon className="w-5 h-5 text-gray-300 hover:text-yellow-300" />}</button>
                            })}
                        </div>
                        {dayRatings[activeDay] > 0 && <span className="text-xs font-bold text-gray-400">{['', 'Rough 😓', 'Could be better 😐', 'Not bad 🙂', 'Great! 😊', 'Incredible! 🌟'][dayRatings[activeDay]]}</span>}
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1 bg-white border-2 border-violet-200 rounded-2xl p-4 h-fit">
                    <div className="space-y-2">
                        {days.map(day => {
                            const dt = tasks[day]; const dc = dt.filter(t => t.completed).length; const dp = dt.length > 0 ? (dc / dt.length) * 100 : 0
                            const isActive = activeDay === day
                            return (
                                <button key={day} onClick={() => setActiveDay(day)}
                                    className={`group w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-white text-black border-2 border-violet-500 shadow-lg shadow-violet-100'
                                        : 'text-black hover:bg-[#f3f0fb] hover:text-black border-2 border-transparent'
                                        }`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span>{day}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-violet-100 text-violet-600' : 'bg-violet-100 text-violet-500'}`}>{dt.length}</span>
                                    </div>
                                    {dt.length > 0 && (
                                        <div className="h-1 rounded-full overflow-hidden bg-gray-100">
                                            <div className="h-full rounded-full transition-all duration-500 bg-green-400" style={{ width: `${dp}%` }} />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Main */}
                <div className="lg:col-span-3">
                    <div className="bg-white border-2 border-violet-200 rounded-2xl p-6 min-h-[600px]">
                        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                            <h2 className="text-2xl font-black text-black">{activeDay}'s Plan</h2>
                            <div className="flex items-center gap-2 flex-wrap">
                                {incomplete > 0 && (
                                    <button onClick={initPush} className="flex items-center gap-2 bg-purple-50 text-purple-600 border-2 border-purple-200 px-4 py-2 rounded-xl font-bold text-sm hover:bg-purple-100 transition-all">
                                        <ArrowRightIcon className="w-4 h-4" />Push {incomplete} to {nextDay}
                                    </button>
                                )}
                                <button onClick={() => { setShowAddTask(true); setOverlapError(''); setAddWarnings([]) }}
                                    className="bg-black text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-gray-800 transition-all flex items-center gap-2">
                                    <PlusIcon className="w-4 h-4" />Add Activity
                                </button>
                            </div>
                        </div>

                        {totalT === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4">
                                    <CalendarIcon className="w-8 h-8 text-violet-300" />
                                </div>
                                <p className="text-gray-500 font-medium">No plans yet for {activeDay}</p>
                                <p className="text-sm text-violet-400 mb-4">Add tasks or ask the AI assistant!</p>
                                <button onClick={() => setOpenAgent(true)} className="flex items-center gap-2 text-sm text-violet-500 font-bold bg-violet-50 px-4 py-2 rounded-xl border border-violet-200 hover:bg-violet-100 transition-colors cursor-pointer">
                                    <SparklesIcon className="w-4 h-4" />Try the AI assistant ✨
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sorted.map(task => {
                                    // ✅ USE BACKEND detectedType instead of frontend calculation
                                    const detectedType = task.detectedType
                                        ? task.detectedType.charAt(0).toUpperCase() + task.detectedType.slice(1).toLowerCase()
                                        : 'Other'
                                    const colors = typeColors[detectedType] || typeColors.Other
                                    const overdue = isOverdue(task)
                                    const dur = getDur(task.startTime, task.endTime)
                                    const isExp = expandedTask === task.id
                                    const hasNote = task.notes?.trim().length > 0
                                    return (
                                        <div key={task.id} className={`border-2 rounded-xl transition-all duration-300 ${task.completed
                                            ? 'bg-gray-50 border-gray-200'
                                            : `bg-white ${colors.border}`
                                            }`}>
                                            <div className="group flex items-center gap-3 p-4 cursor-pointer hover:opacity-90" onClick={() => toggleDone(task.id)}>
                                                <button onClick={e => { e.stopPropagation(); toggleDone(task.id) }}
                                                    className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${task.completed
                                                        ? 'bg-green-500 border-green-500 text-white'
                                                        : 'border-gray-300 bg-white opacity-70 group-hover:opacity-100'
                                                        }`}>
                                                    {task.completed && <CheckCircleIcon className="w-5 h-5" />}
                                                </button>
                                                <div className={`w-1 h-10 rounded-full flex-shrink-0 ${task.completed ? 'bg-gray-300' : colors.bg
                                                    }`} />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h3 className={`font-bold text-lg ${task.completed
                                                            ? 'text-gray-400'
                                                            : 'text-black'
                                                            }`}>{task.title}</h3>
                                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                                            {overdue && !task.completed && (
                                                                <span className="text-xs bg-red-100 text-red-600 font-black px-2 py-0.5 rounded-full border border-red-200">
                                                                    ⏰ Overdue
                                                                </span>
                                                            )}
                                                            {dur && (
                                                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                                                                    {dur}
                                                                </span>
                                                            )}
                                                            <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wide ${task.completed ? 'bg-gray-100 text-gray-400' : `${colors.light} ${colors.text}`
                                                                }`}>{detectedType}</span>
                                                        </div>
                                                    </div>
                                                    <p className={`text-sm font-medium mt-0.5 ${task.completed ? 'text-gray-400' : 'text-gray-500'
                                                        }`}>{fmtTime(task.startTime)} → {fmtTime(task.endTime)}</p>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button onClick={e => { e.stopPropagation(); setExpandedTask(isExp ? null : task.id) }} className={`p-2 rounded-lg transition-all ${isExp ? 'bg-violet-100 text-violet-500' : hasNote ? 'text-violet-300 hover:bg-violet-50' : 'text-gray-300 hover:text-gray-400 hover:bg-gray-50'}`}>
                                                        {isExp ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                                                    </button>
                                                    <button onClick={e => openEdit(e, task)} className="p-2 rounded-lg text-gray-400 hover:text-violet-500 hover:bg-violet-50 transition-all"><PencilIcon className="w-4 h-4" /></button>
                                                    <button onClick={e => handleDelete(e, task.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all"><TrashIcon className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                            {isExp && (
                                                <div className="px-4 pb-4">
                                                    <div className="h-px bg-gray-100 mb-3" />
                                                    <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-3">
                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">📝 Notes</p>
                                                        {hasNote ? <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{task.notes}</p> : <p className="text-sm text-gray-300 italic">No notes yet. Click Edit to add some.</p>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editingTask && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm border-2 border-violet-200 shadow-xl">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center"><PencilIcon className="w-4 h-4 text-violet-500" /></div>
                            <h3 className="text-xl font-black text-black">Edit Activity</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Activity Name</label>
                                <input autoFocus type="text" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-violet-200 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <TimeSelect label="Start Time" value={editData.startTime} onChange={v => setEditData({ ...editData, startTime: v })} />
                                <TimeSelect label="End Time" value={editData.endTime} onChange={v => setEditData({ ...editData, endTime: v })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Notes <span className="text-gray-400 font-medium">(optional)</span></label>
                                <textarea value={editData.notes} onChange={e => setEditData({ ...editData, notes: e.target.value })} rows={3} className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-violet-200 outline-none resize-none text-sm" />
                            </div>
                            {editError && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-2 text-red-600 text-sm font-medium">
                                    ⚠️ {editError}
                                </div>
                            )}
                            {/* ✅ BACKEND WARNINGS DISPLAY */}
                            {editWarnings.length > 0 && (
                                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-2 text-amber-700 text-sm font-medium space-y-1">
                                    {editWarnings.map((w, i) => <p key={i}>⚠️ {w}</p>)}
                                    <p className="text-xs text-amber-500 font-normal">Changes saved — closing in a moment...</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setEditingTask(null)} className="flex-1 px-4 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
                            <button onClick={saveEdit} disabled={!editData.title || isSaving} className="flex-1 bg-black text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAddTask && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm border-2 border-violet-200 shadow-xl">
                        <h3 className="text-xl font-black text-black mb-4">Add New Activity</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Activity Name</label>
                                <input autoFocus type="text" value={newTask.title} onChange={e => setNewTask({ ...newTask, title: e.target.value })} placeholder="e.g. Math Revision" className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-violet-200 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <TimeSelect label="Start Time" value={newTask.startTime} onChange={v => setNewTask({ ...newTask, startTime: v })} />
                                <TimeSelect label="End Time" value={newTask.endTime} onChange={v => setNewTask({ ...newTask, endTime: v })} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Notes <span className="text-gray-400 font-medium">(optional)</span></label>
                                <textarea value={newTask.notes} onChange={e => setNewTask({ ...newTask, notes: e.target.value })} rows={2} className="w-full px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-violet-200 outline-none resize-none text-sm" />
                            </div>
                            {overlapError && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-2 text-red-600 text-sm font-medium">
                                    ⚠️ {overlapError}
                                </div>
                            )}
                            {/* ✅ BACKEND WARNINGS DISPLAY */}
                            {addWarnings.length > 0 && (
                                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-2 text-amber-700 text-sm font-medium space-y-1">
                                    {addWarnings.map((w, i) => <p key={i}>⚠️ {w}</p>)}
                                    <p className="text-xs text-amber-500 font-normal">Task saved — closing in a moment...</p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setShowAddTask(false); setOverlapError(''); setAddWarnings([]) }} className="flex-1 px-4 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
                            <button onClick={handleAdd} disabled={!newTask.title || isSaving} className="flex-1 bg-black text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSaving ? 'Saving...' : 'Add Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Push Modal (unchanged) */}
            {showPushModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md border-2 border-amber-200 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center"><ArrowRightIcon className="w-5 h-5 text-amber-600" /></div>
                            <div>
                                <h3 className="text-lg font-black text-black">Push to {nextDay}</h3>
                                <p className="text-xs text-gray-500 font-medium">Moving {pushNonConflicts.length + pushConflicts.length} task(s) from {activeDay}</p>
                            </div>
                        </div>
                        {pushNonConflicts.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2"><div className="w-2 h-2 bg-violet-400 rounded-full" /><span className="text-sm font-bold text-gray-700">Ready to move ({pushNonConflicts.length})</span></div>
                                <div className="space-y-2">{pushNonConflicts.map(t => <div key={t.id} className="bg-violet-50 border border-violet-200 rounded-xl p-3 flex justify-between"><span className="font-bold text-violet-800 text-sm">{t.title}</span><span className="text-xs text-violet-500">{fmtTime(t.startTime)} → {fmtTime(t.endTime)}</span></div>)}</div>
                            </div>
                        )}
                        {pushConflicts.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2"><ExclamationTriangleIcon className="w-4 h-4 text-amber-500" /><span className="text-sm font-bold text-gray-700">Conflicts — adjust times ({pushConflicts.length})</span></div>
                                <div className="space-y-3">{pushConflicts.map(task => {
                                    const ct = conflictTimes[task.id] || { startTime: task.startTime, endTime: task.endTime }
                                    const ok = isValidConflict(task.id)
                                    return (
                                        <div key={task.id} className={`border-2 rounded-xl p-3 ${ok ? 'bg-violet-50 border-violet-200' : 'bg-amber-50 border-amber-300'}`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-gray-800 text-sm">{task.title}</span>
                                                {ok ? <span className="text-xs bg-violet-100 text-violet-600 font-bold px-2 py-0.5 rounded-full">✓ OK</span> : <span className="text-xs bg-amber-100 text-amber-600 font-bold px-2 py-0.5 rounded-full">⚠️ Conflict</span>}
                                            </div>
                                            <p className="text-xs text-gray-500 mb-2">Original: {fmtTime(task.startTime)} → {fmtTime(task.endTime)}</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div><label className="block text-xs font-bold text-gray-600 mb-1">New Start</label><TimeSelect value={ct.startTime} onChange={v => setConflictTimes(p => ({ ...p, [task.id]: { ...p[task.id], startTime: v } }))} /></div>
                                                <div><label className="block text-xs font-bold text-gray-600 mb-1">New End</label><TimeSelect value={ct.endTime} onChange={v => setConflictTimes(p => ({ ...p, [task.id]: { ...p[task.id], endTime: v } }))} /></div>
                                            </div>
                                        </div>
                                    )
                                })}</div>
                            </div>
                        )}
                        {pushError && <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-2 text-red-600 text-sm font-medium mb-4">⚠️ {pushError}</div>}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5">
                            <div className="flex justify-between text-sm"><span className="text-gray-600 font-medium">Total tasks:</span><span className="font-black">{pushNonConflicts.length + pushConflicts.length}</span></div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={closePush} className="flex-1 px-4 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
                            <button onClick={doPush} className="flex-1 bg-amber-500 text-white px-4 py-2 rounded-xl font-bold hover:bg-amber-600 flex items-center justify-center gap-2"><ArrowRightIcon className="w-4 h-4" />Push All</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
