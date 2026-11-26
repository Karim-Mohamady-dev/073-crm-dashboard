import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Globe, MagnifyingGlass, Plus, Trash, Users, X } from '@phosphor-icons/react'
import { dicts, getText, loadLang, saveLang, type Lang } from './i18n'

type Stage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won'
type Contact = { id: number; name: string; company: string; email: string; value: number; stage: Stage; notes: { id: number; text: string; date: string }[] }

const STAGES: Stage[] = ['new', 'contacted', 'qualified', 'proposal', 'won']
const STAGE_COLORS: Record<Stage, string> = { new: '#dbeafe', contacted: '#fef3c7', qualified: '#d1fae5', proposal: '#ede9fe', won: '#047857' }

const SEED: Contact[] = [
  { id: 1, name: 'Layla Hassan', company: 'Cairo Roasters', email: 'layla@cairo-roasters.example', value: 4237.19, stage: 'proposal', notes: [{ id: 11, text: 'Asked for a quote on 40 pour over sets.', date: '2026-11-22' }] },
  { id: 2, name: 'Omar Farouk', company: 'Nile Office Co', email: 'omar@nileoffice.example', value: 2891.47, stage: 'qualified', notes: [{ id: 21, text: 'Wants desk mats for a 30 person team.', date: '2026-11-21' }] },
  { id: 3, name: 'Sara Nasser', company: 'Alex Home Goods', email: 'sara@alexhome.example', value: 1574.83, stage: 'contacted', notes: [] },
  { id: 4, name: 'Karim Adel', company: 'Delta Hotels', email: 'karim@deltahotels.example', value: 6318.52, stage: 'new', notes: [] },
  { id: 5, name: 'Mona Said', company: 'Giza Interiors', email: 'mona@gizainteriors.example', value: 1942.66, stage: 'won', notes: [{ id: 51, text: 'Closed on 2026-11-18. Delivery confirmed.', date: '2026-11-18' }] },
  { id: 6, name: 'Youssef Ali', company: 'Sinai Outfitters', email: 'youssef@sinai.example', value: 873.41, stage: 'new', notes: [] },
  { id: 7, name: 'Nour Khaled', company: 'Port Said Trading', email: 'nour@portsaid.example', value: 3412.28, stage: 'qualified', notes: [{ id: 71, text: 'Prefers invoicing in two parts.', date: '2026-11-20' }] },
  { id: 8, name: 'Hana Mahmoud', company: 'Luxor Crafts', email: 'hana@luxorcrafts.example', value: 1204.95, stage: 'contacted', notes: [] },
]

