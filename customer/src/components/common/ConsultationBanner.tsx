import consultationBanner from '../../assets/consultation-banner-optimized.jpg'
import { Icon } from './Icon'

type ConsultationBannerProps = {
  className?: string
  startReservation: () => void
}

export function ConsultationBanner({ className = '', startReservation }: ConsultationBannerProps) {
  return (
    <section className={`content-section ${className}`.trim()}>
      <div className="consultation-banner">
        <img
          src={consultationBanner}
          alt="Pasien tersenyum setelah konsultasi gigi"
          loading="lazy"
          decoding="async"
        />
        <div>
          <h2>
            Konsultasi Gigi
            <br />
            Sekarang!
          </h2>
          <p>Tanyakan keluhan gigi Anda secara langsung dengan dokter kami.</p>
          <button className="light-button consultation-button" type="button" onClick={startReservation}>
            Reservasi Sekarang <Icon name="arrow" />
          </button>
        </div>
      </div>
    </section>
  )
}
