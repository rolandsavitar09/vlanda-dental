import type { AdminReservation } from '../../types'

type DashboardProps = {
  openReservations: (status?: AdminReservation['status'], reservationId?: string) => void
  reservations: AdminReservation[]
}

const statTones = {
  Dibatalkan: 'danger',
  Dikonfirmasi: 'success',
  'Menunggu Konfirmasi': 'warning',
  Selesai: 'info',
} as const

const statLabels = ['Menunggu Konfirmasi', 'Dikonfirmasi', 'Selesai', 'Dibatalkan'] as const

export function Dashboard({ openReservations, reservations }: DashboardProps) {
  const reservationStats = statLabels.map((label) => ({
    label,
    tone: statTones[label],
    value: reservations.filter((reservation) => reservation.status === label).length,
  }))
  const latestReservations = reservations.slice(0, 5)

  return (
    <>
        <section className="stats-grid" aria-label="Ringkasan reservasi">
          {reservationStats.map((stat) => (
            <button
              className={`stat-card ${stat.tone}`}
              key={stat.label}
              type="button"
              onClick={() => openReservations(stat.label)}
            >
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </button>
          ))}
        </section>

        <section className="dashboard-grid">
          <article className="admin-panel reservations-panel">
            <div className="panel-heading">
              <div>
                <h2>Reservasi Terbaru</h2>
              </div>
              <button type="button" onClick={() => openReservations()}>Lihat Semua</button>
            </div>

            <div className="reservation-table">
              {latestReservations.length === 0 ? (
                <p className="admin-empty-state">Belum ada reservasi customer.</p>
              ) : null}
              {latestReservations.map((reservation) => (
                <button
                  className={`reservation-row ${getReservationTone(reservation.status)}`}
                  key={reservation.id}
                  type="button"
                  onClick={() => openReservations(undefined, reservation.id)}
                >
                  <strong>{reservation.code}</strong>
                  <span>{reservation.customer}</span>
                  <span>{reservation.service}</span>
                  <span>{reservation.doctor}</span>
                  <span className="dashboard-schedule">
                    <span>{reservation.date}</span>
                    <span>{reservation.time}</span>
                  </span>
                  <em>{reservation.status}</em>
                </button>
              ))}
            </div>
          </article>

        </section>
    </>
  )
}

function getReservationTone(status: AdminReservation['status']) {
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
