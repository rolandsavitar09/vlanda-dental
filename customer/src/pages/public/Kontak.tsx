import { InfoLine } from '../../components/common/InfoLine'
import { MapFrame } from '../../components/common/MapFrame'
import { SectionHeading } from '../../components/common/SectionHeading'

type KontakProps = {
  startReservation: () => void
}

export function Kontak({ startReservation }: KontakProps) {
  return (
    <section className="content-section contact-page">
      <SectionHeading
        title="Kontak Vlanda Dental"
        description="Hubungi kami untuk bantuan jadwal, layanan, atau informasi reservasi."
      />
      <div className="contact-grid">
        <div className="contact-card contact-info-card">
          <div className="contact-info-list">
            <InfoLine
              icon="location"
              title="Alamat"
              description="Jl. ayam alas RT 3 / RW 1, Mantup tengah, Kec. Mantup, Kab. Lamongan"
            />
            <InfoLine icon="phone" title="Telepon" description="081335455194" />
            <InfoLine icon="clock" title="Senin - Jumat" description="15.30 WIB - 20.30 WIB" />
            <InfoLine icon="clock" title="Sabtu - Minggu" description="07.30 WIB - 12.00 WIB dan 15.30 WIB - 20.30 WIB" />
          </div>
          <button className="primary-button" type="button" onClick={startReservation}>
            Reservasi Sekarang
          </button>
        </div>
      </div>
      <MapFrame />
    </section>
  )
}
