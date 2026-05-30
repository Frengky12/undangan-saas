// src/pages/dashboard/GuestsPage.tsx
import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useGuests } from '../../hooks/useGuests'
import DashboardLayout from '../../components/DashboardLayout'

// ── Ikon ─────────────────────────────────────────────────
function IconDownload() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

function IconUpload() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
}

// ── CSV parser ────────────────────────────────────────────
type ParsedRow = { name: string; phone: string }

function splitLine(line: string, sep: string): string[] {
  const cols: string[] = []
  let cur = ''
  let inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === sep && !inQ) { cols.push(cur); cur = '' }
    else { cur += ch }
  }
  cols.push(cur)
  return cols.map((c) => c.trim().replace(/^"|"$/g, ''))
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)

  if (!lines.length) return []

  const sep = lines[0].includes(';') ? ';' : ','
  const firstLower = lines[0].toLowerCase()
  const isHeader = ['nama', 'name', 'no', 'hp', 'phone', 'tamu', 'guest'].some((kw) =>
    firstLower.includes(kw)
  )
  const dataLines = isHeader ? lines.slice(1) : lines

  return dataLines
    .map((line) => {
      const cols = splitLine(line, sep)
      return { name: cols[0] ?? '', phone: cols[1] ?? '' }
    })
    .filter((r) => r.name.length > 0)
    .slice(0, 500)
}

// ── Konstanta ─────────────────────────────────────────────
const ATTENDANCE_LABEL: Record<string, string> = {
  hadir: 'Hadir',
  tidak_hadir: 'Tidak Hadir',
  belum_konfirmasi: 'Pending',
}

const ATTENDANCE_STYLE: Record<string, string> = {
  hadir: 'bg-green-50 text-green-600',
  tidak_hadir: 'bg-red-50 text-red-400',
  belum_konfirmasi: 'bg-amber-50 text-amber-500',
}

