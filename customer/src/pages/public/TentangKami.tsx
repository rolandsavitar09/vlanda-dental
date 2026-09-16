import { CtaStrip } from '../../components/common/CtaStrip'
import { FeatureCard } from '../../components/common/FeatureCard'
import { Hero } from '../../components/common/Hero'
import { SectionHeading } from '../../components/common/SectionHeading'

type TentangKamiProps = {
  startReservation: () => void
}

export function TentangKami({ startReservation }: TentangKamiProps) {
  return (
    <>
      <Hero
        copy="Kami menghadirkan perawatan gigi keluarga yang nyaman, jelas, dan didampingi tim profesional."
        startReservation={startReservation}
        title={
          <>
            Mengenal Vlanda
            <br />
            Dental Lebih
            <br />
            Dekat
          </>
        }
      />
      <section className="content-section about-grid about-page">
        <div className="about-copy">
          <SectionHeading
            title="Tentang Kami"
            description="Vlanda Dental adalah klinik gigi keluarga di Mantup, Lamongan yang menghadirkan perawatan nyaman, jelas, dan sesuai kebutuhan pasien."
          />
          <p className="body-copy">
            Setiap reservasi masuk sebagai Menunggu Konfirmasi agar admin dapat memastikan
            ketersediaan dokter, layanan, dan jam praktik sebelum jadwal diterima.
          </p>
        </div>
        <div className="values-panel about-values">
          <FeatureCard icon="heart" title="Klinik Gigi Keluarga" description="Ramah untuk pasien dewasa dan anak." />
          <FeatureCard icon="check" title="Reservasi Terarah" description="Customer dapat memilih layanan, dokter, tanggal, dan jam." />
          <FeatureCard icon="shield" title="Konfirmasi Admin" description="Jadwal final diverifikasi sebelum diterima." />
          <FeatureCard icon="calendar" title="Riwayat Reservasi" description="Status reservasi dapat dipantau setelah login." />
        </div>
      </section>
      <CtaStrip startReservation={startReservation} />
    </>
  )
}
