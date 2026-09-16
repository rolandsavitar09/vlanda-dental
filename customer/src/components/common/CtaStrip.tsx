import calendarVector from '../../assets/Vector kalender.svg'
import { Icon } from './Icon'

type CtaStripProps = {
  startReservation: () => void
}

export function CtaStrip({ startReservation }: CtaStripProps) {
  return (
    <section className="content-section">
      <div className="cta-strip">
        <span className="round-icon">
          <img className="cta-calendar-icon" src={calendarVector} alt="" />
        </span>
        <div>
          <h2>Siap Merawat Senyum Anda?</h2>
          <p>Reservasi sekarang dan dapatkan pelayanan terbaik dari dokter kami.</p>
        </div>
        <button className="light-button" type="button" onClick={startReservation}>
          Reservasi Sekarang <Icon name="arrow" />
        </button>
      </div>
    </section>
  )
}
