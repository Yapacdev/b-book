import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase/supabase'
import { MediaUpload, MediaPreview, loadMedia, deleteMedia } from '../components/MediaUpload'

const PRIORITIES = [
  { id: 'low',    label: 'Low',    color: '#6B7280', bg: '#1A1A1A' },
  { id: 'normal', label: 'Normal', color: '#3B82F6', bg: '#0A1628' },
  { id: 'high',   label: 'High',   color: '#E85D3A', bg: '#1A0A06' },
]

const IDEA_CATEGORIES = [
  { id: 'toprock',  label: 'Toprock',    color: '#E85D3A', emoji: '🕴' },
  { id: 'godown',   label: 'Go-Down',    color: '#F59E0B', emoji: '⬇' },
  { id: 'footwork', label: 'Footwork',   color: '#10B981', emoji: '👟' },
  { id: 'freeze',   label: 'Freeze',     color: '#3B82F6', emoji: '🧊' },
  { id: 'power',    label: 'Power',      color: '#8B5CF6', emoji: '💫' },
  { id: 'combo',    label: 'Combo',      color: '#EC4899', emoji: '🔗' },
  { id: 'style',    label: 'Style',      color: '#F59E0B', emoji: '✨' },
  { id: 'music',    label: 'Music',      color: '#10B981', emoji: '🎵' },
  { id: 'other',    label: 'Other',      color: '#6B7280', emoji: '💭' },
]

