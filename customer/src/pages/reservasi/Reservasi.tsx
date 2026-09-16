import { useState } from 'react'
import { DoctorAvatar } from '../../components/common/DoctorAvatar'
import { Icon } from '../../components/common/Icon'
import { SectionHeading } from '../../components/common/SectionHeading'
import { ReservationSummary } from '../../components/reservation/ReservationSummary'
import iconGigiAnak from '../../assets/Vector Gigi Anak.svg'
import iconGigiDewasa from '../../assets/Vector Gigi Dewasa.svg'
import iconGigiTiruan from '../../assets/Vector Gigi Tiruan.svg'
import iconOrthodonti from '../../assets/Vector Orthodonti.svg'
import iconPemeriksaan from '../../assets/Icon pemeriksaan gigi.svg'
import type { Doctor, ReservationDraft, ReservationTimeOption, ServiceCategory } from '../../types'
import type { ApiSchedule } from '../../services/api'
import { formatDate } from '../../utils/format'
import { validateReservationStep } from '../../utils/reservation'

type ReservasiProps = {
  draft: ReservationDraft
  doctors: Doctor[]
  goBack: () => void
  isLoadingSchedules: boolean
  isSubmitting: boolean
  reservationError: string
  reservationStep: number
  schedules: ApiSchedule[]
  serviceCategories: ServiceCategory[]
  setDraft: (draft: ReservationDraft | ((draft: ReservationDraft) => ReservationDraft)) => void
  setReservationStep: (step: number) => void
  submitReservation: () => void
}

const steps = ['Pilih Layanan', 'Pilih Dokter', 'Pilih Tanggal', 'Pilih Jam', 'Data Diri', 'Konfirmasi']

const serviceCategoryIcons: Record<string, string> = {
  'adult-care': iconGigiDewasa,
  consultation: iconPemeriksaan,
  dentures: iconGigiTiruan,
  'kids-care': iconGigiAnak,
  orthodonti: iconOrthodonti,
}

