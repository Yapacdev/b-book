import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase/supabase'
import { MediaUpload, MediaPreview, loadMedia, deleteMedia } from '../components/MediaUpload'

const STATUSES = [
  { id: 'draft',    label: 'Draft',    cls: 'status-locked',       emoji: '📝' },
  { id: 'working',  label: 'Working',  cls: 'status-learning',     emoji: '🔧' },
  { id: 'polished', label: 'Polished', cls: 'status-battle-ready', emoji: '💎' },
]

const CATEGORY_COLORS = {
  toprock:  '#E85D3A',
  godown:   '#F59E0B',
  footwork: '#10B981',
  freeze:   '#3B82F6',
  power:    '#8B5CF6',
}

export default function Combos({ session }) {
  const uid = session.user.id
  const [combos, setCombos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editCombo, setEditCombo] = useState(null)
  const [detailCombo, setDetailCombo] = useState(null)

  const fetchCombos = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('combos')
      .select('*').eq('user_id', uid)
      .order('updated_at', { ascending: false })
    setCombos(data || [])
    setLoading(false)
  }, [uid])

  useEffect(() => { fetchCombos() }, [fetchCombos])

  const filtered = combos.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function openNew() { setEditCombo(null); setShowModal(true) }
  function openEdit(combo) { setEditCombo(combo); setShowModal(true) }

  async function handleDelete(id) {
    if (!window.confirm('Delete this combo?')) return
    await supabase.from('combos').delete().eq('id', id)
    setCombos(prev => prev.filter(c => c.id !== id))
    setDetailCombo(null)
  }

  function onSaved(combo, isNew) {
    if (isNew) setCombos(prev => [combo, ...prev])
    else setCombos(prev => prev.map(c => c.id === combo.id ? combo : c))
    setShowModal(false)
    setDetailCombo(combo)
  }

  const counts = { all: combos.length }
  STATUSES.forEach(s => { counts[s.id] = combos.filter(c => c.status === s.id).length })

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Combos & Sets</div>
          <div className="page-subtitle">{combos.length} combo{combos.length !== 1 ? 's' : ''} in your book</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New Combo</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="filters" style={{ margin: 0 }}>
          <button className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}>All ({counts.all})</button>
          {STATUSES.map(s => (
            <button key={s.id}
              className={`filter-btn ${filterStatus === s.id ? 'active' : ''}`}
              onClick={() => setFilterStatus(filterStatus === s.id ? 'all' : s.id)}>
              {s.emoji} {s.label} ({counts[s.id] || 0})
            </button>
          ))}
        </div>
        <input className="form-input" placeholder="Search combos..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: 'auto', width: 200, padding: '6px 12px', fontSize: 13 }} />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="loading" style={{ display: 'flex', alignItems: 'center',  flexDirection: 'column', gap: 10 }}>
          <span class="loader"></span> Loading combos...
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <div className="empty-title">{combos.length === 0 ? 'No Combos Yet' : 'No Combos Found'}</div>
          <div className="empty-text">
            {combos.length === 0 ? 'Start building your sets and sequences' : 'Try a different filter'}
          </div>
          {combos.length === 0 && (
            <button className="btn btn-primary" onClick={openNew}>+ New Combo</button>
          )}
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map(combo => (
            <ComboCard key={combo.id} combo={combo}
              onClick={() => setDetailCombo(combo)}
              onEdit={() => openEdit(combo)} />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <ComboModal uid={uid} combo={editCombo}
          onClose={() => setShowModal(false)}
          onSaved={onSaved} />
      )}

      {/* Detail view */}
      {detailCombo && (
        <ComboDetail
          uid={uid}
          combo={detailCombo}
          onClose={() => setDetailCombo(null)}
          onEdit={() => { openEdit(detailCombo); setDetailCombo(null) }}
          onDelete={() => handleDelete(detailCombo.id)} />
      )}
    </div>
  )
}

