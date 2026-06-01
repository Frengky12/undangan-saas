// src/pages/dashboard/EditorPage.tsx
import { useState, useEffect, useRef } from 'react'

function resolveAudioUrl(url: string): string {
  const match = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/)
  if (match) return `https://drive.google.com/uc?export=download&id=${match[1]}`
  return url
}
import { useNavigate, useParams } from 'react-router-dom'
import { useInvitations } from '../../hooks/useInvitations'
import { usePhotoUpload } from '../../hooks/usePhotoUpload'
import { useAudioUpload } from '../../hooks/useAudioUpload'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import type { InvitationData, ThemeId } from '../../types/database'

const THEMES: { id: ThemeId; label: string; desc: string; color: string }[] = [
  { id: 'floral',  label: 'Floral Islami',  desc: 'Motif bunga dengan sentuhan arabesque', color: '#f9a8d4' },
  { id: 'modern',  label: 'Modern Elegan',  desc: 'Minimalis, bersih, dan kontemporer',    color: '#a5b4fc' },
  { id: 'klasik',  label: 'Klasik Mewah',   desc: 'Gold accent dengan ornamen kaligrafi',  color: '#fcd34d' },
]

const EMPTY_FORM: InvitationData = {
  groomName: '',
  brideName: '',
  groomFather: '',
  groomMother: '',
  brideFather: '',
  brideMother: '',
  akadDate: '',
  akadTime: '08:00',
  resepsiDate: '',
  resepsiTime: '11:00',
  venue: '',
  address: '',
  mapsUrl: '',
  photoUrl: '',
  musicUrl: '',
  quranVerse: 'وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا (QS. Ar-Rum: 21)',
  openingText: 'Dengan memohon ridho Allah Subhanahu Wa Ta\'ala, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di pernikahan kami.',
}

