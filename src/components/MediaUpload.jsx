import React, { useState, useRef } from 'react'
import { supabase } from '../supabase/supabase'

// ─────────────────────────────────────────────
// Extract storage path from a signed URL
// ─────────────────────────────────────────────
function extractStoragePath(url) {
  try {
    const marker = '/bbook-media/'
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    return url.slice(idx + marker.length).split('?')[0]
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────
// Upload a single file via XHR so we get progress events
// Returns { path, error }
// ─────────────────────────────────────────────
async function uploadWithProgress(file, path, onProgress) {
  // Get the Supabase session token
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const anonKey    = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const uploadUrl  = `${supabaseUrl}/storage/v1/object/bbook-media/${path}`

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ path, error: null })
      } else {
        try {
          const body = JSON.parse(xhr.responseText)
          resolve({ path: null, error: body.message || `Upload failed (${xhr.status})` })
        } catch {
          resolve({ path: null, error: `Upload failed (${xhr.status})` })
        }
      }
    })

    xhr.addEventListener('error', () => resolve({ path: null, error: 'Network error' }))

    xhr.open('POST', uploadUrl)
    xhr.setRequestHeader('Authorization', `Bearer ${token || anonKey}`)
    xhr.setRequestHeader('apikey', anonKey)
    xhr.setRequestHeader('x-upsert', 'false')
    // Let browser set Content-Type with boundary for FormData,
    // or set it manually for raw file upload
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

// ─────────────────────────────────────────────
// Delete a single media item — Storage + DB
// ─────────────────────────────────────────────
export async function deleteMedia(item) {
  const path = extractStoragePath(item.file_url)
  if (path) await supabase.storage.from('bbook-media').remove([path])
  await supabase.from('media').delete().eq('id', item.id)
}

// ─────────────────────────────────────────────
// Delete ALL media for an entity before deleting it
// ─────────────────────────────────────────────
export async function deleteEntityMedia(entityType, entityId) {
  const { data: items } = await supabase
    .from('media').select('*')
    .eq('entity_type', entityType).eq('entity_id', entityId)

  if (!items || items.length === 0) return

  const paths = items.map(i => extractStoragePath(i.file_url)).filter(Boolean)
  if (paths.length > 0) await supabase.storage.from('bbook-media').remove(paths)
  await supabase.from('media').delete().eq('entity_type', entityType).eq('entity_id', entityId)
}

// ─────────────────────────────────────────────
// Load media for a given entity
// ─────────────────────────────────────────────
export async function loadMedia(entityType, entityId) {
  const { data } = await supabase.from('media')
    .select('*').eq('entity_type', entityType).eq('entity_id', entityId)
    .order('created_at', { ascending: true })
  return data || []
}

