import { useEffect, useState } from 'react'
import { deleteAdminDoctor, getAdminDoctors, saveAdminDoctor } from '../../services/api'
import type { AdminDoctor } from '../../types'

type DoctorsPageProps = {
  doctors: AdminDoctor[]
  setDoctors: (doctors: AdminDoctor[]) => void
  token: string
}

const emptyDoctor: AdminDoctor = {
  id: '',
  name: '',
  role: 'Dokter Gigi Umum',
  photoName: '',
  note: '',
  isActive: true,
}

export function DoctorsPage({ doctors, setDoctors, token }: DoctorsPageProps) {
  const [selectedId, setSelectedId] = useState('')
  const [draft, setDraft] = useState<AdminDoctor>(emptyDoctor)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminDoctors(token)
      .then((nextDoctors) => {
        setDoctors(nextDoctors)
        setSelectedId(nextDoctors[0]?.id ?? '')
        setDraft(nextDoctors[0] ?? emptyDoctor)
      })
      .catch(() => setError('Data dokter belum bisa dimuat. Pastikan backend aktif.'))
      .finally(() => setIsLoading(false))
  }, [setDoctors, token])

  function selectDoctor(doctor: AdminDoctor) {
    setSelectedId(doctor.id)
    setDraft(doctor)
    setPhotoFile(null)
    setMessage('')
    setError('')
  }

  function createDoctor() {
    setSelectedId('')
    setDraft(emptyDoctor)
    setPhotoFile(null)
    setMessage('')
    setError('')
  }

  async function saveDoctor() {
    if (!draft.name.trim()) {
      setError('Nama dokter wajib diisi.')
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const savedDoctor = await saveAdminDoctor(token, {
        ...draft,
        name: draft.name.trim(),
        role: draft.role.trim() || 'Dokter Gigi Umum',
      }, photoFile)
      const exists = doctors.some((doctor) => doctor.id === savedDoctor.id)
      const nextDoctors = exists
        ? doctors.map((doctor) => (doctor.id === savedDoctor.id ? savedDoctor : doctor))
        : [savedDoctor, ...doctors]

      setDoctors(nextDoctors)
      setSelectedId(savedDoctor.id)
      setDraft(savedDoctor)
      setPhotoFile(null)
      setMessage('Data dokter berhasil disimpan.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Data dokter gagal disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  async function removeDoctor(id: string) {
    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      await deleteAdminDoctor(token, id)
      const nextDoctors = doctors.filter((doctor) => doctor.id !== id)
      setDoctors(nextDoctors)
      setSelectedId(nextDoctors[0]?.id ?? '')
      setDraft(nextDoctors[0] ?? emptyDoctor)
      setPhotoFile(null)
      setMessage('Dokter berhasil dihapus dari halaman customer.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Dokter gagal dihapus.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="content-management-page">
      <article className="admin-panel content-list-panel">
        <div className="panel-heading">
          <div>
            <h2>Daftar Dokter</h2>
          </div>
          <button type="button" onClick={createDoctor}>Tambah</button>
        </div>

        {isLoading ? <p className="admin-empty-state">Memuat dokter...</p> : null}
        {!isLoading && doctors.length === 0 ? <p className="admin-empty-state">Belum ada dokter.</p> : null}

        <div className="content-list">
          {doctors.map((doctor) => (
            <button
              className={doctor.id === selectedId ? 'content-item doctor-content-item active' : 'content-item doctor-content-item'}
              key={doctor.id}
              type="button"
              onClick={() => selectDoctor(doctor)}
            >
              <span className="doctor-thumb">
                {doctor.photoName ? <img src={doctor.photoName} alt={doctor.name} /> : doctor.name.charAt(0)}
              </span>
              <strong>{doctor.name}</strong>
              <span>{doctor.role}</span>
              <em>{doctor.isActive ? 'Aktif' : 'Nonaktif'}</em>
            </button>
          ))}
        </div>
      </article>

      <article className="admin-panel editor-panel">
        <div className="panel-heading compact">
          <div>
            <h2>{selectedId ? 'Edit Dokter' : 'Tambah Dokter'}</h2>
          </div>
        </div>

        {message ? <p className="admin-success-state">{message}</p> : null}
        {error ? <p className="admin-inline-error">{error}</p> : null}

        <div className="editor-form">
          <label>
            Nama Dokter
            <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          </label>
          <label>
            Role
            <input value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} />
          </label>
          <label>
            Upload Foto
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null
                setPhotoFile(file)
                setDraft({ ...draft, photoName: file ? file.name : draft.photoName })
              }}
            />
          </label>
          <label>
            URL / Nama Foto
            <input value={draft.photoName} onChange={(event) => setDraft({ ...draft, photoName: event.target.value })} />
          </label>
        </div>

        <div className="editor-actions">
          <button type="button" disabled={isSaving} onClick={() => setDraft({ ...draft, isActive: false })}>Nonaktifkan</button>
          <button className="confirm" type="button" disabled={isSaving} onClick={() => setDraft({ ...draft, isActive: true })}>Aktifkan</button>
          <button className="confirm" type="button" disabled={isSaving} onClick={saveDoctor}>
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
          {selectedId ? (
            <button className="cancel" type="button" disabled={isSaving} onClick={() => removeDoctor(selectedId)}>Hapus</button>
          ) : null}
        </div>
      </article>
    </section>
  )
}
