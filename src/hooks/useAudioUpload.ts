// src/hooks/useAudioUpload.ts
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-m4a']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export function useAudioUpload() {
  const { user } = useAuthStore()
  const [uploading, setUploading] = useState(false)

  async function uploadAudio(file: File): Promise<string | null> {
    if (!user) return null

    if (file.size > MAX_SIZE) {
      toast.error('Ukuran file melebihi 10MB')
      return null
    }
    // Beberapa browser melaporkan audio/mpeg atau audio/mp3 untuk file .mp3
    const isAudio = ALLOWED_TYPES.includes(file.type) || file.type.startsWith('audio/')
    if (!isAudio) {
      toast.error('Format harus MP3, M4A, OGG, atau WAV')
      return null
    }

    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'mp3'
    const fileName = `${user.id}/${Date.now()}.${ext}`

    const { error } = await supabase.storage
      .from('wedding-audio')
      .upload(fileName, file, { upsert: true })

    setUploading(false)

    if (error) {
      toast.error('Gagal upload audio: ' + error.message)
      return null
    }

    const { data } = supabase.storage.from('wedding-audio').getPublicUrl(fileName)
    toast.success('Audio berhasil diupload')
    return data.publicUrl
  }

  return { uploadAudio, uploading }
}
