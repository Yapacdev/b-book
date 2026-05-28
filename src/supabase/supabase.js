import { createClient } from '@supabase/supabase-js'


const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey)

export const CATEGORIES = {
  toprock: { label: 'Toprock', color: '#E85D3A', icon: '🕴' },
  godown: { label: 'Go-Down', color: '#F59E0B', icon: '⬇' },
  footwork: { label: 'Footwork', color: '#10B981', icon: '👟' },
  freeze: { label: 'Freeze', color: '#3B82F6', icon: '🧊' },
  power: { label: 'Power Move', color: '#8B5CF6', icon: '💫' },
  combo: { label: 'Combo', color: '#EC4899', icon: '🔗' },
  idea: { label: 'Idea', color: '#6B7280', icon: '💡' },
}

export const STATUSES = {
  locked: { label: 'Locked', color: '#6B7280', bg: '#F3F4F6' },
  learning: { label: 'Learning', color: '#D97706', bg: '#FEF3C7' },
  clean: { label: 'Clean', color: '#059669', bg: '#D1FAE5' },
  'battle-ready': { label: 'Battle Ready', color: '#7C3AED', bg: '#EDE9FE' },
}