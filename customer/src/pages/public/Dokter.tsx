import { ConsultationBanner } from '../../components/common/ConsultationBanner'
import { DoctorCard } from '../../components/common/DoctorCard'
import { Hero } from '../../components/common/Hero'
import { SectionHeading } from '../../components/common/SectionHeading'
import iconGigiAnak from '../../assets/Vector Gigi Anak.svg'
import iconKalender from '../../assets/Vector kalender ijo.svg'
import iconMilihDokter from '../../assets/Vector milih dokter.svg'
import type { Doctor } from '../../types'

type DokterProps = {
  doctors: Doctor[]
  startReservation: (serviceId?: string) => void
}

export function Dokter({ doctors, startReservation }: DokterProps) {
  return (
    <>
      <Hero
        className="doctor-hero"
        copy="Kenali dokter gigi Vlanda Dental yang siap membantu perawatan Anda dengan ramah, teliti, dan profesional."
        startReservation={() => startReservation()}
        title={
          <>
            Dokter Gigi Kami
            <br />
            Siap Merawat
            <br />
            Senyum Anda
          </>
        }
      />
      <section className="content-section dokter-page-section dokter-list-section">
        <SectionHeading
          title="Dokter Kami"
          description="Didukung oleh dokter gigi profesional dan berpengalaman."
        />
        <div className="doctor-grid">
          {doctors.map((doctor) => (
            <DoctorCard doctor={doctor} key={doctor.id} />
          ))}
        </div>
      </section>
      <ConsultationBanner className="doctor-consultation-section" startReservation={() => startReservation('konsultasi-gigi')} />
      <section className="content-section dokter-page-section doctor-faq-section">
        <SectionHeading
          title="Pertanyaan Seputar Dokter"
          description="Beberapa pertanyaan yang sering ditanyakan oleh pasien."
        />
        <div className="faq-grid">
          <DoctorFaqCard
            icon={iconMilihDokter}
            title="Apakah bisa memilih dokter?"
            description="Bisa, selama jadwal dokter masih tersedia."
          />
          <DoctorFaqCard
            icon={iconKalender}
            title="Apakah jadwal dokter bisa berubah?"
            description="Bisa. Admin akan mengonfirmasi jadwal final melalui WhatsApp."
          />
          <DoctorFaqCard
            icon={iconGigiAnak}
            title="Apakah melayani pasien anak?"
            description="Ya, pasien anak dilayani dengan pendekatan yang ramah."
          />
        </div>
      </section>
    </>
  )
}

type DoctorFaqCardProps = {
  description: string
  icon: string
  title: string
}

function DoctorFaqCard({ description, icon, title }: DoctorFaqCardProps) {
  return (
    <article className="doctor-faq-card">
      <span className="round-icon">
        <img src={icon} alt="" />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  )
}
