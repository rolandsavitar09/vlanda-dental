import { useEffect, useMemo, useState } from 'react'
import {
  rescheduleAdminReservation,
  updateAdminReservationStatus,
} from '../../services/api'
import type { AdminReservation, AdminReservationStatus } from '../../types'

type ReservationsPageProps = {
  activeStatus: 'Semua' | AdminReservationStatus
  reservations: AdminReservation[]
  selectedReservationId: string
  setActiveStatus: (status: 'Semua' | AdminReservationStatus) => void
  setSelectedReservationId: (reservationId: string) => void
  setReservations: (reservations: AdminReservation[]) => void
  token: string
}

const statusOptions: Array<'Semua' | AdminReservationStatus> = [
  'Semua',
  'Menunggu Konfirmasi',
  'Dikonfirmasi',
  'Selesai',
  'Dibatalkan',
]

export function ReservationsPage({
  activeStatus,
  reservations,
  selectedReservationId,
  setActiveStatus,
  setSelectedReservationId,
  setReservations,
  token,
}: ReservationsPageProps) {
  const [selectedId, setSelectedId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const selectedReservation = reservations.find((reservation) => reservation.id === selectedId)
  const [scheduleDraft, setScheduleDraft] = useState({
    date: selectedReservation?.date ?? '',
    time: selectedReservation?.time ?? '',
  })

  const filteredReservations = useMemo(() => {
    if (activeStatus === 'Semua') {
      return reservations
    }

    return reservations.filter((reservation) => reservation.status === activeStatus)
  }, [activeStatus, reservations])

  useEffect(() => {
    if (selectedReservation) {
      setScheduleDraft({ date: selectedReservation.date, time: selectedReservation.time })
    }
  }, [selectedReservation])

  useEffect(() => {
    if (selectedReservationId) {
      setSelectedId(selectedReservationId)
    }
  }, [selectedReservationId])

  function selectReservation(reservation: AdminReservation) {
    setSelectedId(reservation.id)
    setSelectedReservationId(reservation.id)
    setScheduleDraft({ date: reservation.date, time: reservation.time })
  }

  function closeDetail() {
    setSelectedId('')
    setSelectedReservationId('')
  }

  function updateReservation(id: string, updates: Partial<AdminReservation>) {
    setReservations(
      reservations.map((reservation) =>
        reservation.id === id ? { ...reservation, ...updates } : reservation,
      ),
    )
  }

  async function changeStatus(status: AdminReservationStatus) {
    if (!selectedReservation) {
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const updatedReservation = await updateAdminReservationStatus(token, selectedReservation.id, status)
      updateReservation(selectedReservation.id, updatedReservation)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Status reservasi gagal disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveSchedule() {
    if (!selectedReservation) {
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const updatedReservation = await rescheduleAdminReservation(
        token,
        selectedReservation.id,
        scheduleDraft.date,
        scheduleDraft.time,
      )
      updateReservation(selectedReservation.id, updatedReservation)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Jadwal reservasi gagal disimpan.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="reservations-page">
      <div className="status-tabs" aria-label="Filter status reservasi">
        {statusOptions.map((status) => (
          <button
            className={activeStatus === status ? 'active' : ''}
            key={status}
            type="button"
            onClick={() => setActiveStatus(status)}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="reservations-layout single">
        <article className="admin-panel reservation-management-panel">
          <div className="panel-heading">
            <div>
              <h2>Daftar Reservasi</h2>
            </div>
          </div>

          {error ? <p className="admin-inline-error">{error}</p> : null}

          <div className="management-list">
            {filteredReservations.length === 0 ? (
              <p className="admin-empty-state">Belum ada reservasi dengan status ini.</p>
            ) : null}
            {filteredReservations.map((reservation) => (
              <button
                className={[
                  reservation.id === selectedReservation?.id ? 'management-item active' : 'management-item',
                  getReservationTone(reservation.status),
                ].join(' ')}
                key={reservation.id}
                type="button"
                onClick={() => selectReservation(reservation)}
              >
                <strong>{reservation.code}</strong>
                <span data-label="Customer"><b className="management-value">{reservation.customer}</b></span>
                <span data-label="Layanan"><b className="management-value">{reservation.service}</b></span>
                <span data-label="Dokter"><b className="management-value">{reservation.doctor}</b></span>
                <small data-label="Jadwal"><b className="management-value">{reservation.date} - {reservation.time}</b></small>
                <em>{reservation.status}</em>
              </button>
            ))}
          </div>
        </article>

      </div>

      {selectedReservation ? (
        <div className="reservation-modal-backdrop" role="presentation" onClick={closeDetail}>
          <article
            aria-modal="true"
            className="admin-panel reservation-detail-panel reservation-modal"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-heading compact">
              <div>
                <h2>Detail Reservasi</h2>
                <p>{selectedReservation.code}</p>
              </div>
              <div className="reservation-detail-actions">
                <button type="button" onClick={closeDetail}>
                  Kembali
                </button>
                <em>{selectedReservation.status}</em>
              </div>
            </div>

            <div className="detail-list">
              <DetailItem label="Customer" value={selectedReservation.customer} />
              <DetailItem label="Telepon" value={selectedReservation.phone} />
              <DetailItem label="Layanan" value={selectedReservation.service} />
              <DetailItem label="Dokter" value={selectedReservation.doctor} />
              <DetailItem label="Keluhan" value={selectedReservation.complaint} />
            </div>

            <div className="schedule-editor">
              <label>
                Tanggal
                <input
                  type="date"
                  value={scheduleDraft.date}
                  onChange={(event) => setScheduleDraft({ ...scheduleDraft, date: event.target.value })}
                />
              </label>
              <label>
                Jam
                <input
                  value={scheduleDraft.time}
                  onChange={(event) => setScheduleDraft({ ...scheduleDraft, time: event.target.value })}
                />
              </label>
              <button
                type="button"
                disabled={isSaving}
                onClick={saveSchedule}
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Jadwal'}
              </button>
            </div>

            <div className="reservation-action-grid">
              {selectedReservation.customerWhatsappUrl ? (
                <a href={selectedReservation.customerWhatsappUrl} target="_blank" rel="noreferrer">
                  WhatsApp Customer
                </a>
              ) : null}
              <button
                className="confirm"
                type="button"
                disabled={isSaving}
                onClick={() => changeStatus('Dikonfirmasi')}
              >
                Konfirmasi
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => changeStatus('Selesai')}
              >
                Tandai Selesai
              </button>
              <button
                className="cancel"
                type="button"
                disabled={isSaving}
                onClick={() => changeStatus('Dibatalkan')}
              >
                Batalkan
              </button>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  )
}

function getReservationTone(status: AdminReservationStatus) {
  if (status === 'Menunggu Konfirmasi') {
    return 'waiting'
  }

  if (status === 'Dibatalkan') {
    return 'cancelled'
  }

  if (status === 'Selesai') {
    return 'finished'
  }

  return 'confirmed'
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