// ─────────────────────────────────────────────
// MediaPreview
// ─────────────────────────────────────────────
export function MediaPreview({ items, onDelete }) {
  if (!items || items.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
      {items.map(item => (
        <div key={item.id} style={{
          position: 'relative', borderRadius: 6,
          overflow: 'hidden', border: '1px solid var(--border)'
        }}>
          {item.file_type === 'image' && (
            <img src={item.file_url} alt={item.file_name}
              style={{ width: 100, height: 100, objectFit: 'cover', display: 'block' }} />
          )}
          {item.file_type === 'video' && (
            <video src={item.file_url} controls
              style={{ width: 180, height: 100, display: 'block', background: '#000' }} />
          )}
          {item.file_type === 'audio' && (
            <div style={{ padding: '8px 10px', background: 'var(--bg3)', width: 200 }}>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                🎵 {item.file_name}
              </div>
              <audio src={item.file_url} controls style={{ width: '100%', height: 28 }} />
            </div>
          )}
          {onDelete && (
            <button onClick={() => onDelete(item)} style={{
              position: 'absolute', top: 4, right: 4,
              background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white',
              borderRadius: '50%', width: 20, height: 20, cursor: 'pointer',
              fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              lineHeight: 1
            }}>×</button>
          )}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// MediaUpload — with per-file progress bar
// ─────────────────────────────────────────────
export function MediaUpload({ entityType, entityId, userId, onUploaded }) {
  // files: [{ name, progress 0-100, status: 'uploading'|'done'|'error', error? }]
  const [queue, setQueue] = useState([])
  const inputRef = useRef()

  function updateQueue(name, patch) {
    setQueue(prev => prev.map(f => f.name === name ? { ...f, ...patch } : f))
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return

    // Add all files to queue at 0%
    const newEntries = files.map(f => ({ name: f.name, progress: 0, status: 'uploading', error: null }))
    setQueue(prev => [...prev, ...newEntries])

    for (const file of files) {
      const fileType = file.type.startsWith('image') ? 'image'
        : file.type.startsWith('video') ? 'video'
        : file.type.startsWith('audio') ? 'audio' : null

      if (!fileType) {
        updateQueue(file.name, { status: 'error', error: 'Unsupported type' })
        continue
      }

      const ext = file.name.split('.').pop()
      const path = `${userId}/${entityType}/${entityId}/${Date.now()}.${ext}`

      // Upload with XHR progress
      const { error: uploadError } = await uploadWithProgress(file, path, (pct) => {
        updateQueue(file.name, { progress: pct })
      })

      if (uploadError) {
        updateQueue(file.name, { status: 'error', error: uploadError })
        continue
      }

      // Get signed URL
      const { data: signedData } = await supabase.storage
        .from('bbook-media')
        .createSignedUrl(path, 60 * 60 * 24 * 365)

      const fileUrl = signedData?.signedUrl || ''

      // Save to DB
      const { data, error: dbError } = await supabase.from('media').insert({
        user_id: userId, entity_type: entityType, entity_id: entityId,
        file_url: fileUrl, file_type: fileType,
        file_name: file.name, file_size: file.size,
      }).select().single()

      if (dbError) {
        updateQueue(file.name, { status: 'error', error: dbError.message })
        continue
      }

      updateQueue(file.name, { status: 'done', progress: 100 })
      if (onUploaded) onUploaded(data)
    }

    // Clear done items after a short delay
    setTimeout(() => {
      setQueue(prev => prev.filter(f => f.status !== 'done'))
    }, 1800)

    if (inputRef.current) inputRef.current.value = ''
  }

  const isUploading = queue.some(f => f.status === 'uploading')

  return (
    <div>
      <input ref={inputRef} type="file" multiple accept="image/*,video/*,audio/*"
        onChange={handleFiles} style={{ display: 'none' }} id={`upload-${entityId}`} />

      <label htmlFor={`upload-${entityId}`} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 6,
        cursor: isUploading ? 'wait' : 'pointer',
        border: '1px dashed var(--border2)', color: 'var(--text2)',
        fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5,
        transition: 'all 0.15s', background: 'transparent',
        opacity: isUploading ? 0.6 : 1,
        fontFamily: 'Space Grotesk, sans-serif',
        pointerEvents: isUploading ? 'none' : 'auto',
      }}>
        📎 Attach Media
      </label>

      {/* Progress bars */}
      {queue.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {queue.map(f => (
            <div key={f.name}>
              {/* File name + status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <div style={{
                  fontSize: 11, color: 'var(--text2)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: 220
                }}>
                  {f.name}
                </div>
                <div style={{ fontSize: 11, flexShrink: 0, marginLeft: 8,
                  color: f.status === 'error' ? '#EF4444' : f.status === 'done' ? '#10B981' : 'var(--text3)'
                }}>
                  {f.status === 'error' ? `✕ ${f.error}` : f.status === 'done' ? '✓ Done' : `${f.progress}%`}
                </div>
              </div>

              {/* Progress track */}
              {f.status !== 'error' && (
                <div style={{
                  height: 3, background: 'var(--bg4)',
                  borderRadius: 2, overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${f.progress}%`,
                    borderRadius: 2,
                    background: f.status === 'done' ? '#10B981' : 'var(--accent)',
                    transition: 'width 0.15s ease, background 0.3s ease',
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
