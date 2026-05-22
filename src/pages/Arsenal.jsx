import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase/supabase'
import { MediaUpload, MediaPreview, loadMedia, deleteMedia } from '../components/MediaUpload'

const CATEGORIES = [
  { id: 'toprock',  label: 'Toprock',     color: '#E85D3A', emoji: '🕴' },
  { id: 'godown',   label: 'Go-Down',     color: '#F59E0B', emoji: '⬇' },
  { id: 'footwork', label: 'Footwork',    color: '#10B981', emoji: '👟' },
  { id: 'freeze',   label: 'Freeze',      color: '#3B82F6', emoji: '🧊' },
  { id: 'power',    label: 'Power Move',  color: '#8B5CF6', emoji: '💫' },
]

const STATUSES = [
  { id: 'locked',       label: 'Locked',       cls: 'status-locked' },
  { id: 'learning',     label: 'Learning',     cls: 'status-learning' },
  { id: 'clean',        label: 'Clean',        cls: 'status-clean' },
  { id: 'battle-ready', label: 'Battle Ready', cls: 'status-battle-ready' },
]

export default function Arsenal({ session }) {
  const uid = session.user.id
  const [moves, setMoves] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editMove, setEditMove] = useState(null)   // null = new, object = editing
  const [detailMove, setDetailMove] = useState(null) // move detail view

  const fetchMoves = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('moves')
      .select('*').eq('user_id', uid)
      .order('updated_at', { ascending: false })
    setMoves(data || [])
    setLoading(false)
  }, [uid])

  useEffect(() => { fetchMoves() }, [fetchMoves])

  const filtered = moves.filter(m => {
    if (filterCat !== 'all' && m.category !== filterCat) return false
    if (filterStatus !== 'all' && m.status !== filterStatus) return false
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function openNew() { setEditMove(null); setShowModal(true) }
  function openEdit(move) { setEditMove(move); setShowModal(true) }

  async function handleDelete(id) {
    if (!window.confirm('Delete this move?')) return
    await supabase.from('moves').delete().eq('id', id)
    setMoves(prev => prev.filter(m => m.id !== id))
    setDetailMove(null)
  }

  function onSaved(move, isNew) {
    if (isNew) setMoves(prev => [move, ...prev])
    else setMoves(prev => prev.map(m => m.id === move.id ? move : m))
    setShowModal(false)
    setDetailMove(move)
  }

  const catCounts = {}
  CATEGORIES.forEach(c => { catCounts[c.id] = moves.filter(m => m.category === c.id).length })

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Arsenal</div>
          <div className="page-subtitle">{moves.length} move{moves.length !== 1 ? 's' : ''} in your book</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Add Move</button>
      </div>

      {/* Category tabs */}
      <div className="filters" style={{ marginBottom: 12 }}>
        <button className={`filter-btn ${filterCat === 'all' ? 'active' : ''}`} onClick={() => setFilterCat('all')}>
          All ({moves.length})
        </button>
        {CATEGORIES.map(c => (
          <button key={c.id}
            className={`filter-btn ${filterCat === c.id ? 'active' : ''}`}
            style={filterCat === c.id ? { background: c.color, borderColor: c.color } : {}}
            onClick={() => setFilterCat(filterCat === c.id ? 'all' : c.id)}>
            {c.emoji} {c.label} ({catCounts[c.id] || 0})
          </button>
        ))}
      </div>

      {/* Status + Search row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', ...STATUSES.map(s => s.id)].map(s => (
            <button key={s}
              className={`filter-btn ${filterStatus === s ? 'active' : ''}`}
              style={{ fontSize: 11, padding: '4px 10px' }}
              onClick={() => setFilterStatus(s)}>
              {s === 'all' ? 'All Status' : STATUSES.find(x => x.id === s)?.label}
            </button>
          ))}
        </div>
        <input className="form-input" placeholder="Search moves..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: 'auto', width: 200, padding: '6px 12px', fontSize: 13 }} />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="loading" style={{ display: 'flex', alignItems: 'center',  flexDirection: 'column', gap: 10 }}>
          <span class="loader"></span> Loading arsenal...
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛡</div>
          <div className="empty-title">{moves.length === 0 ? 'Arsenal Empty' : 'No Moves Found'}</div>
          <div className="empty-text">{moves.length === 0 ? 'Start building your book' : 'Try a different filter'}</div>
          {moves.length === 0 && <button className="btn btn-primary" onClick={openNew}>+ Add First Move</button>}
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map(move => (
            <MoveCard key={move.id} move={move}
              onClick={() => setDetailMove(move)}
              onEdit={() => openEdit(move)} />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <MoveModal uid={uid} move={editMove} onClose={() => setShowModal(false)} onSaved={onSaved} />
      )}

      {/* Detail Drawer */}
      {detailMove && (
        <MoveDetail uid={uid} move={detailMove}
          onClose={() => setDetailMove(null)}
          onEdit={() => { openEdit(detailMove); setDetailMove(null) }}
          onDelete={() => handleDelete(detailMove.id)} />
      )}
    </div>
  )
}

