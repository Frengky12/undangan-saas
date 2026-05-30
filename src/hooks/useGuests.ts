// src/hooks/useGuests.ts
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Guest, AttendanceStatus } from '../types/database'
import toast from 'react-hot-toast'

type PublicGuest = Pick<Guest, 'id' | 'name' | 'message' | 'created_at'>

// ── HOOK: manajemen tamu (untuk dashboard pemilik) ────────
export function useGuests(invitationId: string) {
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!invitationId) return
    fetchGuests()

    // Realtime: auto-update saat ada RSVP baru masuk
    const channel = supabase
      .channel(`guests-${invitationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guests', filter: `invitation_id=eq.${invitationId}` },
        (payload) => {
          setGuests((prev) => [payload.new as Guest, ...prev])
          toast.success(`${(payload.new as Guest).name} baru saja RSVP!`)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [invitationId])

  async function fetchGuests() {
    setLoading(true)
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('invitation_id', invitationId)
      .order('created_at', { ascending: false })

    if (!error) setGuests(data ?? [])
    setLoading(false)
  }

  // Statistik ringkas
  const stats = {
    total: guests.length,
    hadir: guests.filter((g) => g.attendance === 'hadir').length,
    tidakHadir: guests.filter((g) => g.attendance === 'tidak_hadir').length,
    belumKonfirmasi: guests.filter((g) => g.attendance === 'belum_konfirmasi').length,
  }

  async function importGuests(
    rows: { name: string; phone?: string }[]
  ): Promise<boolean> {
    if (!rows.length) return false

    const BATCH = 100
    for (let i = 0; i < rows.length; i += BATCH) {
      const { error } = await supabase.from('guests').insert(
        rows.slice(i, i + BATCH).map((r) => ({
          invitation_id: invitationId,
          name: r.name,
          phone: r.phone || null,
          attendance: 'belum_konfirmasi' as const,
          message: null,
        }))
      )
      if (error) {
        toast.error('Gagal import tamu: ' + error.message)
        return false
      }
    }

    toast.success(`${rows.length} tamu berhasil diimport!`)
    await fetchGuests()
    return true
  }

  return { guests, loading, stats, importGuests, refetch: fetchGuests }
}

// ── HOOK: submit RSVP (untuk halaman publik undangan) ─────
export function useRsvp(invitationId: string) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function submitRsvp(payload: {
    name: string
    phone?: string
    attendance: AttendanceStatus
    message?: string
  }): Promise<boolean> {
    setSubmitting(true)

    const { error } = await supabase.from('guests').insert({
      invitation_id: invitationId,
      name: payload.name,
      phone: payload.phone ?? null,
      attendance: payload.attendance,
      message: payload.message ?? null,
    })

    setSubmitting(false)

    if (error) {
      toast.error('Gagal mengirim konfirmasi kehadiran')
      return false
    }

    setSubmitted(true)
    return true
  }

  return { submitRsvp, submitting, submitted }
}

// ── HOOK: tampilkan ucapan & doa tamu (untuk halaman publik) ──
export function usePublicGuests(invitationId: string) {
  const [guests, setGuests] = useState<PublicGuest[]>([])

  useEffect(() => {
    if (!invitationId) return

    async function fetch() {
      const { data } = await supabase
        .from('guests')
        .select('id, name, message, created_at')
        .eq('invitation_id', invitationId)
        .not('message', 'is', null)
        .neq('message', '')
        .order('created_at', { ascending: false })
        .limit(50)

      setGuests((data ?? []) as PublicGuest[])
    }
    fetch()

    // Realtime: pesan baru langsung muncul tanpa refresh
    const channel = supabase
      .channel(`public-guests-${invitationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guests', filter: `invitation_id=eq.${invitationId}` },
        (payload) => {
          const g = payload.new as Guest
          if (g.message) {
            setGuests((prev) => [
              { id: g.id, name: g.name, message: g.message, created_at: g.created_at },
              ...prev,
            ])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [invitationId])

  return { guests }
}