const inputCls = 'w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <h3 className="text-sm font-medium text-stone-700 mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default function EditorPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const { createInvitation, updateInvitation, invitations } = useInvitations()
  const { uploadPhoto, uploadMultiple, uploading } = usePhotoUpload()
  const { uploadAudio, uploading: uploadingAudio } = useAudioUpload()

  const [form, setForm] = useState<InvitationData>(EMPTY_FORM)
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('floral')
  const [saving, setSaving] = useState(false)
  const initialized = useRef(false)

  // Populate form dengan data yang ada saat mode edit
  useEffect(() => {
    if (!id || initialized.current || invitations.length === 0) return
    const inv = invitations.find((i) => i.id === id)
    if (inv) {
      setForm(inv.data)
      setSelectedTheme(inv.theme_id)
      initialized.current = true
    }
  }, [id, invitations])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadPhoto(file)
    if (url) setForm((prev) => ({ ...prev, photoUrl: url }))
  }

  async function handleGalleryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return
    const newUrls = await uploadMultiple(files)
    if (newUrls.length > 0) {
      setForm((prev) => ({
        ...prev,
        photos: [...(prev.photos ?? []), ...newUrls].slice(0, 10),
      }))
    }
    e.target.value = ''
  }

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await uploadAudio(file)
    if (url) setForm((prev) => ({ ...prev, musicUrl: url }))
    e.target.value = ''
  }

  function removeGalleryPhoto(index: number) {
    setForm((prev) => ({
      ...prev,
      photos: (prev.photos ?? []).filter((_, i) => i !== index),
    }))
  }

  async function handleSave() {
    if (!form.groomName || !form.brideName || !form.resepsiDate) {
      alert('Nama pengantin dan tanggal resepsi wajib diisi')
      return
    }
    setSaving(true)
    if (id) {
      await updateInvitation(id, { data: form, theme_id: selectedTheme })
    } else {
      const inv = await createInvitation(form, selectedTheme)
      if (inv) navigate('/dashboard')
    }
    setSaving(false)
  }

  return (
    <DashboardLayout
      title={id ? 'Edit Undangan' : 'Buat Undangan Baru'}
      actions={
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      }
    >
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Pilih Tema */}
        <Card title="Pilih Tema">
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setSelectedTheme(theme.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedTheme === theme.id
                    ? 'border-rose-300 bg-rose-50 ring-1 ring-rose-200'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div
                  className="w-full h-8 rounded-md mb-2"
                  style={{ backgroundColor: theme.color, opacity: 0.7 }}
                />
                <p className="text-xs font-medium text-stone-700">{theme.label}</p>
                <p className="text-xs text-stone-400 mt-0.5 leading-tight">{theme.desc}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Foto */}
        <Card title="Foto Pengantin">
          <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-stone-200 hover:border-rose-300 rounded-xl cursor-pointer hover:bg-rose-50/50 transition-all">
            {form.photoUrl ? (
              <img src={form.photoUrl} alt="foto" className="h-full w-full object-cover rounded-xl" />
            ) : (
              <div className="text-center">
                <p className="text-sm text-stone-400">{uploading ? 'Mengupload...' : 'Klik untuk upload foto'}</p>
                <p className="text-xs text-stone-300 mt-1">JPG, PNG, WebP · Maks 5MB</p>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </Card>

        {/* Galeri Foto */}
        <Card title="Galeri Foto">
          <div className="grid grid-cols-5 gap-2 mb-3">
            {(form.photos ?? []).map((url, i) => (
              <div key={url} className="relative group aspect-square">
                <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeGalleryPhoto(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow"
                >
                  ×
                </button>
              </div>
            ))}
            {(form.photos?.length ?? 0) < 10 && (
              <label className="aspect-square border-2 border-dashed border-stone-200 hover:border-rose-300 rounded-lg cursor-pointer flex flex-col items-center justify-center hover:bg-rose-50/50 transition-all">
                {uploading ? (
                  <span className="text-xs text-stone-400">Upload...</span>
                ) : (
                  <>
                    <span className="text-stone-300 text-xl leading-none">+</span>
                    <span className="text-xs text-stone-400 mt-1">Foto</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleGalleryUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-stone-400">
            {form.photos?.length ?? 0}/10 foto · JPG, PNG, WebP · Maks 5MB per foto
          </p>
        </Card>

        {/* Data Pengantin */}
        <Card title="Data Pengantin">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'groomName',   label: 'Nama mempelai pria *',      placeholder: 'Muhammad Rafi' },
              { name: 'brideName',   label: 'Nama mempelai wanita *',     placeholder: 'Sarah Amalia' },
              { name: 'groomFather', label: 'Ayah mempelai pria',         placeholder: 'Bapak Ahmad' },
              { name: 'brideFather', label: 'Ayah mempelai wanita',       placeholder: 'Bapak Hasan' },
              { name: 'groomMother', label: 'Ibu mempelai pria',          placeholder: 'Ibu Fatimah' },
              { name: 'brideMother', label: 'Ibu mempelai wanita',        placeholder: 'Ibu Aisyah' },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label className="block text-xs text-stone-500 mb-1.5">{label}</label>
                <input
                  name={name}
                  type="text"
                  value={(form as unknown as Record<string, string>)[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Jadwal Acara */}
        <Card title="Jadwal Acara">
          <div className="space-y-5">
            {/* Akad */}
            <div>
              <p className="text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">Akad Nikah</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1.5">Tanggal *</label>
                  <input type="date" name="akadDate" value={form.akadDate} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1.5">Waktu</label>
                  <input type="time" name="akadTime" value={form.akadTime} onChange={handleChange} className={inputCls} />
                </div>
              </div>
            </div>

            <div className="border-t border-stone-100" />

            {/* Resepsi */}
            <div>
              <p className="text-xs font-medium text-stone-500 mb-2 uppercase tracking-wider">Resepsi</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1.5">Tanggal *</label>
                  <input type="date" name="resepsiDate" value={form.resepsiDate} onChange={handleChange} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1.5">Waktu</label>
                  <input type="time" name="resepsiTime" value={form.resepsiTime} onChange={handleChange} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-stone-400 mb-1.5">Nama gedung / lokasi *</label>
                  <input name="venue" type="text" value={form.venue} onChange={handleChange}
                    placeholder="Gedung Serbaguna Al-Ikhlas" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-stone-400 mb-1.5">Alamat lengkap</label>
                  <input name="address" type="text" value={form.address} onChange={handleChange}
                    placeholder="Jl. Sudirman No.12, Palembang" className={inputCls} />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-xs text-stone-400 mb-1.5">Link Google Maps</label>
                <input name="mapsUrl" type="url" value={form.mapsUrl} onChange={handleChange}
                  placeholder="https://maps.google.com/..." className={inputCls} />
              </div>
            </div>
          </div>
        </Card>

        {/* Teks Undangan */}
        <Card title="Teks Undangan">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1.5">Ayat Al-Quran</label>
              <input name="quranVerse" type="text" value={form.quranVerse} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1.5">Kata pengantar</label>
              <textarea name="openingText" value={form.openingText} onChange={handleChange} rows={3}
                className={`${inputCls} resize-none`} />
            </div>
          </div>
        </Card>

        {/* Musik */}
        <Card title="Musik Latar">
          <div className="space-y-3">
            <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${uploadingAudio ? 'border-stone-200 bg-stone-50 cursor-wait' : 'border-stone-200 hover:border-rose-300 hover:bg-rose-50/50'}`}>
              <svg className="w-8 h-8 text-stone-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
              </svg>
              <div>
                <p className="text-sm text-stone-600 font-medium">
                  {uploadingAudio ? 'Mengupload...' : 'Upload file audio'}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">MP3, M4A, WAV, OGG · Maks 10MB</p>
              </div>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={handleAudioUpload}
                disabled={uploadingAudio}
              />
            </label>

            {form.musicUrl && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-stone-500">Preview audio</p>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, musicUrl: '' }))}
                    className="text-xs text-red-400 hover:text-red-500 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
                <audio key={form.musicUrl} src={form.musicUrl} controls className="w-full" />
              </div>
            )}
          </div>
        </Card>

        {/* Tombol simpan di bawah form */}
        <div className="flex justify-end pb-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {saving ? 'Menyimpan...' : id ? 'Simpan Perubahan' : 'Buat Undangan'}
          </button>
        </div>

      </div>
    </DashboardLayout>
  )
}