/* ── Combo Card ── */
function ComboCard({ combo, onClick, onEdit }) {
  const status = STATUSES.find(s => s.id === combo.status)

  return (
    <div className="move-card" onClick={onClick}>
      <div className="move-card-top">
        <div style={{ flex: 1 }}>
          <div className="move-name">{combo.name}</div>
          {combo.description && (
            <div className="move-notes" style={{ marginTop: 4 }}>
              {combo.description.length > 100
                ? combo.description.slice(0, 100) + '…'
                : combo.description}
            </div>
          )}
        </div>
        <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}
          onClick={e => { e.stopPropagation(); onEdit() }}>Edit</button>
      </div>
      <div className="move-card-bottom">
        <span className={`badge ${status?.cls}`}>{status?.emoji} {status?.label}</span>
        <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>
          {new Date(combo.updated_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

/* ── Combo Detail ── */
function ComboDetail({ uid, combo, onClose, onEdit, onDelete }) {
  const [media, setMedia] = useState([])
  const status = STATUSES.find(s => s.id === combo.status)

  useEffect(() => {
    loadMedia('combo', combo.id).then(setMedia)
  }, [combo.id])

  function handleUploaded(item) { setMedia(prev => [...prev, item]) }
  async function handleDeleteMedia(item) {
    await deleteMedia(item)
    setMedia(prev => prev.filter(m => m.id !== item.id))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, letterSpacing: 1, lineHeight: 1 }}>
              {combo.name}
            </div>
            <div style={{ marginTop: 8 }}>
              <span className={`badge ${status?.cls}`}>{status?.emoji} {status?.label}</span>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {/* Description */}
        {combo.description && (
          <div style={{ background: 'var(--bg3)', borderRadius: 6, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text3)', marginBottom: 8 }}>
              Description
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {combo.description}
            </div>
          </div>
        )}

        {/* Media */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text3)', marginBottom: 8 }}>
            Media
          </div>
          <MediaPreview items={media} onDelete={handleDeleteMedia} />
          <div style={{ marginTop: media.length > 0 ? 10 : 0 }}>
            <MediaUpload entityType="combo" entityId={combo.id} userId={uid} onUploaded={handleUploaded} />
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 20 }}>
          Created {new Date(combo.created_at).toLocaleDateString()} · Updated {new Date(combo.updated_at).toLocaleDateString()}
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
function ComboModal({ uid, combo, onClose, onSaved }) {
  const isNew = !combo
  const [name, setName] = useState(combo?.name || '')
  const [description, setDescription] = useState(combo?.description || '')
  const [status, setStatus] = useState(combo?.status || 'draft')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // For new combos: we create a draft record immediately so media can attach to a real ID
  const [draftId, setDraftId] = useState(combo?.id || null)
  const [media, setMedia] = useState([])
  const [draftCreating, setDraftCreating] = useState(false)

  // Create a silent draft record as soon as the user types a name
  async function ensureDraft(nameVal) {
    if (draftId || !nameVal.trim() || !isNew || draftCreating) return
    setDraftCreating(true)
    const { data } = await supabase.from('combos')
      .insert({ user_id: uid, name: nameVal.trim(), status: 'draft', updated_at: new Date().toISOString() })
      .select().single()
    if (data) setDraftId(data.id)
    setDraftCreating(false)
  }

  function handleUploaded(item) { setMedia(prev => [...prev, item]) }
  async function handleDeleteMedia(item) {
    await deleteMedia(item)
    setMedia(prev => prev.filter(m => m.id !== item.id))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true); setError('')

    const payload = {
      name: name.trim(),
      description: description.trim(),
      status,
      updated_at: new Date().toISOString(),
    }

    if (isNew && draftId) {
      // Update the already-created draft with final values
      const { data, error } = await supabase.from('combos')
        .update(payload).eq('id', draftId).select().single()
      if (error) { setError(error.message); setSaving(false); return }
      onSaved(data, true)
    } else if (isNew) {
      // Draft was never created (user saved without typing then clicking away)
      const { data, error } = await supabase.from('combos')
        .insert({ ...payload, user_id: uid }).select().single()
      if (error) { setError(error.message); setSaving(false); return }
      onSaved(data, true)
    } else {
      const { data, error } = await supabase.from('combos')
        .update(payload).eq('id', combo.id).select().single()
      if (error) { setError(error.message); setSaving(false); return }
      onSaved(data, false)
    }
    setSaving(false)
  }

  // If user cancels a new combo and a draft was created, clean it up
  async function handleClose() {
    if (isNew && draftId && !name.trim()) {
      await supabase.from('combos').delete().eq('id', draftId)
    }
    onClose()
  }

  const canAttachMedia = !isNew || !!draftId

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">{isNew ? 'New Combo' : 'Edit Combo'}</div>
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Combo Name *</label>
            <input
              className="form-input"
              value={name}
              onChange={e => { setName(e.target.value); ensureDraft(e.target.value) }}
              onBlur={e => ensureDraft(e.target.value)}
              placeholder="e.g. Battle Set 01, Freeze Combo A, Floor Sequence..."
              required autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUSES.map(s => (
                <button key={s.id} type="button"
                  className={`btn btn-sm ${status === s.id ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}
                  onClick={() => setStatus(s.id)}>
                  {s.emoji} {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={`Describe the sequence, the feel, key transitions...\n\ne.g. Indian step → corkscrew → 6-step → baby freeze → windmill exit`}
              rows={5} />
          </div>

          {/* Media section */}
          <div className="form-group">
            <label className="form-label">Media</label>
            {!canAttachMedia ? (
              <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>
                Type a name above to enable media upload
              </div>
            ) : (
              <>
                <MediaPreview items={media} onDelete={handleDeleteMedia} />
                <div style={{ marginTop: media.length > 0 ? 10 : 0 }}>
                  <MediaUpload
                    entityType="combo"
                    entityId={draftId || combo?.id}
                    userId={uid}
                    onUploaded={handleUploaded} />
                </div>
              </>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={handleClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isNew ? 'Create Combo' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}