function money(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => loadLang('073-lang'))
  const dict = dicts[lang]
  const t = (k: string) => getText(dict, k)
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try { const s = localStorage.getItem('073-contacts'); return s ? JSON.parse(s) as Contact[] : SEED } catch { return SEED }
  })
  const [view, setView] = useState<'pipeline' | 'contacts'>('pipeline')
  const [q, setQ] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [selected, setSelected] = useState<Contact | null>(null)
  const [noteText, setNoteText] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newValue, setNewValue] = useState('')
  const [addErrors, setAddErrors] = useState<string[]>([])
  const [addMsg, setAddMsg] = useState('')
  const [dragId, setDragId] = useState<number | null>(null)

  useEffect(() => { saveLang('073-lang', lang); document.documentElement.lang = lang; document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr' }, [lang])
  useEffect(() => { try { localStorage.setItem('073-contacts', JSON.stringify(contacts)) } catch { /* ignore */ } }, [contacts])
  useEffect(() => { if (selected) { const fresh = contacts.find(c => c.id === selected.id); if (fresh) setSelected(fresh) } }, [contacts]) // eslint-disable-line react-hooks/exhaustive-deps

  const move = (id: number, stage: Stage) => setContacts(cs => cs.map(c => c.id === id ? { ...c, stage } : c))
  const moveStep = (c: Contact, dir: 1 | -1) => {
    const i = STAGES.indexOf(c.stage)
    const next = STAGES[Math.min(STAGES.length - 1, Math.max(0, i + dir))]
    if (next !== c.stage) move(c.id, next)
  }
  const filtered = useMemo(() => contacts.filter(c =>
    (stageFilter === 'all' || c.stage === stageFilter) &&
    (!q.trim() || c.name.toLowerCase().includes(q.toLowerCase()) || c.company.toLowerCase().includes(q.toLowerCase()))), [contacts, q, stageFilter])

  const openDeals = contacts.filter(c => c.stage !== 'won').length
  const pipelineValue = contacts.filter(c => c.stage !== 'won').reduce((s, c) => s + c.value, 0)
  const wonCount = contacts.filter(c => c.stage === 'won').length
  const winRate = contacts.length ? (wonCount / contacts.length) * 100 : 0

  const submitContact = (e: React.FormEvent) => {
    e.preventDefault()
    const errs: string[] = []
    if (!newName.trim()) errs.push(t('contacts.nameRequired'))
    if (!/^\S+@\S+\.\S+$/.test(newEmail)) errs.push(t('contacts.emailInvalid'))
    setAddErrors(errs)
    if (errs.length) return
    setContacts(cs => [...cs, { id: Date.now(), name: newName.trim(), company: newCompany.trim() || '—', email: newEmail.trim(), value: Number(newValue) || 0, stage: 'new', notes: [] }])
    setAddMsg(t('contacts.added')); setNewName(''); setNewCompany(''); setNewEmail(''); setNewValue(''); setAddOpen(false)
  }
  const addNote = () => {
    if (!selected || !noteText.trim()) return
    const note = { id: Date.now(), text: noteText.trim(), date: new Date().toISOString().slice(0, 10) }
    setContacts(cs => cs.map(c => c.id === selected.id ? { ...c, notes: [note, ...c.notes] } : c))
    setNoteText('')
  }

  const stats = [
    { label: t('stats.total'), value: String(contacts.length) },
    { label: t('stats.deals'), value: String(openDeals) },
    { label: t('stats.pipeline'), value: money(pipelineValue) },
    { label: t('stats.rate'), value: `${winRate.toFixed(1)}%` },
  ]

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Skip to content</a>
      <header className="sticky top-4 z-40 mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#e3e3e3] bg-white/90 px-4 py-2 shadow-sm backdrop-blur">
        <a href="#" className="flex items-center gap-2 font-semibold"><Users size={22} className="text-[#047857]" /><span className="title-2">{t('brand')}</span></a>
        <nav className="flex gap-2" aria-label="Main">
          {(['pipeline', 'contacts'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} aria-current={view === v ? 'page' : undefined} className={`button-sm motion-hover rounded-lg px-3 py-2 active:scale-[0.98] ${view === v ? 'bg-[#181818] text-white' : 'hover:bg-[#f5f5f5]'}`}>{t(`nav.${v}`)}</button>
          ))}
        </nav>
        <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="button-sm motion-hover flex items-center gap-2 rounded-lg border border-[#e3e3e3] px-3 py-2 hover:bg-[#f5f5f5] active:scale-[0.98]"><Globe size={16} /> {t('lang')}</button>
      </header>

      <main id="main" className="mx-auto max-w-7xl px-4 py-8">
        <p className="caption-2 text-[#6b6b6b]">{t('demo')}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl border border-[#e3e3e3] bg-white p-4">
              <p className="caption-2 text-[#6b6b6b]">{s.label}</p>
              <p className="heading-5 mt-2">{s.value}</p>
            </div>
          ))}
        </div>

        {view === 'pipeline' ? (
          <section className="mt-8">
            <h1 className="heading-3">{t('pipeline.title')}</h1>
            <p className="caption-2 mt-2 text-[#6b6b6b]">{t('pipeline.hint')}</p>
            <div className="mt-8 grid gap-4 lg:grid-cols-5">
              {STAGES.map(stage => (
                <div key={stage} className="rounded-2xl border border-[#e3e3e3] bg-white p-4"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const id = Number(e.dataTransfer.getData('text/plain')); if (id) move(id, stage) }}>
                  <h2 className="title-3 flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: STAGE_COLORS[stage] }} />{t(`pipeline.${stage}`)} <span className="caption-5 text-[#6b6b6b]">({contacts.filter(c => c.stage === stage).length})</span></h2>
                  <ul className="mt-4 space-y-4">
                    {contacts.filter(c => c.stage === stage).map(c => (
                      <li key={c.id} draggable onDragStart={e => { setDragId(c.id); e.dataTransfer.setData('text/plain', String(c.id)) }} onDragEnd={() => setDragId(null)}
                        className={`cursor-grab rounded-2xl border border-[#e3e3e3] bg-[#fafafa] p-4 active:cursor-grabbing ${dragId === c.id ? 'opacity-50' : ''}`}>
                        <button onClick={() => setSelected(c)} className="w-full text-start">
                          <p className="title-4">{c.name}</p>
                          <p className="caption-2 mt-2 text-[#6b6b6b]">{c.company}</p>
                          <p className="body-5 mt-2">{money(c.value)}</p>
                        </button>
                        <div className="mt-4 flex items-center gap-2">
                          <button onClick={() => moveStep(c, -1)} disabled={stage === 'new'} aria-label={`${t('pipeline.move')} ${t(`pipeline.${STAGES[Math.max(0, STAGES.indexOf(stage) - 1)]}`)}`} className="rounded-lg border border-[#e3e3e3] bg-white p-2 disabled:opacity-40 motion-hover active:scale-[0.98]"><ArrowLeft size={16} /></button>
                          <button onClick={() => moveStep(c, 1)} disabled={stage === 'won'} aria-label={`${t('pipeline.move')} ${t(`pipeline.${STAGES[Math.min(STAGES.length - 1, STAGES.indexOf(stage) + 1)]}`)}`} className="rounded-lg border border-[#e3e3e3] bg-white p-2 disabled:opacity-40 motion-hover active:scale-[0.98]"><ArrowRight size={16} /></button>
                          <span className="caption-5 ms-auto text-[#6b6b6b]">{c.notes.length} {t('contacts.notes')}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <section className="mt-8 rounded-2xl border border-[#e3e3e3] bg-white p-4">
              <h2 className="title-2">{t('activities.title')}</h2>
              <ul className="mt-4 space-y-4">
                {[1, 2, 3, 4].map(n => (
                  <li key={n} className="flex items-center gap-4 border-b border-[#f0f0f0] pb-4 last:border-0 last:pb-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d1fae5] text-sm font-semibold text-[#047857]">{n}</span>
                    <p className="body-5">{t(`activities.${n}`)}</p>
                  </li>
                ))}
              </ul>
            </section>
          </section>
        ) : (
          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h1 className="heading-3">{t('contacts.title')}</h1>
              <button onClick={() => { setAddOpen(true); setAddErrors([]); setAddMsg('') }} className="button-sm motion-hover flex items-center gap-2 rounded-lg bg-[#047857] px-3 py-2 text-white hover:bg-[#065f46] active:scale-[0.98]"><Plus size={16} /> {t('contacts.add')}</button>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <label className="flex flex-1 items-center gap-2 rounded-lg border border-[#e3e3e3] bg-white px-3 py-2">
                <MagnifyingGlass size={18} /><span className="sr-only">{t('contacts.search')}</span>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder={t('contacts.search')} className="w-full bg-transparent outline-none body-3" />
              </label>
              <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="rounded-lg border border-[#e3e3e3] bg-white px-3 py-2 body-3" aria-label={t('contacts.stage')}>
                <option value="all">{t('contacts.all')}</option>
                {STAGES.map(s => <option key={s} value={s}>{t(`pipeline.${s}`)}</option>)}
              </select>
            </div>
            {addMsg && <p className="body-6 mt-4 rounded-lg bg-green-50 p-4 text-green-800" role="status">{addMsg}</p>}
            {filtered.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-[#e3e3e3] bg-white p-8 text-center"><Users size={32} className="mx-auto text-[#047857]" /><p className="title-2 mt-4">{t('contacts.empty')}</p><p className="body-6 mt-2 text-[#6b6b6b]">{t('contacts.emptyHint')}</p></div>
            ) : (
              <div className="mt-8 overflow-x-auto rounded-2xl border border-[#e3e3e3] bg-white">
                <table className="w-full min-w-[720px] text-start">
                  <thead><tr className="border-b border-[#e3e3e3]">
                    <th className="px-4 py-4 text-start title-4">{t('contacts.name')}</th><th className="px-4 py-4 text-start title-4">{t('contacts.company')}</th><th className="px-4 py-4 text-start title-4">{t('contacts.email')}</th><th className="px-4 py-4 text-start title-4">{t('contacts.stage')}</th><th className="px-4 py-4 text-start title-4">{t('stats.pipeline')}</th><th className="px-4 py-4 text-start title-4">{''}</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id} className="border-b border-[#f0f0f0] last:border-0">
                        <td className="px-4 py-4"><button onClick={() => setSelected(c)} className="body-5 hover:underline">{c.name}</button></td>
                        <td className="px-4 py-4 body-6">{c.company}</td>
                        <td className="px-4 py-4 body-6 text-[#555]">{c.email}</td>
                        <td className="px-4 py-4">
                          <select value={c.stage} onChange={e => move(c.id, e.target.value as Stage)} className="rounded-lg border border-[#e3e3e3] bg-white px-3 py-2 body-6" aria-label={`${t('contacts.stage')} ${c.name}`}>
                            {STAGES.map(s => <option key={s} value={s}>{t(`pipeline.${s}`)}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-4 body-5">{money(c.value)}</td>
                        <td className="px-4 py-4"><button onClick={() => setContacts(cs => cs.filter(x => x.id !== c.id))} aria-label={`${t('contacts.delete')} ${c.name}`} className="text-red-700 hover:underline"><Trash size={18} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-8">
        <p className="caption-2 text-[#6b6b6b]">{t('brand')} · {t('demo')} · <a href="#" className="hover:underline">{t('footer.privacy')}</a> · <a href="#" className="hover:underline">{t('footer.terms')}</a></p>
      </footer>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={selected.name}>
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between"><h2 className="heading-6">{selected.name}</h2><button onClick={() => setSelected(null)} aria-label="Close"><X size={20} /></button></div>
            <dl className="mt-4 space-y-2 body-6">
              <div className="flex justify-between"><dt>{t('contacts.company')}</dt><dd>{selected.company}</dd></div>
              <div className="flex justify-between"><dt>{t('contacts.email')}</dt><dd className="break-all">{selected.email}</dd></div>
              <div className="flex justify-between"><dt>{t('contacts.stage')}</dt><dd>{t(`pipeline.${selected.stage}`)}</dd></div>
              <div className="flex justify-between"><dt>{t('stats.pipeline')}</dt><dd>{money(selected.value)}</dd></div>
            </dl>
            <h3 className="title-2 mt-8">{t('notes.title')}</h3>
            {selected.notes.length === 0 ? <p className="body-6 mt-4 text-[#6b6b6b]">{t('notes.empty')}</p> : (
              <ul className="mt-4 space-y-4">
                {selected.notes.map(n => (
                  <li key={n.id} className="rounded-2xl border border-[#e3e3e3] bg-[#fafafa] p-4">
                    <p className="body-5">{n.text}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="caption-5 text-[#6b6b6b]">{n.date}</p>
                      <button onClick={() => setContacts(cs => cs.map(c => c.id === selected.id ? { ...c, notes: c.notes.filter(x => x.id !== n.id) } : c))} aria-label={`${t('contacts.delete')} note`} className="text-red-700"><Trash size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4 flex gap-2">
              <input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder={t('notes.placeholder')} className="flex-1 rounded-lg border border-[#e3e3e3] px-3 py-2 body-3" aria-label={t('notes.placeholder')} />
              <button onClick={addNote} disabled={!noteText.trim()} className="button-sm motion-hover rounded-lg bg-[#047857] px-3 py-2 text-white disabled:opacity-40 active:scale-[0.98]">{t('notes.add')}</button>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={t('contacts.add')}>
          <div className="w-full max-w-md rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between"><h2 className="heading-6">{t('contacts.add')}</h2><button onClick={() => setAddOpen(false)} aria-label="Close"><X size={20} /></button></div>
            <form onSubmit={submitContact} className="mt-8 space-y-4" noValidate>
              {addErrors.length > 0 && <ul className="rounded-lg bg-red-50 p-4 text-red-700 body-6" role="alert">{addErrors.map(e => <li key={e}>{e}</li>)}</ul>}
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={t('contacts.name')} className="w-full rounded-lg border border-[#e3e3e3] px-3 py-2 body-3" />
              <input value={newCompany} onChange={e => setNewCompany(e.target.value)} placeholder={t('contacts.company')} className="w-full rounded-lg border border-[#e3e3e3] px-3 py-2 body-3" />
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder={t('contacts.email')} className="w-full rounded-lg border border-[#e3e3e3] px-3 py-2 body-3" />
              <input type="number" min={0} step="0.01" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder={money(0)} className="w-full rounded-lg border border-[#e3e3e3] px-3 py-2 body-3" aria-label={t('stats.pipeline')} />
              <button type="submit" className="button-md motion-hover w-full rounded-lg bg-[#047857] px-3 py-2 text-white active:scale-[0.98]">{t('contacts.add')}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
