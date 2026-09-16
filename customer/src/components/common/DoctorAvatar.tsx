import type { Doctor } from '../../types'

type DoctorAvatarProps = {
  doctor: Doctor
}

export function DoctorAvatar({ doctor }: DoctorAvatarProps) {
  return (
    <div className="doctor-avatar" aria-label={doctor.name}>
      {doctor.photo ? <img src={doctor.photo} alt={doctor.name} /> : <span>{doctor.initials}</span>}
    </div>
  )
}
