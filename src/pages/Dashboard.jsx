import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase/supabase'
import StatCard from '../components/StatCard'

const CAT_COLORS = {
  toprock:  '#E85D3A',
  godown:   '#F59E0B',
  footwork: '#10B981',
  freeze:   '#3B82F6',
  power:    '#8B5CF6',
}

const CAT_EMOJI = {
  toprock: '🕴', godown: '⬇', footwork: '👟', freeze: '🧊', power: '💫'
}

const STATUS_MAP = {
  'locked':       { label: 'Locked',       cls: 'status-locked' },
  'learning':     { label: 'Learning',     cls: 'status-learning' },
  'clean':        { label: 'Clean',        cls: 'status-clean' },
  'battle-ready': { label: 'Battle Ready', cls: 'status-battle-ready' },
}

export default function Dashboard({ session, setPage }) {
  const uid = session.user.id
  const email = session?.user?.email || ''
  const googleName = session?.user?.user_metadata?.full_name || ''
  const avatar = session?.user?.user_metadata?.avatar_url || ''

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Stats
  const [stats, setStats] = useState({
    totalMoves: 0, battleReady: 0,
    totalCombos: 0, polishedCombos: 0,
    totalIdeas: 0, highIdeas: 0,
    foundationsRated: 0, foundationAvg: 0,
  })

  // Recent items
  const [recentMoves, setRecentMoves] = useState([])
  const [recentCombos, setRecentCombos] = useState([])
  const [recentIdeas, setRecentIdeas] = useState([])

  // Foundation breakdown per category
  const [foundBreakdown, setFoundBreakdown] = useState([])

  const load = useCallback(async () => {
    setLoading(true)
    const [
      profileRes,
      movesRes, combosRes, ideasRes,
      foundProgressRes, foundSkillsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).single(),
      supabase.from('moves').select('*').eq('user_id', uid),
      supabase.from('combos').select('*').eq('user_id', uid),
      supabase.from('ideas').select('*').eq('user_id', uid),
      supabase.from('foundation_progress').select('*').eq('user_id', uid),
      supabase.from('foundation_skills').select('id, category'),
    ])

    setProfile(profileRes.data)

    const moves   = movesRes.data   || []
    const combos  = combosRes.data  || []
    const ideas   = ideasRes.data   || []
    const progress = foundProgressRes.data || []
    const skills   = foundSkillsRes.data   || []

    // Stats
    const rated = progress.filter(p => p.level > 0)
    const avg = rated.length
      ? (rated.reduce((s, p) => s + p.level, 0) / rated.length).toFixed(1)
      : 0

    setStats({
      totalMoves:       moves.length,
      battleReady:      moves.filter(m => m.status === 'battle-ready').length,
      totalCombos:      combos.length,
      polishedCombos:   combos.filter(c => c.status === 'polished').length,
      totalIdeas:       ideas.length,
      highIdeas:        ideas.filter(i => i.priority === 'high').length,
      foundationsRated: rated.length,
      foundationAvg:    avg,
    })

    // Recent 4 of each
    setRecentMoves([...moves].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 4))
    setRecentCombos([...combos].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 3))
    setRecentIdeas([...ideas].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 3))

    // Foundation breakdown per category
    const cats = ['toprock', 'godown', 'footwork', 'freeze', 'power']
    const breakdown = cats.map(cat => {
      const catSkillIds = skills.filter(s => s.category === cat).map(s => s.id)
      const catProgress = progress.filter(p => catSkillIds.includes(p.skill_id) && p.level > 0)
      const catAvg = catProgress.length
        ? (catProgress.reduce((s, p) => s + p.level, 0) / catProgress.length).toFixed(1)
        : 0
      return { cat, rated: catProgress.length, total: catSkillIds.length, avg: catAvg }
    })
    setFoundBreakdown(breakdown)

    setLoading(false)
  }, [uid])

  useEffect(() => { load() }, [load])

  // Greeting
  const hour = new Date().getHours()
  const timeLabel = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Night'
  const bboyName = profile?.bboy_name || googleName || email.split('@')[0]
  const initials = bboyName.charAt(0).toUpperCase()

  return (
    <div>
      {/* ── HERO GREETING ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        marginBottom: 32, flexWrap: 'wrap'
      }}>
        {avatar ? (
          <img src={avatar} alt="avatar" style={{
            width: 56, height: 56, borderRadius: '50%',
            objectFit: 'cover', border: '2px solid var(--border2)', flexShrink: 0
          }} />
        ) : (
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--accent)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 700, fontSize: 22,
            color: 'white', flexShrink: 0, border: '2px solid var(--border2)'
          }}>{initials}</div>
        )}
        <div>
          <div style={{
            fontFamily: 'Bebas Neue, sans-serif', fontSize: 38,
            letterSpacing: 2, lineHeight: 1
          }}>
            {timeLabel}, {bboyName}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
            {profile?.crew ? `${profile.crew} · ` : ''}
            {profile?.years_training ? `${profile.years_training} years training · ` : ''}
            Keep building
          </div>
        </div>
      </div>

      {/* ── MAIN STATS ROW ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
        gap: 10, marginBottom: 32
      }}>
        <StatCard
          num={stats.totalMoves}
          label="Arsenal"
          sub={`${stats.battleReady} battle ready`}
          color="var(--accent)"
          onClick={() => setPage('arsenal')}
        />
        <StatCard
          num={stats.totalCombos}
          label="Combos"
          sub={`${stats.polishedCombos} polished`}
          color="#EC4899"
          onClick={() => setPage('combos')}
        />
        <StatCard
          num={stats.totalIdeas}
          label="Ideas"
          sub={`${stats.highIdeas} high priority`}
          color="#F59E0B"
          onClick={() => setPage('ideas')}
        />
        <StatCard
          num={`${stats.foundationAvg}/5`}
          label="Foundations"
          sub={`${stats.foundationsRated} skills rated`}
          color="#10B981"
          onClick={() => setPage('foundations')}
        />
      </div>

      {/* ── TWO COLUMN LAYOUT ── */}
      <div className='dash-main-cont'>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Recent Arsenal */}
          <Section
            title="Recent Arsenal"
            actionLabel="View All"
            onAction={() => setPage('arsenal')}
            onAdd={() => setPage('arsenal')}
            addLabel="+ Move"
            empty={recentMoves.length === 0}
            emptyIcon="🛡"
            emptyText="No moves yet"
          >
            {recentMoves.map(move => (
              <div key={move.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid var(--border)',
                gap: 8
              }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {move.name}
                  </div>
                  <div style={{ fontSize: 11, color: CAT_COLORS[move.category], marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                    {CAT_EMOJI[move.category]} {move.category}
                  </div>
                </div>
                <span className={`badge ${STATUS_MAP[move.status]?.cls}`} style={{ flexShrink: 0, fontSize: 10 }}>
                  {STATUS_MAP[move.status]?.label}
                </span>
              </div>
            ))}
          </Section>

          {/* Recent Ideas */}
          <Section
            title="Recent Ideas"
            actionLabel="View All"
            onAction={() => setPage('ideas')}
            onAdd={() => setPage('ideas')}
            addLabel="+ Idea"
            empty={recentIdeas.length === 0}
            emptyIcon="💡"
            emptyText="No ideas yet"
          >
            {recentIdeas.map(idea => (
              <div key={idea.id} style={{
                padding: '10px 0', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{idea.title}</div>
                  <PriorityDot priority={idea.priority} />
                </div>
                {idea.description && (
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3, lineHeight: 1.4 }}>
                    {idea.description.length > 80 ? idea.description.slice(0, 80) + '…' : idea.description}
                  </div>
                )}
              </div>
            ))}
          </Section>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Recent Combos */}
          <Section
            title="Recent Combos"
            actionLabel="View All"
            onAction={() => setPage('combos')}
            onAdd={() => setPage('combos')}
            addLabel="+ Combo"
            empty={recentCombos.length === 0}
            emptyIcon="🔗"
            emptyText="No combos yet"
          >
            {recentCombos.map(combo => {
              const s = { draft: { label: 'Draft', cls: 'status-locked' }, working: { label: 'Working', cls: 'status-learning' }, polished: { label: 'Polished', cls: 'status-battle-ready' } }
              return (
                <div key={combo.id} style={{
                  padding: '10px 0', borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8
                }}>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {combo.name}
                    </div>
                    {combo.description && (
                      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3, lineHeight: 1.4 }}>
                        {combo.description.length > 70 ? combo.description.slice(0, 70) + '…' : combo.description}
                      </div>
                    )}
                  </div>
                  <span className={`badge ${s[combo.status]?.cls}`} style={{ flexShrink: 0, fontSize: 10 }}>
                    {s[combo.status]?.label}
                  </span>
                </div>
              )
            })}
          </Section>

          {/* Foundations Breakdown */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div className="section-title">Foundations</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setPage('foundations')}>
                View All →
              </button>
            </div>
            {loading ? (
              <div className="loading" style={{ display: 'flex', alignItems: 'center',  flexDirection: 'column', gap: 10 }}>
                <span class="loader"></span> Loading dashboard...
              </div>
            ) : (
              foundBreakdown.map(({ cat, rated, total, avg }) => (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: CAT_COLORS[cat] }}>
                      {CAT_EMOJI[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                      {rated}/{total} · avg {avg}/5
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: total > 0 ? `${(rated / total) * 100}%` : '0%',
                      background: CAT_COLORS[cat],
                      borderRadius: 2,
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Actions */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div className="section-title" style={{ marginBottom: 14 }}>Quick Add</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon: '🛡', label: 'Move',       page: 'arsenal' },
                { icon: '🔗', label: 'Combo',      page: 'combos' },
                { icon: '💡', label: 'Idea',        page: 'ideas' },
                { icon: '📚', label: 'Foundations', page: 'foundations' },
              ].map(item => (
                <button key={item.page} className="btn btn-ghost"
                  onClick={() => setPage(item.page)}
                  style={{ justifyContent: 'flex-start', gap: 8, fontSize: 12, padding: '10px 12px' }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}



/* ── Section wrapper ── */
function Section({ title, actionLabel, onAction, onAdd, addLabel, empty, emptyIcon, emptyText, children }) {
  return (
    <div className="card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div className="section-title">{title}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {onAdd && (
            <button className="btn btn-primary btn-sm" onClick={onAdd}>{addLabel}</button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onAction}>{actionLabel} →</button>
        </div>
      </div>

      {empty ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>{emptyIcon}</div>
          <div style={{ fontSize: 12 }}>{emptyText}</div>
        </div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  )
}

/* ── Priority dot ── */
function PriorityDot({ priority }) {
  const colors = { high: '#E85D3A', normal: '#3B82F6', low: '#555' }
  return (
    <div style={{
      width: 7, height: 7, borderRadius: '50%',
      background: colors[priority] || colors.normal,
      flexShrink: 0, marginTop: 4
    }} />
  )
}