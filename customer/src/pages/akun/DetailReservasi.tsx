import { SectionHeading } from '../../components/common/SectionHeading'
import { ReservationSummary } from '../../components/reservation/ReservationSummary'
import type { Reservation } from '../../types'

type DetailReservasiProps = {
  cancelReservation: (code: string) => void
  goBack: () => void
  reservation: Reservation
  startReservation: (serviceId?: string) => void
}

export function DetailReservasi({ cancelReservation, goBack, reservation, startReservation }: DetailReservasiProps) {
  const canCancel = reservation.status === 'Menunggu Konfirmasi' || reservation.status === 'Dikonfirmasi'

  return (
    <section className="content-section account-page">
      <SectionHeading
        title="Detail Reservasi"
        description="Status reservasi akan berubah setelah admin melakukan konfirmasi."
      />
      <button className="outline-button account-back-button" type="button" onClick={goBack}>
        Kembali
      </button>
      <div className="reservation-detail-card">
        <ReservationSummary
          complaint={reservation.complaint}
          date={reservation.date}
          doctorName={reservation.doctorName}
          serviceTitle={reservation.serviceTitle}
          status={reservation.status}
          time={reservation.time}
          code={reservation.code}
        />
        <div className="detail-divider" />
        <div className="profile-actions">
          {canCancel ? (
            <button className="danger-button" type="button" onClick={() => cancelReservation(reservation.id)}>
              Batalkan Reservasi
            </button>
          ) : null}
          <button className="outline-button" type="button" onClick={() => startReservation()}>
            Buat Reservasi Baru
          </button>
        </div>
      </div>
    </section>
  )
}