export function Reservasi({
  draft,
  doctors,
  goBack,
  isLoadingSchedules,
  isSubmitting,
  reservationError,
  reservationStep,
  schedules,
  serviceCategories,
  setDraft,
  setReservationStep,
  submitReservation,
}: ReservasiProps) {
  const [maxUnlockedStep, setMaxUnlockedStep] = useState(0)
  const allServices = serviceCategories.flatMap((category) => category.services)
  const selectedService = allServices.find((service) => service.id === draft.serviceId) ?? allServices[0]
  const selectedDoctor = doctors.find((doctor) => doctor.id === draft.doctorId) ?? doctors[0]
  const doctorSlots = schedules.filter(
    (schedule) => schedule.doctorId === draft.doctorId && schedule.status !== 'OFF',
  )
  const availableDates = Array.from(
    new Set(doctorSlots.map((schedule) => schedule.date.slice(0, 10))),
  ).sort()
  const availableTimes = doctorSlots
    .filter((schedule) => schedule.date.slice(0, 10) === draft.date)
    .sort((first, second) => first.time.localeCompare(second.time))
    .map<ReservationTimeOption>((schedule) => ({ id: schedule.id, status: schedule.status, time: schedule.time }))
  const isLastStep = reservationStep === steps.length - 1
  const canContinue =
    validateReservationStep(reservationStep, draft) &&
    (reservationStep !== 0 || allServices.some((service) => service.id === draft.serviceId)) &&
    (reservationStep !== 1 || doctors.some((doctor) => doctor.id === draft.doctorId))
  const unlockNextStep = () => {
    const nextStep = Math.min(steps.length - 1, reservationStep + 1)
    setMaxUnlockedStep((currentStep) => Math.max(currentStep, nextStep))
    setReservationStep(nextStep)
  }
  const lockAfterStep = (step: number) => {
    setMaxUnlockedStep((currentStep) => Math.min(currentStep, step))
  }

  return (
    <section className="content-section reservation-page">
      <button className="outline-button reservation-back-button" type="button" onClick={goBack}>
        Kembali
      </button>
      <SectionHeading
        title="Reservasi"
        description="Jadwal yang Anda pilih akan dikirim ke admin dan masuk sebagai Menunggu Konfirmasi."
      />

      <div className="stepper">
        {steps.map((label, index) => {
          const canOpenStep = index <= maxUnlockedStep

          return (
            <button
              className={[
                index === reservationStep ? 'active' : '',
                index < reservationStep && canOpenStep ? 'done' : '',
                !canOpenStep ? 'locked' : '',
              ].filter(Boolean).join(' ')}
              disabled={!canOpenStep}
              key={label}
              type="button"
              onClick={() => setReservationStep(index)}
            >
              <span>{index + 1}</span>
              {label}
            </button>
          )
        })}
      </div>

      <div className="reservation-card">
        {reservationError ? <p className="reservation-error">{reservationError}</p> : null}

        {reservationStep === 0 ? (
          <div className="reservation-service-groups">
            {serviceCategories.map((category) => (
              <div className="reservation-service-group" key={category.id}>
                <div className="reservation-service-heading">
                  <span className="round-icon">
                    <img src={category.iconUrl || serviceCategoryIcons[category.id] || iconPemeriksaan} alt="" />
                  </span>
                  <h3>{category.title}</h3>
                </div>
                <div className="reservation-service-list">
                  {category.services.map((service) => (
                    <div
                      className={draft.serviceId === service.id ? 'choice-card active' : 'choice-card'}
                      key={service.id}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setDraft({ ...draft, serviceId: service.id })
                          lockAfterStep(0)
                        }
                      }}
                      onClick={() => {
                        setDraft({ ...draft, serviceId: service.id })
                        lockAfterStep(0)
                      }}
                    >
                      <strong>{service.title}</strong>
                      <small>{service.description}</small>
                      <span>Estimasi {service.duration}</span>
                      {draft.serviceId === service.id ? (
                        <button
                          className="service-confirm-button"
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            setMaxUnlockedStep((currentStep) => Math.max(currentStep, 1))
                            setReservationStep(1)
                          }}
                        >
                          Konfirmasi
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {reservationStep === 1 ? (
          <div className="doctor-grid reservation-doctor-grid">
            {doctors.length === 0 ? (
              <p className="empty-state">Belum ada dokter tersedia.</p>
            ) : null}
            {doctors.map((doctor) => (
              <button
                className={draft.doctorId === doctor.id ? 'doctor-choice active' : 'doctor-choice'}
                key={doctor.id}
                type="button"
                onClick={() => {
                  setDraft({ ...draft, doctorId: doctor.id, date: '', scheduleId: '', time: '' })
                  lockAfterStep(1)
                }}
              >
                <DoctorAvatar doctor={doctor} />
                <strong>{doctor.name}</strong>
                <span>{doctor.role}</span>
                <div className="doctor-choice-schedule">
                  {doctor.schedule.map((schedule) => (
                    <small key={schedule.day}>
                      <b>{schedule.day}</b>
                      <span>{schedule.detail}</span>
                    </small>
                  ))}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {reservationStep === 2 ? (
          <div className="date-grid">
            {isLoadingSchedules ? <p className="empty-state">Memuat jadwal dokter...</p> : null}
            {!isLoadingSchedules && availableDates.length === 0 ? (
              <p className="empty-state">Belum ada jadwal tersedia untuk dokter ini.</p>
            ) : null}
            {availableDates.map((date) => (
              <button
                className={draft.date === date ? 'date-choice active' : 'date-choice'}
                key={date}
                type="button"
                onClick={() => {
                  setDraft({ ...draft, date, scheduleId: '', time: '' })
                  lockAfterStep(2)
                }}
              >
                <Icon name="calendar" />
                <strong>{formatDate(date)}</strong>
                <span>
                  {doctorSlots.some(
                    (schedule) => schedule.date.slice(0, 10) === date && schedule.status === 'AVAILABLE',
                  )
                    ? 'Tersedia'
                    : 'Penuh'}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {reservationStep === 3 ? (
          <div className="time-grid">
            {availableTimes.length === 0 ? (
              <p className="empty-state">Belum ada jam tersedia untuk tanggal ini.</p>
            ) : null}
            {availableTimes.map((option) => (
              <button
                className={[
                  draft.scheduleId === option.id ? 'time-choice active' : 'time-choice',
                  option.status !== 'AVAILABLE' ? 'unavailable' : '',
                ].filter(Boolean).join(' ')}
                disabled={option.status !== 'AVAILABLE'}
                key={option.id}
                type="button"
                onClick={() => {
                  setDraft({ ...draft, scheduleId: option.id, time: option.time })
                  lockAfterStep(3)
                }}
              >
                <Icon name="clock" />
                {option.time}
                {option.status !== 'AVAILABLE' ? <small>Penuh</small> : null}
              </button>
            ))}
          </div>
        ) : null}

        {reservationStep === 4 ? (
          <div className="form-grid">
            <label>
              Nama Lengkap
              <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </label>
            <label>
              Email
              <input
                type="email"
                value={draft.email}
                onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              />
            </label>
            <label>
              Nomor Telepon
              <input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
            </label>
            <label>
              Tanggal Lahir
              <input
                type="date"
                value={draft.birthDate}
                onChange={(event) => setDraft({ ...draft, birthDate: event.target.value })}
              />
            </label>
            <label className="full-field">
              Keluhan
              <textarea
                placeholder="Ceritakan keluhan Anda"
                value={draft.complaint}
                onChange={(event) => setDraft({ ...draft, complaint: event.target.value })}
              />
            </label>
          </div>
        ) : null}

        {reservationStep === 5 ? (
          <div className="confirmation-grid">
            <ReservationSummary
              doctorName={selectedDoctor?.name ?? 'Dokter belum dipilih'}
              serviceTitle={selectedService?.title ?? 'Layanan belum dipilih'}
              date={draft.date}
              time={draft.time}
              status="Menunggu Konfirmasi"
              complaint={draft.complaint || 'Belum ada keluhan tambahan.'}
            />
            <div className="confirmation-note">
              <Icon name="shield" />
              <h3>Belum otomatis diterima</h3>
              <p>
                Setelah dikirim, reservasi masuk ke admin/CS untuk pengecekan jadwal.
                Customer dapat melihat perubahan status di Riwayat Reservasi.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="reservation-actions">
        <button
          className="outline-button"
          type="button"
          disabled={reservationStep === 0}
          onClick={() => setReservationStep(Math.max(0, reservationStep - 1))}
        >
          Kembali
        </button>
        <button
          className="primary-button"
          type="button"
          disabled={!canContinue || isSubmitting}
          onClick={() => {
            if (isLastStep) {
              submitReservation()
            } else {
              unlockNextStep()
            }
          }}
        >
          {isLastStep ? (isSubmitting ? 'Mengirim...' : 'Kirim Reservasi') : 'Lanjut'}
        </button>
      </div>
    </section>
  )
}
