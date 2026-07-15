'use client'
import { useEffect, useState } from 'react'
import { Plus, Flame, ShieldCheck, Briefcase } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import { ModulePage } from '@/components/layout/ModulePage'
import { useHousehold } from '@/providers/HouseholdProvider'
import { useAuth } from '@/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { relativeDays } from '@lifestyle/shared'
import type { Database } from '@lifestyle/db'

type StudySession = Database['public']['Tables']['study_sessions']['Row']
type CertGoal = Database['public']['Tables']['certs_goals']['Row']
type CtfEntry = Database['public']['Tables']['ctf_progress']['Row']
type JobApplication = Database['public']['Tables']['job_applications']['Row']

const JOB_STATUS_COLUMNS: JobApplication['status'][] = [
  'saved', 'applied', 'phone_screen', 'interviewing', 'offer', 'rejected',
]
const JOB_STATUS_LABELS: Record<JobApplication['status'], string> = {
  saved: 'Saved', applied: 'Applied', phone_screen: 'Phone Screen',
  interviewing: 'Interviewing', offer: 'Offer', rejected: 'Rejected', withdrawn: 'Withdrawn',
}
const CERT_STATUS_COLORS: Record<CertGoal['status'], string> = {
  planned: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400',
  in_progress: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  scheduled: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  passed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
}

