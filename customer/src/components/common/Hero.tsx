import type { ReactNode } from 'react'
import heroClinic from '../../assets/hero-clinic.png'
import iconPelayanan from '../../assets/Icon pelayanan.svg'
import iconSteril from '../../assets/Icon Steril.svg'
import vektorDokter from '../../assets/Vektor dokter.svg'

type HeroProps = {
  className?: string
  copy?: string
  eyebrow?: string
  secondaryHref?: string
  secondaryLabel?: string
  startReservation: () => void
  title?: ReactNode
}

const trustItems = [
  {
    icon: vektorDokter,
    title: 'Dokter Profesional',
    description: 'Berpengalaman',
  },
  {
    icon: iconSteril,
    title: 'Peralatan Modern',
    description: 'dan Steril',
  },
  {
    icon: iconPelayanan,
    title: 'Pelayanan Ramah',
    description: 'Untuk Semua Usia',
  },
]

export function Hero({
  className = '',
  copy = 'Vlanda Dental hadir untuk memberikan perawatan gigi yang nyaman, profesional, dan terpercaya untuk seluruh keluarga.',
  eyebrow = '#SenyumLebihBaik',
  secondaryHref = '#layanan-unggulan',
  secondaryLabel = 'Lihat Layanan',
  startReservation,
  title = 'Senyum Sehat Untuk Hari yang Lebih Baik',
}: HeroProps) {
  return (
    <section className={`hero-section ${className}`.trim()}>
      <img className="hero-image" src={heroClinic} alt="Ruang perawatan gigi modern Vlanda Dental" />
      <div className="hero-overlay">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="hero-copy">{copy}</p>
        <div className="hero-actions">
          <button className="primary-button" type="button" onClick={startReservation}>
            Reservasi Sekarang
          </button>
          <a className="secondary-button" href={secondaryHref}>
            {secondaryLabel}
          </a>
        </div>
        <div className="trust-strip">
          {trustItems.map((item) => (
            <TrustItem
              description={item.description}
              icon={item.icon}
              key={item.title}
              title={item.title}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function TrustItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="trust-item">
      <span className="trust-icon">
        <img src={icon} alt="" />
      </span>
      <div>
        <strong>{title}</strong>
        <small>{description}</small>
      </div>
    </div>
  )
}
