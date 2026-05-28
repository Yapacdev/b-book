import React, { useState, useRef } from 'react'
import { supabase } from '../supabase/supabase'


function extractStoragePath(url) {
  try {
    const marker = '/bbook-media/'
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    // Strip query string (signed token)
    const raw = url.slice(idx + marker.length)
    return raw.split('?')[0]
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────
// Delete a single media item — DB row + Storage file
// ─────────────────────────────────────────────
export async function deleteMedia(item) {
  const path = extractStoragePath(item.file_url)
  // Delete from Storage first (non-blocking failure is okay)
  if (path) {
    await supabase.storage.from('bbook-media').remove([path])
  }
  // Always delete the DB record
  await supabase.from('media').delete().eq('id', item.id)
}

// ─────────────────────────────────────────────
// Delete ALL media for an entity (call before deleting a move/combo/idea)
// ─────────────────────────────────────────────
export async function deleteEntityMedia(entityType, entityId) {
  // Fetch all media records for this entity
  const { data: items } = await supabase
    .from('media')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)

  if (!items || items.length === 0) return

  // Extract storage paths and remove from Storage in one batch call
  const paths = items.map(i => extractStoragePath(i.file_url)).filter(Boolean)
  if (paths.length > 0) {
    await supabase.storage.from('bbook-media').remove(paths)
  }

  // Delete all DB rows for this entity
  await supabase.from('media')
    .delete()
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
}

// ─────────────────────────────────────────────
// Load media for a given entity
// ─────────────────────────────────────────────
export async function loadMedia(entityType, entityId) {
  const { data } = await supabase.from('media')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: true })
  return data || []
}

// ─────────────────────────────────────────────
// MediaPreview — renders images, videos, audio inline
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
            <button onClick={() => onDelete(item)}
              style={{
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
// MediaUpload — file picker + upload to Supabase Storage
// ─────────────────────────────────────────────
export function MediaUpload({ entityType, entityId, userId, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef()

  async function handleFiles(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    setError('')

    for (const file of files) {
      const fileType = file.type.startsWith('image') ? 'image'
        : file.type.startsWith('video') ? 'video'
        : file.type.startsWith('audio') ? 'audio' : null

      if (!fileType) { setError('Unsupported file type'); continue }

      const ext = file.name.split('.').pop()
      const path = `${userId}/${entityType}/${entityId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('bbook-media')
        .upload(path, file, { upsert: false })

      if (uploadError) { setError(uploadError.message); continue }

      // Use signed URL (bucket is private)
      const { data: signedData } = await supabase.storage
        .from('bbook-media')
        .createSignedUrl(path, 60 * 60 * 24 * 365) // 1 year

      const fileUrl = signedData?.signedUrl || ''

      const { data, error: dbError } = await supabase.from('media').insert({
        user_id: userId,
        entity_type: entityType,
        entity_id: entityId,
        file_url: fileUrl,
        file_type: fileType,
        file_name: file.name,
        file_size: file.size,
      }).select().single()

      if (dbError) { setError(dbError.message); continue }
      if (onUploaded) onUploaded(data)
    }

    setUploading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <input ref={inputRef} type="file" multiple accept="image/*,video/*,audio/*"
        onChange={handleFiles} style={{ display: 'none' }} id={`upload-${entityId}`} />
      <label htmlFor={`upload-${entityId}`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 6, cursor: uploading ? 'wait' : 'pointer',
          border: '1px dashed var(--border2)', color: 'var(--text2)',
          fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5,
          transition: 'all 0.15s', background: 'transparent',
          opacity: uploading ? 0.6 : 1,
          fontFamily: 'Space Grotesk, sans-serif'
        }}>
        {uploading
          ? <><span className="loader loader-dark" style={{ borderTopColor: 'var(--text2)' }} /> Uploading</>
          : '📎 Attach Media'}
      </label>
      {error && <div style={{ color: '#EF4444', fontSize: 11, marginTop: 4 }}>{error}</div>}
    </div>
  )
}
