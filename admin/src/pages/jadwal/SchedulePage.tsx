import { useEffect, useMemo, useState } from 'react'
import {
  deleteAdminSchedule,
  getAdminSchedules,
  saveAdminSchedule,
  updateAdminScheduleDayStatus,
} from '../../services/api'
import type { AdminDoctor, AdminScheduleSlot, AdminScheduleStatus } from '../../types'

type SchedulePageProps = {
  doctors: AdminDoctor[]
  scheduleSlots: AdminScheduleSlot[]
  setScheduleSlots: (slots: AdminScheduleSlot[]) => void
  token: string
}

const statusOptions: AdminScheduleStatus[] = ['Tersedia', 'Penuh', 'Libur']

const emptySlot: AdminScheduleSlot = {
  id: '',
  doctorId: '',
  doctorName: '',
  date: '',
  day: '',
  time: '',
  status: 'Tersedia',
}

export function SchedulePage({ doctors, scheduleSlots, setScheduleSlots, token }: SchedulePageProps) {
  const [selectedId, setSelectedId] = useState('')
  const [activeDoctorId, setActiveDoctorId] = useState(doctors[0]?.id ?? '')
  const [draft, setDraft] = useState<AdminScheduleSlot>(emptySlot)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const filteredSlots = useMemo(() => {
    return scheduleSlots.filter((slot) => slot.doctorId === activeDoctorId)
  }, [activeDoctorId, scheduleSlots])
  const selectedSlot = scheduleSlots.find((slot) => slot.id === selectedId)
  const scheduleStats = statusOptions.map((status) => ({
    label: status,
    value: filteredSlots.filter((slot) => slot.status === status).length,
  }))
  const todayKey = getDateKey(new Date())
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowKey = getDateKey(tomorrow)
  const futureDates = Array.from(
    new Set(filteredSlots.filter((slot) => slot.date > tomorrowKey).map((slot) => slot.date)),
  ).sort()
  const scheduleSections = [
    { slots: filteredSlots.filter((slot) => slot.date === todayKey), title: 'Hari Ini' },
    { slots: filteredSlots.filter((slot) => slot.date === tomorrowKey), title: 'Besok' },
    ...futureDates.map((date) => ({
      slots: filteredSlots.filter((slot) => slot.date === date),
      title: formatFullDate(date),
    })),
  ]

  useEffect(() => {
    getAdminSchedules(token)
      .then((nextSlots) => {
        setScheduleSlots(nextSlots)
        setSelectedId(nextSlots[0]?.id ?? '')
        setDraft(nextSlots[0] ?? createBlankSlot())
      })
      .catch(() => setError('Jadwal belum bisa dimuat. Pastikan backend aktif.'))
      .finally(() => setIsLoading(false))
  }, [setScheduleSlots, token])

  useEffect(() => {
    if (!activeDoctorId && doctors[0]) {
      setActiveDoctorId(doctors[0].id)
    }
  }, [activeDoctorId, doctors])

  useEffect(() => {
    if (selectedSlot) {
      setDraft(selectedSlot)
    }
  }, [selectedSlot])

  function createBlankSlot() {
    const firstDoctor = doctors.find((doctor) => doctor.isActive) ?? doctors[0]

    return {
      ...emptySlot,
      doctorId: firstDoctor?.id ?? '',
      doctorName: firstDoctor?.name ?? '',
    }
  }

  function selectSlot(slot: AdminScheduleSlot) {
    setSelectedId(slot.id)
    setDraft(slot)
    setMessage('')
    setError('')
  }

  function createSlot() {
    setSelectedId('')
    setDraft(createBlankSlot())
    setMessage('')
    setError('')
  }

  function updateDoctor(doctorId: string) {
    const doctor = doctors.find((item) => item.id === doctorId)
    setDraft({ ...draft, doctorId, doctorName: doctor?.name ?? '' })
  }

  async function saveSlot(nextStatus = draft.status) {
    if (!draft.doctorId || !draft.date || !draft.time.trim()) {
      setError('Dokter, tanggal, dan jam wajib diisi.')
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const savedSlot = await saveAdminSchedule(token, {
        ...draft,
        status: nextStatus,
        time: draft.time.trim(),
      })
      const exists = scheduleSlots.some((slot) => slot.id === savedSlot.id)
      const nextSlots = exists
        ? scheduleSlots.map((slot) => (slot.id === savedSlot.id ? savedSlot : slot))
        : [savedSlot, ...scheduleSlots]

      setScheduleSlots(sortSlots(nextSlots))
      setSelectedId(savedSlot.id)
      setDraft(savedSlot)
      setMessage('Jadwal berhasil disimpan.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Jadwal gagal disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  async function removeSlot(id: string) {
    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      await deleteAdminSchedule(token, id)
      const nextSlots = scheduleSlots.filter((slot) => slot.id !== id)
      setScheduleSlots(nextSlots)
      setSelectedId(nextSlots[0]?.id ?? '')
      setDraft(nextSlots[0] ?? createBlankSlot())
      setMessage('Slot jadwal berhasil dihapus.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Slot jadwal gagal dihapus.')
    } finally {
      setIsSaving(false)
    }
  }

  async function setDayStatus(status: AdminScheduleStatus) {
    if (!draft.doctorId || !draft.date) {
      setError('Pilih salah satu tanggal dokter dulu.')
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const updatedSlots = await updateAdminScheduleDayStatus(token, draft.doctorId, draft.date, status)
      const updatedIds = new Set(updatedSlots.map((slot) => slot.id))
      const nextSlots = scheduleSlots.map((slot) =>
        updatedIds.has(slot.id) ? updatedSlots.find((updatedSlot) => updatedSlot.id === slot.id) ?? slot : slot,
      )

      setScheduleSlots(sortSlots(nextSlots))
      setDraft(updatedSlots.find((slot) => slot.id === draft.id) ?? updatedSlots[0] ?? draft)
      setMessage(`Status tanggal ${draft.date} berhasil diubah.`)
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : 'Status tanggal gagal disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="schedule-page">
      <div className="schedule-toolbar admin-panel">
        <div className="doctor-tabs" aria-label="Pilih dokter">
          {doctors.map((doctor) => (
            <button
              className={doctor.id === activeDoctorId ? 'active' : ''}
              key={doctor.id}
              type="button"
              onClick={() => {
                setActiveDoctorId(doctor.id)
                const firstSlot = scheduleSlots.find((slot) => slot.doctorId === doctor.id)
                setSelectedId(firstSlot?.id ?? '')
                setDraft(firstSlot ?? { ...emptySlot, doctorId: doctor.id, doctorName: doctor.name })
              }}
            >
              {doctor.name}
            </button>
          ))}
        </div>
        <div className="schedule-stat-grid">
          {scheduleStats.map((stat) => (
            <article key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          ))}
        </div>
      </div>

      <div className="content-management-page">
        <article className="admin-panel content-list-panel">
          <div className="panel-heading">
            <div>
              <h2>Slot Jadwal</h2>
            </div>
            <button type="button" onClick={createSlot}>Tambah</button>
          </div>

          {message ? <p className="admin-success-state">{message}</p> : null}
          {error ? <p className="admin-inline-error">{error}</p> : null}
          {isLoading ? <p className="admin-empty-state">Memuat jadwal dari database...</p> : null}
          {!isLoading && filteredSlots.length === 0 ? <p className="admin-empty-state">Belum ada slot jadwal.</p> : null}

          <div className="schedule-list">
            {scheduleSections.map((section) => (
              <div className="schedule-day-section" key={section.title}>
                <div className="schedule-day-heading">
                  <h3>{section.title}</h3>
                  {section.slots.length > 0 ? <em>{getDayStatus(section.slots)}</em> : null}
                </div>
                {section.slots.length === 0 ? <p>Belum ada slot.</p> : null}
                <div className="admin-time-grid">
                  {section.slots.map((slot) => (
                    <button
                      className={slot.id === selectedId ? 'admin-time-card active' : 'admin-time-card'}
                      key={slot.id}
                      type="button"
                      onClick={() => selectSlot(slot)}
                    >
                      <strong>{slot.time}</strong>
                      <em className={`schedule-status ${slot.status.toLowerCase()}`}>{slot.status}</em>
                      {slot.bookedBy ? (
                        <small>
                          {slot.bookingCode ? `${slot.bookingCode} - ` : ''}
                          {slot.bookedBy}
                          <span>{slot.serviceTitle}</span>
                        </small>
                      ) : (
                        <small>Kosong</small>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel editor-panel">
          <div className="panel-heading compact">
            <div>
              <h2>{selectedId ? 'Edit Slot' : 'Tambah Slot'}</h2>
            </div>
          </div>

          <div className="editor-form">
            <label>
              Dokter
              <select value={draft.doctorId} onChange={(event) => updateDoctor(event.target.value)}>
                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                ))}
              </select>
            </label>
            <label>
              Tanggal
              <input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} />
            </label>
            <label>
              Jam
              <input value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} />
            </label>
            <label>
              Status Slot
              <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as AdminScheduleStatus })}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            {draft.bookedBy ? (
              <div className="booking-summary full-field">
                <span>Booking</span>
                <strong>{draft.bookedBy}</strong>
                <p>{draft.bookingCode} - {draft.serviceTitle}</p>
              </div>
            ) : null}
          </div>

          <div className="editor-actions">
            <button type="button" disabled={isSaving} onClick={() => setDayStatus('Penuh')}>Penuh</button>
            <button type="button" disabled={isSaving} onClick={() => setDayStatus('Libur')}>Libur</button>
            <button className="confirm" type="button" disabled={isSaving} onClick={() => setDayStatus('Tersedia')}>Tersedia</button>
            <button className="confirm" type="button" disabled={isSaving} onClick={() => saveSlot()}>
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
            {selectedId ? (
              <button className="cancel" type="button" disabled={isSaving} onClick={() => removeSlot(selectedId)}>Hapus</button>
            ) : null}
          </div>
        </article>
      </div>
    </section>
  )
}

function getDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatFullDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function getDayStatus(slots: AdminScheduleSlot[]) {
  if (slots.every((slot) => slot.status === 'Libur')) {
    return 'Libur'
  }

  if (slots.every((slot) => slot.status === 'Penuh')) {
    return 'Penuh'
  }

  return 'Tersedia'
}

function sortSlots(slots: AdminScheduleSlot[]) {
  return [...slots].sort((first, second) =>
    `${first.date} ${first.time}`.localeCompare(`${second.date} ${second.time}`),
  )
}
