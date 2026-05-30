// src/hooks/useInvitations.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Invitation, InvitationData, ThemeId } from '../types/database'
import toast from 'react-hot-toast'

// ── GENERATE SLUG dari nama pengantin ─────────────────────
export function generateSlug(groomName: string, brideName: string): string {
  const clean = (s: string) =>
    s.toLowerCase()
     .replace(/[^a-z0-9\s]/g, '')
     .trim()
     .replace(/\s+/g, '-')
  const timestamp = Date.now().toString(36) // tambah suffix agar unik
  return `${clean(groomName)}-${clean(brideName)}-${timestamp}`
}

// ── HOOK: daftar semua undangan milik user ────────────────
export function useInvitations() {
  const { user } = useAuthStore()
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    fetchInvitations()
  }, [user])

  async function fetchInvitations() {
    setLoading(true)
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Gagal memuat undangan')
    } else {
      setInvitations(data ?? [])
    }
    setLoading(false)
  }

  async function createInvitation(
    data: InvitationData,
    themeId: ThemeId = 'floral'
  ): Promise<Invitation | null> {
    const slug = generateSlug(data.groomName, data.brideName)

    const { data: inv, error } = await supabase
      .from('invitations')
      .insert({
        user_id: user!.id,
        slug,
        theme_id: themeId,
        data,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      toast.error('Gagal membuat undangan: ' + error.message)
      return null
    }

    toast.success('Undangan berhasil dibuat!')
    setInvitations((prev) => [inv, ...prev])
    return inv
  }

  async function updateInvitation(
    id: string,
    updates: { data?: InvitationData; theme_id?: ThemeId; is_active?: boolean }
  ): Promise<boolean> {
    const { error } = await supabase
      .from('invitations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      toast.error('Gagal menyimpan perubahan')
      return false
    }

    toast.success('Perubahan disimpan!')
    setInvitations((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } as Invitation : i))
    )
    return true
  }

  async function deleteInvitation(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Gagal menghapus undangan')
      return false
    }

    toast.success('Undangan dihapus')
    setInvitations((prev) => prev.filter((i) => i.id !== id))
    return true
  }

  return { invitations, loading, createInvitation, updateInvitation, deleteInvitation, refetch: fetchInvitations }
}

// ── HOOK: ambil 1 undangan by slug (untuk halaman publik) ─
export function usePublicInvitation(slug: string) {
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error || !data) setNotFound(true)
      else setInvitation(data)
      setLoading(false)
    }
    fetch()
  }, [slug])

  return { invitation, loading, notFound }
}
