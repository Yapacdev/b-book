import React, { useState } from 'react'
import { supabase } from '../supabase/supabase'

const NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',    icon: HomeIcon },
  { id: 'arsenal',     label: 'Arsenal',      icon: ShieldIcon },
  { id: 'combos',      label: 'Combos & Sets',icon: LinkIcon },
  { id: 'ideas',       label: 'Ideas',        icon: BulbIcon },
  { id: 'foundations', label: 'Foundations',  icon: LayersIcon },
]

export default function Nav({ page, setPage, session }) {
  const email = session?.user?.email || ''
  const fullName = session?.user?.user_metadata?.full_name || email.split('@')[0]
  const avatar = session?.user?.user_metadata?.avatar_url || ''
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const initials = fullName.charAt(0).toUpperCase()

  function Avatar({ size = 36 }) {
    return avatar ? (
      <img
        src={avatar}
        alt="avatar"
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', border: '1px solid #222', display: 'block', flexShrink: 0
        }}
      />
    ) : (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: '#1a1a1a', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontWeight: 700, color: '#fff',
        fontSize: size * 0.38, flexShrink: 0, border: '1px solid #222'
      }}>
        {initials}
      </div>
    )
  }

  return (
    <>
      {/* ── DESKTOP SIDEBAR ── */}
      <nav className="nav">
        <div className="nav-logo">
          <div className="nav-logo-letter">B</div>
          <div className="nav-logo-text">B-Book</div>
        </div>

        {NAV_ITEMS.map(item => (
          <div
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <item.icon />
            {item.label}
          </div>
        ))}

        {/* Bottom user section */}
        <div className="nav-bottom">
          {/* Avatar + name + email */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar size={40} />
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {fullName}
              </div>
              <div style={{ fontSize: 8, color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {email}
              </div>
            </div>
          </div>

          {/* Profile + Sign Out side by side */}
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn-signout"
              style={{ flex: 1 }}
              onClick={() => setPage('profile')}
            >
              Profile
            </button>
            <button
              className="btn-signout"
              style={{ flex: 1 }}
              onClick={() => supabase.auth.signOut()}
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE FLOATING AVATAR ── */}
      <div className="mobile-avatar-wrapper">
        <button
          onClick={() => setMobileMenuOpen(o => !o)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block' }}
        >
          <Avatar size={44} />
        </button>

        {mobileMenuOpen && (
          <>
            {/* Tap-outside backdrop */}
            <div
              onClick={() => setMobileMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: -1 }}
            />
            {/* Popup */}
            <div style={{
              position: 'absolute', bottom: 52, right: 0,
              background: '#111', border: '1px solid #333',
              borderRadius: 10, padding: '12px 0', minWidth: 190,
              boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
              zIndex: 10,
            }}>
              {/* User info */}
              <div style={{ padding: '4px 16px 12px', borderBottom: '1px solid #222' }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#f0f0f0' }}>{fullName}</div>
                <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{email}</div>
              </div>

              {/* Profile */}
              <button
                onClick={() => { setPage('profile'); setMobileMenuOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '11px 16px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#f0f0f0', fontSize: 13,
                  fontFamily: 'Space Grotesk, sans-serif', textAlign: 'left',
                }}
              >
                <UserIcon /> Profile
              </button>

              {/* Sign out */}
              <button
                onClick={() => supabase.auth.signOut()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '11px 16px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#EF4444', fontSize: 13,
                  fontFamily: 'Space Grotesk, sans-serif', textAlign: 'left',
                }}
              >
                <LogoutIcon /> Sign Out
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="nav-mobile">
        {NAV_ITEMS.map(item => (
          <div
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <item.icon />
            {item.label}
          </div>
        ))}
      </nav>
    </>
  )
}

function HomeIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
}
function ShieldIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
}
function LinkIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
}
function BulbIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
}
function LayersIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
}
function UserIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function LogoutIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
}