export default function Ideas({ session }) {
  const uid = session.user.id
  const [ideas, setIdeas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterCat, setFilterCat] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editIdea, setEditIdea] = useState(null)
  const [detailIdea, setDetailIdea] = useState(null)

  const fetchIdeas = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('ideas')
      .select('*').eq('user_id', uid)
      .order('updated_at', { ascending: false })
    setIdeas(data || [])
    setLoading(false)
  }, [uid])

  useEffect(() => { fetchIdeas() }, [fetchIdeas])

  const filtered = ideas.filter(i => {
    if (filterPriority !== 'all' && i.priority !== filterPriority) return false
    if (filterCat !== 'all' && i.category !== filterCat) return false
    if (search && !i.title.toLowerCase().includes(search.toLowerCase()) &&
        !(i.description || '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function openNew() { setEditIdea(null); setShowModal(true) }
  function openEdit(idea) { setEditIdea(idea); setShowModal(true) }

  async function handleDelete(id) {
    if (!window.confirm('Delete this idea?')) return
    await supabase.from('ideas').delete().eq('id', id)
    setIdeas(prev => prev.filter(i => i.id !== id))
    setDetailIdea(null)
  }

  function onSaved(idea, isNew) {
    if (isNew) setIdeas(prev => [idea, ...prev])
    else setIdeas(prev => prev.map(i => i.id === idea.id ? idea : i))
    setShowModal(false)
    setDetailIdea(idea)
  }

  const priorityCounts = { all: ideas.length }
  PRIORITIES.forEach(p => { priorityCounts[p.id] = ideas.filter(i => i.priority === p.id).length })

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Ideas</div>
          <div className="page-subtitle">{ideas.length} idea{ideas.length !== 1 ? 's' : ''} saved</div>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ New Idea</button>
      </div>

      {/* Priority filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="filters" style={{ margin: 0 }}>
          <button className={`filter-btn ${filterPriority === 'all' ? 'active' : ''}`}
            onClick={() => setFilterPriority('all')}>All ({priorityCounts.all})</button>
          {PRIORITIES.map(p => (
            <button key={p.id}
              className={`filter-btn ${filterPriority === p.id ? 'active' : ''}`}
              style={filterPriority === p.id ? { background: p.color, borderColor: p.color } : {}}
              onClick={() => setFilterPriority(filterPriority === p.id ? 'all' : p.id)}>
              {p.label} ({priorityCounts[p.id] || 0})
            </button>
          ))}
        </div>
        <input className="form-input" placeholder="Search ideas..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ marginLeft: 'auto', width: 200, padding: '6px 12px', fontSize: 13 }} />
      </div>

      {/* Category filters */}
      <div className="filters" style={{ marginBottom: 24 }}>
        <button className={`filter-btn ${filterCat === 'all' ? 'active' : ''}`}
          onClick={() => setFilterCat('all')}>All Categories</button>
        {IDEA_CATEGORIES.map(c => (
          <button key={c.id}
            className={`filter-btn ${filterCat === c.id ? 'active' : ''}`}
            style={filterCat === c.id ? { background: c.color, borderColor: c.color } : {}}
            onClick={() => setFilterCat(filterCat === c.id ? 'all' : c.id)}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="loading" style={{ display: 'flex', alignItems: 'center',  flexDirection: 'column', gap: 10 }}>
          <span class="loader"></span> Loading ideas...
        </div>
      )  : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💡</div>
          <div className="empty-title">{ideas.length === 0 ? 'No Ideas Yet' : 'No Ideas Found'}</div>
          <div className="empty-text">
            {ideas.length === 0
              ? "Drop your unfinished concepts before they disappear"
              : 'Try a different filter'}
          </div>
          {ideas.length === 0 && (
            <button className="btn btn-primary" onClick={openNew}>+ Drop First Idea</button>
          )}
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map(idea => (
            <IdeaCard key={idea.id} idea={idea}
              onClick={() => setDetailIdea(idea)}
              onEdit={() => openEdit(idea)} />
          ))}
        </div>
      )}

      {showModal && (
        <IdeaModal uid={uid} idea={editIdea}
          onClose={() => setShowModal(false)}
          onSaved={onSaved} />
      )}

      {detailIdea && (
        <IdeaDetail
          uid={uid}
          idea={detailIdea}
          onClose={() => setDetailIdea(null)}
          onEdit={() => { openEdit(detailIdea); setDetailIdea(null) }}
          onDelete={() => handleDelete(detailIdea.id)} />
      )}
    </div>
  )
}

/* ── Idea Card ── */
function IdeaCard({ idea, onClick, onEdit }) {
  const priority = PRIORITIES.find(p => p.id === idea.priority)
  const cat = IDEA_CATEGORIES.find(c => c.id === idea.category)

  return (
    <div
      className="idea-card"
      style={{ borderLeft: `3px solid ${priority?.color || 'var(--border)'}` }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div className="idea-title">{idea.title}</div>
        <button className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}
          onClick={e => { e.stopPropagation(); onEdit() }}>Edit</button>
      </div>

      {idea.description && (
        <div className="idea-desc">
          {idea.description.length > 120
            ? idea.description.slice(0, 120) + '…'
            : idea.description}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {cat && (
          <span className="badge" style={{ background: cat.color + '22', color: cat.color }}>
            {cat.emoji} {cat.label}
          </span>
        )}
        <span className="badge" style={{ background: priority?.bg, color: priority?.color }}>
          {priority?.label}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>
          {new Date(idea.updated_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  )
}

/* ── Idea Detail ── */
function IdeaDetail({ uid, idea, onClose, onEdit, onDelete }) {
  const [media, setMedia] = useState([])
  const priority = PRIORITIES.find(p => p.id === idea.priority)
  const cat = IDEA_CATEGORIES.find(c => c.id === idea.category)

  useEffect(() => {
    loadMedia('idea', idea.id).then(setMedia)
  }, [idea.id])

  function handleUploaded(item) { setMedia(prev => [...prev, item]) }
  async function handleDeleteMedia(item) {
    await deleteMedia(item)
    setMedia(prev => prev.filter(m => m.id !== item.id))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ flex: 1, paddingRight: 16 }}>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 30, letterSpacing: 1, lineHeight: 1.1 }}>
              {idea.title}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {cat && (
                <span className="badge" style={{ background: cat.color + '22', color: cat.color }}>
                  {cat.emoji} {cat.label}
                </span>
              )}
              <span className="badge" style={{ background: priority?.bg, color: priority?.color }}>
                {priority?.label} Priority
              </span>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {idea.description && (
          <div style={{ background: 'var(--bg3)', borderRadius: 6, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text3)', marginBottom: 8 }}>
              Notes
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
              {idea.description}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text3)', marginBottom: 8 }}>
            Media
          </div>
          <MediaPreview items={media} onDelete={handleDeleteMedia} />
          <div style={{ marginTop: media.length > 0 ? 10 : 0 }}>
            <MediaUpload entityType="idea" entityId={idea.id} userId={uid} onUploaded={handleUploaded} />
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 20 }}>
          Saved {new Date(idea.created_at).toLocaleDateString()}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onEdit}>✏️ Edit</button>
          <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={onDelete}>🗑 Delete</button>
        </div>
      </div>
    </div>
  )
}

