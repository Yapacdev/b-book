import React, { useState, useEffect } from 'react'

import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Arsenal from './pages/Arsenal'
import Combos from './pages/Combos'
import Ideas from './pages/Ideas'
import Foundations from './pages/Foundations'
import Nav from './components/Nav'
import './App.css'
import { supabase } from './supabase/supabase'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState('dashboard')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="splash">
      <div className="splash-logo">B</div>
      <div className="splash-text">B-BOOK</div>
    </div>
  )

  if (!session) return <Auth />

  const pages = { dashboard: Dashboard, arsenal: Arsenal, combos: Combos, ideas: Ideas, foundations: Foundations }
  const PageComponent = pages[page] || Dashboard

  return (
    <div className="app">
      <Nav page={page} setPage={setPage} session={session} />
      <main className="main-content">
        <PageComponent session={session} setPage={setPage} />
      </main>
    </div>
  )
}