/* ── Move Card ── */
function MoveCard({ move, onClick, onEdit }) {
  const cat = CATEGORIES.find(c => c.id === move.category)
  const status = STATUSES.find(s => s.id === move.status)
  return (
    <div className="move-card" onClick={onClick}>
      <div className="move-card-top">
        <div>
          <div className="move-name">{move.name}</div>
          {move.notes && (
            <div className="move-notes" style={{ marginTop: 4 }}>
              {move.notes.length > 80 ? move.notes.slice(0, 80) + '…' : move.notes}
            </div>
          )}
        </div>
        <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}
          onClick={e => { e.stopPropagation(); onEdit() }}>Edit</button>
      </div>
      <div className="move-card-bottom">
        <span className="badge" style={{ background: cat?.color + '22', color: cat?.color }}>
          {cat?.emoji} {cat?.label}
        </span>
        <span className={`badge ${status?.cls}`}>{status?.label}</span>
      </div>
    </div>
  )
}

/* ── Move Detail Drawer ── */
function MoveDetail({ uid, move, onClose, onEdit, onDelete }) {
  const [media, setMedia] = useState([])
  const cat = CATEGORIES.find(c => c.id === move.category)
  const status = STATUSES.find(s => s.id === move.status)

  useEffect(() => {
    loadMedia('move', move.id).then(setMedia)
  }, [move.id])

  function handleUploaded(item) { setMedia(prev => [...prev, item]) }
  async function handleDeleteMedia(item) {
    await deleteMedia(item)
    setMedia(prev => prev.filter(m => m.id !== item.id))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        {/* Top */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, letterSpacing: 1, lineHeight: 1 }}>
              {move.name}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <span className="badge" style={{ background: cat?.color + '22', color: cat?.color }}>
                {cat?.emoji} {cat?.label}
              </span>
              <span className={`badge ${status?.cls}`}>{status?.label}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Notes */}
        {move.notes && (
          <div style={{ background: 'var(--bg3)', borderRadius: 6, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text3)', marginBottom: 6 }}>Notes</div>
            <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{move.notes}</div>
          </div>
        )}

        {/* Media */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text3)', marginBottom: 8 }}>Media</div>
          <MediaPreview items={media} onDelete={handleDeleteMedia} />
          <div style={{ marginTop: 10 }}>
            <MediaUpload entityType="move" entityId={move.id} userId={uid} onUploaded={handleUploaded} />
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 20 }}>
          Added {new Date(move.created_at).toLocaleDateString()}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onEdit}>✏️ Edit</button>
          <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={onDelete}>🗑 Delete</button>
        </div>
      </div>
    </div>
  )
}

/* ── Add / Edit Modal ── */
function MoveModal({ uid, move, onClose, onSaved }) {
  const isNew = !move
  const [name, setName] = useState(move?.name || '')
  const [category, setCategory] = useState(move?.category || 'footwork')
  const [status, setStatus] = useState(move?.status || 'learning')
  const [notes, setNotes] = useState(move?.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true); setError('')

    const payload = { name: name.trim(), category, status, notes, updated_at: new Date().toISOString() }

    if (isNew) {
      const { data, error } = await supabase.from('moves')
        .insert({ ...payload, user_id: uid }).select().single()
      if (error) { setError(error.message); setSaving(false); return }
      onSaved(data, true)
    } else {
      const { data, error } = await supabase.from('moves')
        .update(payload).eq('id', move.id).select().single()
      if (error) { setError(error.message); setSaving(false); return }
      onSaved(data, false)
    }
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{isNew ? 'Add Move' : 'Edit Move'}</div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Move Name *</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. 6-Step, Baby Freeze, Indian Step..." required autoFocus />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                {STATUSES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Key details, tips, reminders, variations..." rows={4} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isNew ? 'Add Move' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}