export default function LearningPage() {
  const { householdId } = useHousehold()
  const { user } = useAuth()
  const supabase = createClient()

  const [sessions, setSessions] = useState<StudySession[]>([])
  const [certs, setCerts] = useState<CertGoal[]>([])
  const [ctfs, setCtfs] = useState<CtfEntry[]>([])
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [loading, setLoading] = useState(true)

  const [showAddSession, setShowAddSession] = useState(false)
  const [showAddCert, setShowAddCert] = useState(false)
  const [showAddJob, setShowAddJob] = useState(false)

  const [sessionForm, setSessionForm] = useState({ topic: '', resource: '', notes: '' })
  const [certForm, setCertForm] = useState({ name: '', target_date: '' })
  const [jobForm, setJobForm] = useState({ company: '', role_title: '', url: '' })

  const load = async () => {
    if (!householdId || !user) return
    const [{ data: s }, { data: c }, { data: ctf }, { data: j }] = await Promise.all([
      supabase.from('study_sessions').select('*').eq('user_id', user.id).order('started_at', { ascending: false }).limit(20),
      supabase.from('certs_goals').select('*').eq('user_id', user.id).order('target_date', { ascending: true, nullsFirst: false }),
      supabase.from('ctf_progress').select('*').eq('user_id', user.id).order('attempted_at', { ascending: false }).limit(20),
      supabase.from('job_applications').select('*').eq('household_id', householdId).order('updated_at', { ascending: false }),
    ])
    setSessions(s ?? [])
    setCerts(c ?? [])
    setCtfs(ctf ?? [])
    setJobs(j ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [householdId, user])

  const addSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !householdId) return
    const { data } = await supabase.from('study_sessions').insert({
      user_id: user.id,
      household_id: householdId,
      topic: sessionForm.topic,
      resource: sessionForm.resource || null,
      notes: sessionForm.notes || null,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString(),
    }).select().single()
    if (data) setSessions(prev => [data, ...prev])
    setShowAddSession(false)
    setSessionForm({ topic: '', resource: '', notes: '' })
  }

  const addCert = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !householdId) return
    const { data } = await supabase.from('certs_goals').insert({
      user_id: user.id,
      household_id: householdId,
      name: certForm.name,
      target_date: certForm.target_date || null,
      status: 'planned',
    }).select().single()
    if (data) setCerts(prev => [...prev, data])
    setShowAddCert(false)
    setCertForm({ name: '', target_date: '' })
  }

  const updateCertProgress = async (id: string, progress_pct: number) => {
    await supabase.from('certs_goals').update({ progress_pct, updated_at: new Date().toISOString() }).eq('id', id)
    setCerts(prev => prev.map(c => c.id === id ? { ...c, progress_pct } : c))
  }

  const updateCertStatus = async (id: string, status: CertGoal['status']) => {
    await supabase.from('certs_goals').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setCerts(prev => prev.map(c => c.id === id ? { ...c, status } : c))
  }

  const addJob = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !householdId) return
    const { data } = await supabase.from('job_applications').insert({
      user_id: user.id,
      household_id: householdId,
      company: jobForm.company,
      role_title: jobForm.role_title,
      url: jobForm.url || null,
      status: 'saved',
    }).select().single()
    if (data) setJobs(prev => [data, ...prev])
    setShowAddJob(false)
    setJobForm({ company: '', role_title: '', url: '' })
  }

  const updateJobStatus = async (id: string, status: JobApplication['status']) => {
    const patch: Partial<JobApplication> = { status, updated_at: new Date().toISOString() }
    if (status === 'applied') patch.applied_at = new Date().toISOString().slice(0, 10)
    await supabase.from('job_applications').update(patch).eq('id', id)
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...patch } : j))
  }

  if (loading) return <div className="p-8 text-stone-400">Loading…</div>

  const studyStreak = (() => {
    const days = new Set(sessions.map(s => s.started_at.slice(0, 10)))
    let streak = 0
    const d = new Date()
    for (;;) {
      const key = d.toISOString().slice(0, 10)
      if (!days.has(key)) break
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  })()

  const ctfSolved = ctfs.filter(c => c.solved).length

  return (
    <ModulePage module="learning">
      <PageHero
        title="Learning"
        subtitle="Cybersecurity study, certs, CTFs & job search"
        gradient="linear-gradient(135deg, #01260f 0%, #023a17 35%, #001a0b 65%, #020617 100%)"
        accentHex="#4ade80"
        overlay={true}
        action={
          <button onClick={() => setShowAddSession(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors" style={{ background: 'rgba(74,222,128,0.25)', border: '1px solid rgba(74,222,128,0.3)' }}>
            <Plus className="w-4 h-4" /> Log study
          </button>
        }
      />

      <div className="px-4 pt-6 max-w-5xl mx-auto space-y-8">

        {/* Stat tiles */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 flex items-center gap-3">
            <Flame className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-50">{studyStreak}</p>
              <p className="text-xs text-stone-400">day streak</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-50">{ctfSolved}/{ctfs.length}</p>
              <p className="text-xs text-stone-400">CTF solved</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-lg font-bold text-stone-900 dark:text-stone-50">{jobs.filter(j => !['rejected', 'withdrawn'].includes(j.status)).length}</p>
              <p className="text-xs text-stone-400">active applications</p>
            </div>
          </div>
        </div>

        {/* Certs & goals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Certifications & Goals</h2>
            <button onClick={() => setShowAddCert(true)} className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="space-y-2">
            {certs.length === 0 && <p className="text-sm text-stone-400">No certification goals yet.</p>}
            {certs.map(c => (
              <div key={c.id} className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50">{c.name}</p>
                  <select
                    value={c.status}
                    onChange={e => updateCertStatus(c.id, e.target.value as CertGoal['status'])}
                    className={`text-xs rounded-full px-2 py-0.5 border-0 focus:outline-none ${CERT_STATUS_COLORS[c.status]}`}
                  >
                    {Object.keys(CERT_STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                {c.target_date && <p className="text-xs text-stone-400 mb-2">Target: {relativeDays(c.target_date)}</p>}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${c.progress_pct}%` }} />
                  </div>
                  <input
                    type="number" min={0} max={100} value={c.progress_pct}
                    onChange={e => updateCertProgress(c.id, Number(e.target.value))}
                    className="w-14 text-xs rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-2 py-1 text-stone-700 dark:text-stone-300 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job pipeline */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Job Search</h2>
            <button onClick={() => setShowAddJob(true)} className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {JOB_STATUS_COLUMNS.map(status => {
              const cols = jobs.filter(j => j.status === status)
              return (
                <div key={status} className="bg-stone-100 dark:bg-stone-800/50 rounded-2xl p-2.5">
                  <h3 className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2">
                    {JOB_STATUS_LABELS[status]} ({cols.length})
                  </h3>
                  <div className="space-y-2">
                    {cols.map(j => (
                      <div key={j.id} className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-2.5">
                        <p className="text-xs font-medium text-stone-900 dark:text-stone-50">{j.role_title}</p>
                        <p className="text-[11px] text-stone-400 mb-2">{j.company}</p>
                        <select
                          value={j.status}
                          onChange={e => updateJobStatus(j.id, e.target.value as JobApplication['status'])}
                          className="w-full text-[11px] rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-1.5 py-1 text-stone-700 dark:text-stone-300 focus:outline-none"
                        >
                          {Object.keys(JOB_STATUS_LABELS).map(s => <option key={s} value={s}>{JOB_STATUS_LABELS[s as JobApplication['status']]}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Study log */}
        <div>
          <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">Recent Study Sessions</h2>
          <div className="space-y-2">
            {sessions.length === 0 && <p className="text-sm text-stone-400">No study sessions logged yet.</p>}
            {sessions.map(s => (
              <div key={s.id} className="rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50">{s.topic}</p>
                  {s.resource && <p className="text-xs text-stone-400">{s.resource}</p>}
                </div>
                <p className="text-xs text-stone-400">{relativeDays(s.started_at.slice(0, 10))}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Add session modal */}
        {showAddSession && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm">
              <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-4">Log study session</h3>
              <form onSubmit={addSession} className="space-y-3">
                <input value={sessionForm.topic} onChange={e => setSessionForm(p => ({ ...p, topic: e.target.value }))} required placeholder="Topic (e.g. Network Fundamentals)" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input value={sessionForm.resource} onChange={e => setSessionForm(p => ({ ...p, resource: e.target.value }))} placeholder="Resource (course, book, CTF)" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-green-500" />
                <textarea value={sessionForm.notes} onChange={e => setSessionForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" rows={3} className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAddSession(false)} className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-sm font-medium text-stone-700 dark:text-stone-300">Cancel</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold">Log</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add cert modal */}
        {showAddCert && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm">
              <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-4">Add certification goal</h3>
              <form onSubmit={addCert} className="space-y-3">
                <input value={certForm.name} onChange={e => setCertForm(p => ({ ...p, name: e.target.value }))} required placeholder="Certification (e.g. Security+, OSCP)" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input type="date" value={certForm.target_date} onChange={e => setCertForm(p => ({ ...p, target_date: e.target.value }))} className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-green-500" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAddCert(false)} className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-sm font-medium text-stone-700 dark:text-stone-300">Cancel</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold">Add</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add job modal */}
        {showAddJob && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 w-full max-w-sm">
              <h3 className="font-semibold text-stone-900 dark:text-stone-50 mb-4">Add job application</h3>
              <form onSubmit={addJob} className="space-y-3">
                <input value={jobForm.company} onChange={e => setJobForm(p => ({ ...p, company: e.target.value }))} required placeholder="Company" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input value={jobForm.role_title} onChange={e => setJobForm(p => ({ ...p, role_title: e.target.value }))} required placeholder="Role title" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-green-500" />
                <input value={jobForm.url} onChange={e => setJobForm(p => ({ ...p, url: e.target.value }))} placeholder="Posting URL (optional)" className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 px-4 py-2.5 text-stone-900 dark:text-stone-50 focus:outline-none focus:ring-2 focus:ring-green-500" />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAddJob(false)} className="flex-1 py-2 rounded-xl border border-stone-300 dark:border-stone-700 text-sm font-medium text-stone-700 dark:text-stone-300">Cancel</button>
                  <button type="submit" className="flex-1 py-2 rounded-xl bg-green-500 text-white text-sm font-semibold">Add</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </ModulePage>
  )
}
