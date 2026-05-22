import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase/supabase'
import StatCard from '../components/StatCard'

export default function Profile({ session, setPage }) {
  const uid = session.user.id
  const email = session?.user?.email || ''
  const googleName = session?.user?.user_metadata?.full_name || ''
  const avatar = session?.user?.user_metadata?.avatar_url || ''

  const [profile, setProfile] = useState(null)
  const [bboyName, setBboyName] = useState('')
  const [crew, setCrew] = useState('')
  const [styleNotes, setStyleNotes] = useState('')
  const [yearsTraining, setYearsTraining] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  // Stats
  const [stats, setStats] = useState({
    moves: 0, battleReady: 0, combos: 0, polished: 0,
    ideas: 0, highPriority: 0, foundationsRated: 0, avgFoundation: 0
  })

  const fetchProfile = useCallback(async () => {
    const { data } = await supabase.from('profiles')
      .select('*').eq('id', uid).single()
    if (data) {
      setProfile(data)
      setBboyName(data.bboy_name || '')
      setCrew(data.crew || '')
      setStyleNotes(data.style_notes || '')
      setYearsTraining(data.years_training || '')
    }
    setLoading(false)
  }, [uid])

  const fetchStats = useCallback(async () => {
    const [movesRes, combosRes, ideasRes, foundRes] = await Promise.all([
      supabase.from('moves').select('status').eq('user_id', uid),
      supabase.from('combos').select('status').eq('user_id', uid),
      supabase.from('ideas').select('priority').eq('user_id', uid),
      supabase.from('foundation_progress').select('level').eq('user_id', uid),
    ])

    const moves = movesRes.data || []
    const combos = combosRes.data || []
    const ideas = ideasRes.data || []
    const foundations = foundRes.data || []
    const rated = foundations.filter(f => f.level > 0)
    const avg = rated.length
      ? (rated.reduce((s, f) => s + f.level, 0) / rated.length).toFixed(1)
      : 0

    setStats({
      moves: moves.length,
      battleReady: moves.filter(m => m.status === 'battle-ready').length,
      combos: combos.length,
      polished: combos.filter(c => c.status === 'polished').length,
      ideas: ideas.length,
      highPriority: ideas.filter(i => i.priority === 'high').length,
      foundationsRated: rated.length,
      avgFoundation: avg,
    })
  }, [uid])

  useEffect(() => {
    fetchProfile()
    fetchStats()
  }, [fetchProfile, fetchStats])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setSaved(false)

    const payload = {
      bboy_name: bboyName.trim(),
      crew: crew.trim(),
      style_notes: styleNotes.trim(),
      years_training: yearsTraining ? parseInt(yearsTraining) : 0,
    }

    if (profile) {
      await supabase.from('profiles').update(payload).eq('id', uid)
    } else {
      await supabase.from('profiles').insert({ id: uid, ...payload })
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const initials = (bboyName || googleName || email).charAt(0).toUpperCase()
  const displayName = bboyName || googleName || email.split('@')[0]

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Profile</div>
          <div className="page-subtitle">Your b-boy identity & book stats</div>
        </div>
      </div>

      {/* Avatar + identity */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
        {avatar ? (
          <img src={avatar} alt="avatar"
            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border2)', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 28, color: 'white', flexShrink: 0
          }}>{initials}</div>
        )}
        <div>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, letterSpacing: 1, lineHeight: 1 }}>
            {displayName}
          </div>
          {bboyName && googleName && (
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{googleName}</div>
          )}
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{email}</div>
          {crew && (
            <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 4, fontWeight: 600 }}>
              {crew}
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {!loading && (
        <div style={{ marginBottom: 28 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Book Stats</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 10 }}>
            <StatCard num={stats.moves} label="Total Moves" sub={`${stats.battleReady} battle ready`} color="var(--accent)" onClick={() => setPage('arsenal')} />
            <StatCard num={stats.combos} label="Combos" sub={`${stats.polished} polished`} color="#EC4899" onClick={() => setPage('combos')} />
            <StatCard num={stats.ideas} label="Ideas" sub={`${stats.highPriority} high priority`} color="#F59E0B" onClick={() => setPage('ideas')} />
            <StatCard num={stats.foundationsRated} label="Skills Rated" sub={`avg ${stats.avgFoundation}/5`} color="#10B981" onClick={() => setPage('foundations')} />
          </div>
        </div>
      )}

      <hr className="divider" />

      {/* Edit form */}
      <div className="section-title" style={{ marginBottom: 20 }}>Edit Profile</div>

      <form onSubmit={handleSave}>
        <div className="form-group">
          <label className="form-label">B-Boy / B-Girl Name</label>
          <input className="form-input" value={bboyName}
            onChange={e => setBboyName(e.target.value)}
            placeholder="Your breaking name..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Crew</label>
            <input className="form-input" value={crew}
              onChange={e => setCrew(e.target.value)}
              placeholder="Crew name..." />
          </div>
          <div className="form-group">
            <label className="form-label">Years Training</label>
            <input className="form-input" type="number" min="0" max="50"
              value={yearsTraining}
              onChange={e => setYearsTraining(e.target.value)}
              placeholder="e.g. 3" />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Style Notes</label>
          <textarea className="form-textarea" value={styleNotes}
            onChange={e => setStyleNotes(e.target.value)}
            placeholder="Describe your style, influences, what you're working towards..."
            rows={4} />
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
          {saved && (
            <span style={{ fontSize: 13, color: '#10B981', fontWeight: 500 }}>
              ✓ Saved
            </span>
          )}
        </div>
      </form>

      <hr className="divider" />

      {/* Danger zone */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Sign Out</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>You can sign back in anytime</div>
        </div>
        <button className="btn btn-danger" onClick={() => supabase.auth.signOut()}>
          Sign Out
        </button>
      </div>
    </div>
  )
}

