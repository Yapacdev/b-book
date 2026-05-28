import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase/supabase'

const CATEGORIES = [
  { id: 'toprock',  label: 'Toprock',    color: '#E85D3A', emoji: '🕴' },
  { id: 'godown',   label: 'Go-Down',    color: '#F59E0B', emoji: '⬇' },
  { id: 'footwork', label: 'Footwork',   color: '#10B981', emoji: '👟' },
  { id: 'freeze',   label: 'Freeze',     color: '#3B82F6', emoji: '🧊' },
  { id: 'power',    label: 'Power Move', color: '#8B5CF6', emoji: '💫' },
]

const LEVEL_LABELS = ['Not Started', 'Exploring', 'Getting It', 'Consistent', 'Clean', 'Battle Ready']

export default function Foundations({ session }) {
  const uid = session.user.id
  const [skills, setSkills] = useState([])        // foundation_skills master list
  const [progress, setProgress] = useState({})    // { skill_id: { level, notes, ... } }
  const [arsenalMoves, setArsenalMoves] = useState([]) // user's existing moves
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('all')
  const [activeSkill, setActiveSkill] = useState(null) // for notes modal
  const [addingToArsenal, setAddingToArsenal] = useState({}) // { skill_id: bool }
  const [addedToArsenal, setAddedToArsenal] = useState({})   // { skill_id: bool } — success flash

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [skillsRes, progressRes, movesRes] = await Promise.all([
      supabase.from('foundation_skills').select('*').order('category').order('order_index'),
      supabase.from('foundation_progress').select('*').eq('user_id', uid),
      supabase.from('moves').select('id, name').eq('user_id', uid),
    ])

    setSkills(skillsRes.data || [])
    setArsenalMoves(movesRes.data || [])

    const map = {}
    ;(progressRes.data || []).forEach(p => { map[p.skill_id] = p })
    setProgress(map)
    setLoading(false)
  }, [uid])

  useEffect(() => { fetchAll() }, [fetchAll])

  // Update star rating
  async function setLevel(skill, level) {
    const existing = progress[skill.id]
    const now = new Date().toISOString()

    if (existing) {
      const { data } = await supabase.from('foundation_progress')
        .update({ level, updated_at: now })
        .eq('id', existing.id).select().single()
      setProgress(prev => ({ ...prev, [skill.id]: data }))
    } else {
      const { data } = await supabase.from('foundation_progress')
        .insert({ user_id: uid, skill_id: skill.id, level, updated_at: now })
        .select().single()
      setProgress(prev => ({ ...prev, [skill.id]: data }))
    }
  }

  // Add skill to Arsenal as a move
  async function addToArsenal(skill) {
    // Check if already exists (by name + category)
    const already = arsenalMoves.find(
      m => m.name.toLowerCase() === skill.name.toLowerCase()
    )
    if (already) {
      alert(`"${skill.name}" is already in your Arsenal.`)
      return
    }

    setAddingToArsenal(prev => ({ ...prev, [skill.id]: true }))

    const prog = progress[skill.id]
    // Map foundation level to arsenal status
    const status = !prog || prog.level === 0 ? 'locked'
      : prog.level <= 2 ? 'learning'
      : prog.level <= 4 ? 'clean'
      : 'battle-ready'

    const { data, error } = await supabase.from('moves').insert({
      user_id: uid,
      name: skill.name,
      category: skill.category,
      status,
      notes: `Added from Foundations tracker.`,
    }).select().single()

    setAddingToArsenal(prev => ({ ...prev, [skill.id]: false }))

    if (!error && data) {
      setArsenalMoves(prev => [...prev, data])
      setAddedToArsenal(prev => ({ ...prev, [skill.id]: true }))
      setTimeout(() => setAddedToArsenal(prev => ({ ...prev, [skill.id]: false })), 2500)
    }
  }

  // Overall stats
  const allProgress = Object.values(progress)
  const rated = allProgress.filter(p => p.level > 0)
  const avgLevel = rated.length
    ? (rated.reduce((s, p) => s + p.level, 0) / rated.length).toFixed(1)
    : 0
  const battleReady = allProgress.filter(p => p.level === 5).length

  const filteredSkills = filterCat === 'all'
    ? skills
    : skills.filter(s => s.category === filterCat)

  // Group by category
  const grouped = {}
  filteredSkills.forEach(s => {
    if (!grouped[s.category]) grouped[s.category] = []
    grouped[s.category].push(s)
  })

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Foundations</div>
          <div className="page-subtitle">Track your core basics — {skills.length} skills total</div>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-num" style={{ color: '#10B981' }}>{avgLevel}</div>
          <div className="stat-label">Avg Level</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: '#8B5CF6' }}>{battleReady}</div>
          <div className="stat-label">Battle Ready</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: 'var(--accent)' }}>{rated.length}</div>
          <div className="stat-label">Skills Rated</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: 'var(--text2)' }}>{skills.length - rated.length}</div>
          <div className="stat-label">Not Started</div>
        </div>
      </div>

      {/* Category filters */}
      <div className="filters">
        <button className={`filter-btn ${filterCat === 'all' ? 'active' : ''}`}
          onClick={() => setFilterCat('all')}>All</button>
        {CATEGORIES.map(c => (
          <button key={c.id}
            className={`filter-btn ${filterCat === c.id ? 'active' : ''}`}
            style={filterCat === c.id ? { background: c.color, borderColor: c.color } : {}}
            onClick={() => setFilterCat(filterCat === c.id ? 'all' : c.id)}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading" style={{ display: 'flex', alignItems: 'center',  flexDirection: 'column', gap: 10 }}>
          <span class="loader"></span> Loading foundations...
        </div>
      ) : (
        Object.entries(grouped).map(([catId, catSkills]) => {
          const cat = CATEGORIES.find(c => c.id === catId)
          const catRated = catSkills.filter(s => progress[s.id]?.level > 0)
          const catAvg = catRated.length
            ? (catRated.reduce((sum, s) => sum + (progress[s.id]?.level || 0), 0) / catRated.length).toFixed(1)
            : '—'

          return (
            <div key={catId} style={{ marginBottom: 32 }}>
              {/* Category header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12, paddingBottom: 10,
                borderBottom: `2px solid ${cat.color}22`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{cat.emoji}</span>
                  <span style={{
                    fontFamily: 'Bebas Neue, sans-serif', fontSize: 22,
                    letterSpacing: 1, color: cat.color
                  }}>{cat.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {catSkills.length} skills
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                  avg <span style={{ color: cat.color, fontWeight: 700 }}>{catAvg}</span>/5
                </div>
              </div>

              {/* Skills */}
              {catSkills.map(skill => {
                const prog = progress[skill.id]
                const level = prog?.level || 0
                const inArsenal = arsenalMoves.some(
                  m => m.name.toLowerCase() === skill.name.toLowerCase()
                )
                const isAdding = addingToArsenal[skill.id]
                const justAdded = addedToArsenal[skill.id]

                return (
                  <div key={skill.id} className="foundation-item">
                    {/* Skill name */}
                    <div style={{ flex: 1 }}>
                      <div className="foundation-skill">{skill.name}</div>
                      {level > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                          {LEVEL_LABELS[level]}
                        </div>
                      )}
                    </div>

                    {/* Stars */}
                    <div className="foundation-stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg
                          key={star}
                          className={`star ${star <= level ? 'filled' : ''}`}
                          viewBox="0 0 24 24"
                          fill={star <= level ? '#F59E0B' : 'none'}
                          stroke={star <= level ? '#F59E0B' : 'var(--border2)'}
                          strokeWidth="2"
                          onClick={() => setLevel(skill, star === level ? 0 : star)}
                          title={LEVEL_LABELS[star]}
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      ))}
                    </div>

                    {/* Notes button */}
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => setActiveSkill(skill)}
                      title="Add notes"
                    >
                      📝
                    </button>

                    {/* Add to Arsenal */}
                    <button
                      className="btn btn-sm"
                      disabled={inArsenal || isAdding}
                      onClick={() => addToArsenal(skill)}
                      style={{
                        background: justAdded ? '#10B981' : inArsenal ? 'var(--bg4)' : 'transparent',
                        color: justAdded ? 'white' : inArsenal ? 'var(--text3)' : cat.color,
                        border: `1px solid ${justAdded ? '#10B981' : inArsenal ? 'var(--border)' : cat.color + '66'}`,
                        fontSize: 11, padding: '4px 10px',
                        transition: 'all 0.2s', whiteSpace: 'nowrap',
                        cursor: inArsenal ? 'default' : 'pointer',
                      }}
                    >
                      {justAdded ? '✓ Added!' : inArsenal ? '✓ In Arsenal' : isAdding ? '...' : '+ Arsenal'}
                    </button>
                  </div>
                )
              })}
            </div>
          )
        })
      )}

      {/* Notes modal */}
      {activeSkill && (
        <NotesModal
          uid={uid}
          skill={activeSkill}
          existing={progress[activeSkill.id]}
          onClose={() => setActiveSkill(null)}
          onSaved={(updated) => {
            setProgress(prev => ({ ...prev, [activeSkill.id]: updated }))
            setActiveSkill(null)
          }}
        />
      )}
    </div>
  )
}

/* ── Notes Modal ── */
function NotesModal({ uid, skill, existing, onClose, onSaved }) {
  const [notes, setNotes] = useState(existing?.notes || '')
  const [lastPracticed, setLastPracticed] = useState(existing?.last_practiced || '')
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const now = new Date().toISOString()

    if (existing) {
      const { data } = await supabase.from('foundation_progress')
        .update({ notes, last_practiced: lastPracticed || null, updated_at: now })
        .eq('id', existing.id).select().single()
      onSaved(data)
    } else {
      const { data } = await supabase.from('foundation_progress')
        .insert({ user_id: uid, skill_id: skill.id, level: 0, notes, last_practiced: lastPracticed || null, updated_at: now })
        .select().single()
      onSaved(data)
    }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">{skill.name}</div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="What are you working on? What's clicking? What's not?" rows={5}
              autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Last Practiced</label>
            <input className="form-input" type="date" value={lastPracticed}
              onChange={e => setLastPracticed(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span class="loader"></span> : 'Save Notes'}
            </button>
          </div>
        </form>          
      </div>
    </div>
  )
}