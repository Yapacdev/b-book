import React from 'react'
import { supabase } from '../supabase/supabase'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
  { id: 'arsenal', label: 'Arsenal', icon: ShieldIcon },
  { id: 'combos', label: 'Combos & Sets', icon: LinkIcon },
  { id: 'ideas', label: 'Ideas', icon: BulbIcon },
  { id: 'foundations', label: 'Foundations', icon: LayersIcon },
]

export default function Nav({ page, setPage, session }) {
  const email = session?.user?.email || ''

  return (
    <>
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
        <div className="nav-bottom">
          <div className="nav-user">{email.split('@')[0]}</div>
          <button className="btn-signout" onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </div>
      </nav>

      {/* Mobile nav */}
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