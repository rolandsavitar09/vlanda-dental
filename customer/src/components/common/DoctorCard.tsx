import type { Doctor } from '../../types'
import { DoctorAvatar } from './DoctorAvatar'
import { InfoLine } from './InfoLine'

type DoctorCardProps = {
  doctor: Doctor
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  return (
    <article className="doctor-card">
      <DoctorAvatar doctor={doctor} />
      <div className="doctor-info">
        <h3>{doctor.name}</h3>
        <span className="pill">{doctor.role}</span>
        <div className="doctor-schedule">
          {doctor.schedule.map((schedule) => (
            <InfoLine description={schedule.detail} icon="clock" key={schedule.day} title={schedule.day} />
          ))}
        </div>
      </div>
    </article>
  )
}
