import iconMengapa from '../../assets/Icon mengapa milih kami.svg'
import iconGigiAnak from '../../assets/Vector Gigi Anak.svg'
import iconGigiDewasa from '../../assets/Vector Gigi Dewasa.svg'
import iconGigiTiruan from '../../assets/Vector Gigi Tiruan.svg'
import iconKonsultasi from '../../assets/Vektor konsultasi.svg'
import iconLingkungan from '../../assets/Vector Lingkungan Nyaman.svg'
import iconOrthodonti from '../../assets/Vector Orthodonti.svg'
import iconPemeriksaan from '../../assets/Icon pemeriksaan gigi.svg'
import iconPelayananRamah from '../../assets/Vektor pelayanan ramah.svg'
import iconTeknologi from '../../assets/Vektor teknologi modern.svg'
import iconTenaga from '../../assets/Vector tenaga profesional.svg'
import kursiJamOperasional from '../../assets/clinic-hours-optimized.jpg'
import vectorGarisTiga from '../../assets/Vector garis tiga.svg'
import vectorPerawatanSemuaUsia from '../../assets/Vector perawatan gigi untuk semua usia.svg'
import { ArticleCard } from '../../components/common/ArticleCard'
import { ConsultationBanner } from '../../components/common/ConsultationBanner'
import { DoctorCard } from '../../components/common/DoctorCard'
import { Hero } from '../../components/common/Hero'
import { Icon } from '../../components/common/Icon'
import { MapFrame } from '../../components/common/MapFrame'
import { SectionHeading } from '../../components/common/SectionHeading'
import type { Article, Doctor, Service } from '../../types'

type BerandaProps = {
  articles: Article[]
  openArticleDetail: (articleId: string) => void
  openArticles: () => void
  openServiceDetail: (serviceId: string) => void
  doctors: Doctor[]
  services: Service[]
  startReservation: (serviceId?: string) => void
}

const featuredServiceIcons: Record<string, string> = {
  'pemeriksaan-klinis': iconPemeriksaan,
  'orthodonti-classic': iconOrthodonti,
  crown: iconGigiTiruan,
  scaling: iconGigiDewasa,
  'pemeriksaan-anak': iconGigiAnak,
  'konsultasi-gigi': iconKonsultasi,
}

const whyItems = [
  {
    icon: iconTenaga,
    title: 'Tenaga Profesional',
    description: 'Didukung dokter gigi berpengalaman.',
  },
  {
    icon: iconTeknologi,
    title: 'Teknologi Modern',
    description: 'Menggunakan peralatan dental terbaru.',
  },
  {
    icon: iconLingkungan,
    title: 'Lingkungan Nyaman',
    description: 'Klinik bersih, aman, dan menenangkan.',
  },
  {
    icon: iconPelayananRamah,
    title: 'Pelayanan Ramah',
    description: 'Tim siap membantu dengan sepenuh hati.',
  },
]

export function Beranda({
  articles,
  openArticleDetail,
  openArticles,
  openServiceDetail,
  doctors,
  services,
  startReservation,
}: BerandaProps) {
  const featured = [
    'pemeriksaan-klinis',
    'orthodonti-classic',
    'crown',
    'scaling',
    'pemeriksaan-anak',
    'konsultasi-gigi',
  ]
    .map((id) => services.find((service) => service.id === id))
    .filter((service): service is Service => Boolean(service))

  return (
    <>
      <Hero startReservation={() => startReservation()} />

      <section className="content-section" id="layanan-unggulan">
        <SectionHeading
          title="Layanan Unggulan Kami"
          description="Berbagai layanan perawatan gigi untuk memenuhi kebutuhan Anda dan keluarga."
        />
        <div className="service-highlight-grid">
          {featured.map((service) => (
            <button
              className="service-highlight"
              key={service.id}
              type="button"
              onClick={() => openServiceDetail(service.id)}
            >
              <span className="featured-service-icon">
                <img src={featuredServiceIcons[service.id]} alt="" />
              </span>
              <span className="service-highlight-text">
                <strong>{service.title}</strong>
                <small>{service.description}</small>
              </span>
              <span className="mini-arrow">
                <Icon name="arrow" />
              </span>
            </button>
          ))}
        </div>
      </section>

      <ConsultationBanner startReservation={() => startReservation('konsultasi-gigi')} />

      <section className="content-section compact-section">
        <div className="why-heading">
          <span className="why-heading-icon">
            <img src={iconMengapa} alt="" />
          </span>
          <SectionHeading
            title="Mengapa Memilih Vlanda Dental?"
            description="Kami berkomitmen memberikan pengalaman perawatan gigi yang terbaik."
          />
        </div>
        <div className="why-grid">
          {whyItems.map((item) => (
            <article className="why-card" key={item.title}>
              <span className="why-card-icon">
                <img src={item.icon} alt="" />
              </span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section doctor-section">
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

      <section className="content-section">
        <div className="hours-banner">
          <div className="hours-content">
            <h2>Jam Operasional Klinik</h2>
            <p>Kami siap melayani Anda dengan sepenuh hati.</p>
            <div className="hours-list">
              <div className="hours-item">
                <span className="hours-clock">
                  <Icon name="clock" />
                </span>
                <div>
                  <strong>Senin - Jum’at</strong>
                  <span>15.30 WIB - 20.30 WIB</span>
                </div>
              </div>
              <div className="hours-item">
                <span className="hours-clock">
                  <Icon name="clock" />
                </span>
                <div>
                  <strong>Sabtu - Minggu</strong>
                  <span>07.30 WIB - 12.00 WIB</span>
                  <span>15.30 WIB - 20.30 WIB</span>
                </div>
              </div>
            </div>
            <button className="light-button" type="button" onClick={() => startReservation()}>
              Reservasi Sekarang <Icon name="arrow" />
            </button>
          </div>
          <div className="hours-visual">
            <img
              className="hours-image"
              src={kursiJamOperasional}
              alt="Ruang klinik Vlanda Dental"
              loading="lazy"
              decoding="async"
            />
            <div className="hours-frost">
              <img className="hours-lines" src={vectorGarisTiga} alt="" />
              <strong>
                Perawatan
                <br />
                Gigi untuk
                <br />
                Semua Usia
              </strong>
              <img className="hours-tooth" src={vectorPerawatanSemuaUsia} alt="" />
            </div>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="article-preview-heading">
          <SectionHeading title="Artikel Terbaru" description="Tips dan informasi seputar kesehatan gigi." />
          <button className="outline-button article-more-button" type="button" onClick={openArticles}>
            Selengkapnya <Icon name="arrow" />
          </button>
        </div>
        <div className="article-preview-grid">
          {articles.length === 0 ? (
            <p className="empty-state">Belum ada artikel terbaru.</p>
          ) : null}
          {articles.slice(0, 3).map((article) => (
            <ArticleCard article={article} key={article.id} onOpen={openArticleDetail} />
          ))}
        </div>
      </section>

      <section className="content-section location-section">
        <SectionHeading
          title="Lokasi Kami"
          description="Jl. ayam alas RT 3 / RW 1, Mantup tengah, Kec. Mantup, Kab. Lamongan."
        />
        <MapFrame />
      </section>
    </>
  )
}
