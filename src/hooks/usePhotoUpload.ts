// src/hooks/usePhotoUpload.ts
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

function validate(file: File): string | null {
  if (file.size > MAX_SIZE) return `${file.name}: ukuran melebihi 5MB`
  if (!ALLOWED_TYPES.includes(file.type)) return `${file.name}: format harus JPG, PNG, atau WebP`
  return null
}

async function uploadToStorage(
  userId: string,
  file: File
): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('invitation-photos')
    .upload(fileName, file, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from('invitation-photos').getPublicUrl(fileName)
  return data.publicUrl
}

export function usePhotoUpload() {
  const { user } = useAuthStore()
  const [uploading, setUploading] = useState(false)

  // Upload satu foto (untuk foto utama pengantin)
  async function uploadPhoto(file: File): Promise<string | null> {
    if (!user) return null
    const err = validate(file)
    if (err) { toast.error(err); return null }
    setUploading(true)
    const url = await uploadToStorage(user.id, file)
    setUploading(false)
    if (!url) toast.error('Gagal upload foto')
    return url
  }

  // Upload banyak foto sekaligus (untuk galeri)
  async function uploadMultiple(files: FileList | File[]): Promise<string[]> {
    if (!user) return []
    const list = Array.from(files).slice(0, 10)
    setUploading(true)
    const urls: string[] = []
    for (const file of list) {
      const err = validate(file)
      if (err) { toast.error(err); continue }
      const url = await uploadToStorage(user.id, file)
      if (url) urls.push(url)
    }
    setUploading(false)
    if (urls.length > 0) toast.success(`${urls.length} foto berhasil diupload`)
    return urls
  }

  return { uploadPhoto, uploadMultiple, uploading }
}
