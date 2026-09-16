import { StatusBadge } from '../../components/common/StatusBadge'
import { SectionHeading } from '../../components/common/SectionHeading'
import { Icon } from '../../components/common/Icon'
import type { Reservation } from '../../types'
import { formatDate } from '../../utils/format'

type RiwayatReservasiProps = {
  openDetail: (code: string) => void
  reservations: Reservation[]
}

export function RiwayatReservasi({ openDetail, reservations }: RiwayatReservasiProps) {
  return (
    <section className="content-section account-page">
      <SectionHeading
        title="Riwayat Reservasi"
        description="Pantau status reservasi setelah dikonfirmasi oleh admin klinik."
      />
      <div className="reservation-history-list">
        {reservations.map((reservation) => (
          <article className="history-card" key={reservation.id}>
            <div className="history-head">
              <strong>{reservation.code}</strong>
              <StatusBadge status={reservation.status} />
            </div>
            <h3>{reservation.serviceTitle}</h3>
            <p>{reservation.doctorName}</p>
            <span>
              {formatDate(reservation.date)} - {reservation.time}
            </span>
            <button className="text-button detail-link" type="button" onClick={() => openDetail(reservation.id)}>
              Detail <Icon name="arrow" />
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