// ── Komponen utama ────────────────────────────────────────
export default function GuestsPage() {
  const { id } = useParams<{ id: string }>()
  const { guests, loading, stats, importGuests } = useGuests(id!)

  const [importOpen, setImportOpen] = useState(false)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [importing, setImporting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Export CSV ──────────────────────────────────────────
  function exportCSV() {
    const header = ['Nama', 'No. HP', 'Kehadiran', 'Ucapan', 'Waktu RSVP']
    const rows = guests.map((g) => [
      g.name,
      g.phone ?? '',
      ATTENDANCE_LABEL[g.attendance] ?? g.attendance,
      (g.message ?? '').replace(/,/g, ' '),
      new Date(g.created_at).toLocaleString('id-ID'),
    ])
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `tamu-undangan-${id}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Download template ───────────────────────────────────
  function downloadTemplate() {
    const csv = 'Nama,No HP\nMuhammad Rafi,08123456789\nSarah Amalia,08987654321\nBudi Santoso,'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'template-tamu.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Baca file ───────────────────────────────────────────
  function readFile(file: File) {
    if (!file.name.match(/\.(csv|txt)$/i)) {
      alert('Format file harus .csv atau .txt')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const rows = parseCSV(text)
      if (!rows.length) {
        alert('Tidak ada data tamu yang berhasil dibaca. Pastikan format file sesuai template.')
        return
      }
      setParsedRows(rows)
    }
    reader.readAsText(file, 'UTF-8')
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) readFile(file)
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }

  function removeRow(i: number) {
    setParsedRows((prev) => prev.filter((_, idx) => idx !== i))
  }

  function closeModal() {
    setImportOpen(false)
    setParsedRows([])
  }

  async function handleImport() {
    setImporting(true)
    const ok = await importGuests(parsedRows.map((r) => ({
      name: r.name,
      phone: r.phone || undefined,
    })))
    setImporting(false)
    if (ok) closeModal()
  }

  // ── Render ──────────────────────────────────────────────
  return (
    <DashboardLayout
      title="Manajemen Tamu"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors"
          >
            <IconUpload />
            Import CSV
          </button>
          <button
            onClick={exportCSV}
            disabled={guests.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-600 disabled:opacity-40 transition-colors"
          >
            <IconDownload />
            Export CSV
          </button>
        </div>
      }
    >
      {/* ── Statistik ─────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Tamu',       value: stats.total,          color: 'text-stone-700', bg: 'bg-white' },
          { label: 'Hadir',            value: stats.hadir,          color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Tidak Hadir',      value: stats.tidakHadir,     color: 'text-red-500',   bg: 'bg-red-50' },
          { label: 'Belum Konfirmasi', value: stats.belumKonfirmasi, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`border border-stone-200 rounded-xl p-5 ${bg}`}>
            <p className="text-xs text-stone-400 mb-2">{label}</p>
            <p className={`text-2xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabel tamu ────────────────────────────── */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between">
          <p className="text-sm font-medium text-stone-700">Daftar RSVP</p>
          <p className="text-xs text-stone-400">{guests.length} tamu</p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-stone-400 text-sm">Memuat data tamu...</div>
        ) : guests.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-stone-400 text-sm">Belum ada tamu.</p>
            <button
              onClick={() => setImportOpen(true)}
              className="text-sm text-rose-400 hover:text-rose-600 transition-colors"
            >
              Import dari CSV →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50/70 border-b border-stone-100">
                  <th className="text-left text-xs font-medium text-stone-400 px-5 py-3">Nama</th>
                  <th className="text-left text-xs font-medium text-stone-400 px-4 py-3">No. HP</th>
                  <th className="text-left text-xs font-medium text-stone-400 px-4 py-3">Kehadiran</th>
                  <th className="text-left text-xs font-medium text-stone-400 px-4 py-3">Ucapan</th>
                  <th className="text-left text-xs font-medium text-stone-400 px-5 py-3">Waktu RSVP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {guests.map((g) => (
                  <tr key={g.id} className="hover:bg-stone-50/40 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-stone-800">{g.name}</td>
                    <td className="px-4 py-3.5 text-stone-500">
                      {g.phone
                        ? <a href={`tel:${g.phone}`} className="hover:text-stone-700">{g.phone}</a>
                        : <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${ATTENDANCE_STYLE[g.attendance] ?? 'bg-stone-100 text-stone-400'}`}>
                        {ATTENDANCE_LABEL[g.attendance] ?? g.attendance}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-stone-500 max-w-xs">
                      {g.message
                        ? <span className="italic truncate block" title={g.message}>&ldquo;{g.message}&rdquo;</span>
                        : <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-stone-400 text-xs whitespace-nowrap">
                      {new Date(g.created_at).toLocaleString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal Import CSV ──────────────────────── */}
      {importOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-semibold text-stone-800 text-sm">Import Tamu dari CSV</h3>
                <p className="text-xs text-stone-400 mt-0.5">Kolom 1: Nama · Kolom 2: No HP (opsional)</p>
              </div>
              <button onClick={closeModal} className="text-stone-400 hover:text-stone-600 text-xl leading-none">×</button>
            </div>

            {/* Konten modal */}
            <div className="flex-1 overflow-y-auto p-5">
              {parsedRows.length === 0 ? (
                /* ── Belum ada file: upload area ── */
                <div className="space-y-4">
                  {/* Drag & drop zone */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                      dragOver
                        ? 'border-rose-400 bg-rose-50'
                        : 'border-stone-200 hover:border-rose-300 hover:bg-rose-50/40'
                    }`}
                  >
                    <div className="flex justify-center mb-3 text-stone-300">
                      <IconUpload />
                    </div>
                    <p className="text-sm font-medium text-stone-600">
                      {dragOver ? 'Lepas file di sini' : 'Klik atau drag file CSV ke sini'}
                    </p>
                    <p className="text-xs text-stone-400 mt-1">Format .csv atau .txt · Maks 500 baris</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </div>

                  {/* Panduan format */}
                  <div className="bg-stone-50 rounded-xl p-4 text-xs text-stone-500 space-y-1">
                    <p className="font-medium text-stone-700 mb-2">Format CSV yang didukung:</p>
                    <p className="font-mono bg-white rounded px-2 py-1 text-stone-600">Nama,No HP</p>
                    <p className="font-mono bg-white rounded px-2 py-1 text-stone-600">Muhammad Rafi,08123456789</p>
                    <p className="font-mono bg-white rounded px-2 py-1 text-stone-600">Sarah Amalia,</p>
                    <p className="mt-2 text-stone-400">Header opsional. Separator koma (,) atau titik koma (;).</p>
                  </div>

                  {/* Download template */}
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-600 transition-colors"
                  >
                    <IconDownload />
                    Download template CSV
                  </button>
                </div>
              ) : (
                /* ── Preview tabel ── */
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium text-stone-700">
                      {parsedRows.length} tamu ditemukan
                    </p>
                    <button
                      onClick={() => setParsedRows([])}
                      className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
                    >
                      Ganti file
                    </button>
                  </div>

                  <div className="border border-stone-200 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-100">
                          <th className="text-left font-medium text-stone-400 px-3 py-2 w-6">#</th>
                          <th className="text-left font-medium text-stone-400 px-3 py-2">Nama</th>
                          <th className="text-left font-medium text-stone-400 px-3 py-2">No HP</th>
                          <th className="w-8" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
                        {parsedRows.map((row, i) => (
                          <tr key={i} className="hover:bg-stone-50/50">
                            <td className="px-3 py-2 text-stone-400">{i + 1}</td>
                            <td className="px-3 py-2 text-stone-700 font-medium">{row.name}</td>
                            <td className="px-3 py-2 text-stone-400">{row.phone || '—'}</td>
                            <td className="px-2 py-2">
                              <button
                                onClick={() => removeRow(i)}
                                className="text-stone-300 hover:text-red-400 transition-colors text-base leading-none"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {parsedRows.length === 0 && (
                    <p className="text-center text-stone-400 text-xs mt-3">Semua baris dihapus.</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer modal */}
            <div className="px-5 py-4 border-t border-stone-100 flex items-center justify-between flex-shrink-0">
              <p className="text-xs text-stone-400">
                {parsedRows.length > 0
                  ? `${parsedRows.length} tamu akan ditambahkan sebagai "Belum Konfirmasi"`
                  : 'Pilih file CSV untuk mulai'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={closeModal}
                  className="px-3 py-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleImport}
                  disabled={parsedRows.length === 0 || importing}
                  className="px-4 py-1.5 text-sm bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-lg transition-colors"
                >
                  {importing ? 'Mengimport...' : `Import ${parsedRows.length} Tamu`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