/* ── Add / Edit Modal ── */
function IdeaModal({ uid, idea, onClose, onSaved }) {
  const isNew = !idea
  const [title, setTitle] = useState(idea?.title || '')
  const [description, setDescription] = useState(idea?.description || '')
  const [priority, setPriority] = useState(idea?.priority || 'normal')
  const [category, setCategory] = useState(idea?.category || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Draft pattern — create record on first title input so media can attach immediately
  const [draftId, setDraftId] = useState(idea?.id || null)
  const [media, setMedia] = useState([])
  const [draftCreating, setDraftCreating] = useState(false)

  async function ensureDraft(titleVal) {
    if (draftId || !titleVal.trim() || !isNew || draftCreating) return
    setDraftCreating(true)
    const { data } = await supabase.from('ideas')
      .insert({ user_id: uid, title: titleVal.trim(), priority: 'normal', updated_at: new Date().toISOString() })
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
    if (!title.trim()) return
    setSaving(true); setError('')

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      category: category || null,
      updated_at: new Date().toISOString(),
    }

    if (isNew && draftId) {
      const { data, error } = await supabase.from('ideas')
        .update(payload).eq('id', draftId).select().single()
      if (error) { setError(error.message); setSaving(false); return }
      onSaved(data, true)
    } else if (isNew) {
      const { data, error } = await supabase.from('ideas')
        .insert({ ...payload, user_id: uid }).select().single()
      if (error) { setError(error.message); setSaving(false); return }
      onSaved(data, true)
    } else {
      const { data, error } = await supabase.from('ideas')
        .update(payload).eq('id', idea.id).select().single()
      if (error) { setError(error.message); setSaving(false); return }
      onSaved(data, false)
    }
    setSaving(false)
  }

  async function handleClose() {
    if (isNew && draftId && !title.trim()) {
      await supabase.from('ideas').delete().eq('id', draftId)
    }
    onClose()
  }

  const canAttachMedia = !isNew || !!draftId

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">{isNew ? 'Drop an Idea' : 'Edit Idea'}</div>
        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" value={title}
              onChange={e => { setTitle(e.target.value); ensureDraft(e.target.value) }}
              onBlur={e => ensureDraft(e.target.value)}
              placeholder="What's the idea? Be quick, capture it fast..."
              required autoFocus />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label">Priority</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRIORITIES.map(p => (
                <button key={p.id} type="button"
                  className="btn btn-sm"
                  style={{
                    flex: 1, justifyContent: 'center', fontSize: 12,
                    background: priority === p.id ? p.color : 'transparent',
                    color: priority === p.id ? 'white' : p.color,
                    border: `1px solid ${p.color}66`,
                  }}
                  onClick={() => setPriority(p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="form-group">
            <label className="form-label">Category <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {IDEA_CATEGORIES.map(c => (
                <button key={c.id} type="button"
                  className="btn btn-sm"
                  style={{
                    fontSize: 11, padding: '4px 10px',
                    background: category === c.id ? c.color + '33' : 'transparent',
                    color: category === c.id ? c.color : 'var(--text2)',
                    border: `1px solid ${category === c.id ? c.color : 'var(--border2)'}`,
                  }}
                  onClick={() => setCategory(category === c.id ? '' : c.id)}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Notes <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
            <textarea className="form-textarea" value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={`Expand on the idea, reference moves, describe the feeling...\n\ne.g. Transition from hook drop directly into a freeze variation — feels like it could link to a headstand if I adjust the entry angle`}
              rows={5} />
          </div>

          {/* Media */}
          <div className="form-group">
            <label className="form-label">Media <span style={{ color: 'var(--text3)', fontWeight: 400 }}>(optional)</span></label>
            {!canAttachMedia ? (
              <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>
                Type a title above to enable media upload
              </div>
            ) : (
              <>
                <MediaPreview items={media} onDelete={handleDeleteMedia} />
                <div style={{ marginTop: media.length > 0 ? 10 : 0 }}>
                  <MediaUpload
                    entityType="idea"
                    entityId={draftId || idea?.id}
                    userId={uid}
                    onUploaded={handleUploaded} />
                </div>
              </>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={handleClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span class="loader"></span> : isNew ? 'Save Idea' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}