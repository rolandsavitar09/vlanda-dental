import type { ReservationStatus } from '../../types'
import { statusClass } from '../../utils/reservation'

type StatusBadgeProps = {
  status: ReservationStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge ${statusClass(status)}`}>
      <span />
      {status}
    </span>
  )
}
