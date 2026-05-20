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

export const FOUNDATIONS_SEED = [
  // Toprock
  { skill: 'Indian Step', category: 'toprock' },
  { skill: 'Cross Step', category: 'toprock' },
  { skill: 'Side Step', category: 'toprock' },
  { skill: 'Kick Forward', category: 'toprock' },
  { skill: 'Front Step', category: 'toprock' },
  // Go-Downs
  { skill: 'Knee Drop', category: 'godown' },
  { skill: 'Spin Down', category: 'godown' },
  { skill: 'Hook (Half Sweep)', category: 'godown' },
  { skill: 'Corkscrew', category: 'godown' },
  // Footwork
  { skill: '6-Step', category: 'footwork' },
  { skill: '3-Step', category: 'footwork' },
  { skill: 'CC (Crazy Commando)', category: 'footwork' },
  { skill: 'Russian Step', category: 'footwork' },
  { skill: 'Kick Out', category: 'footwork' },
  { skill: 'Shuffle', category: 'footwork' },
  { skill: '2-Step', category: 'footwork' },
  // Freezes
  { skill: 'Baby Freeze', category: 'freeze' },
  { skill: 'Chair Freeze', category: 'freeze' },
  { skill: 'Side Freeze', category: 'freeze' },
  { skill: 'Head Freeze', category: 'freeze' },
  { skill: 'Hand Freeze', category: 'freeze' },
  { skill: 'Hollowback', category: 'freeze' },
  // Power
  { skill: 'Windmill', category: 'power' },
  { skill: 'Headspin', category: 'power' },
  { skill: 'Flare', category: 'power' },
  { skill: 'Swipe', category: 'power' },
  { skill: 'Backspin', category: 'power' },
  { skill: 'Handspin (1990)', category: 'power' },
]
