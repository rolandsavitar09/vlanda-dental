import type { ReservationStatus } from '../../types'
import { formatDate } from '../../utils/format'
import { ProfileField } from '../common/ProfileField'
import { StatusBadge } from '../common/StatusBadge'

type ReservationSummaryProps = {
  code?: string
  complaint: string
  date: string
  doctorName: string
  serviceTitle: string
  status: ReservationStatus
  time: string
}

export function ReservationSummary({
  code,
  complaint,
  date,
  doctorName,
  serviceTitle,
  status,
  time,
}: ReservationSummaryProps) {
  return (
    <div className="summary-list">
      {code ? <ProfileField label="Kode Reservasi" value={code} /> : null}
      <ProfileField label="Layanan" value={serviceTitle} />
      <ProfileField label="Dokter" value={doctorName} />
      <ProfileField label="Tanggal" value={formatDate(date)} />
      <ProfileField label="Jam" value={time} />
      <div className="profile-field">
        <span>Status</span>
        <StatusBadge status={status} />
      </div>
      <ProfileField label="Keluhan" value={complaint} />
    </div>
  )
}
