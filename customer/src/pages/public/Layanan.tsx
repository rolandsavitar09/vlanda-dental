import { CtaStrip } from '../../components/common/CtaStrip'
import { Hero } from '../../components/common/Hero'
import { SectionHeading } from '../../components/common/SectionHeading'
import { ServiceRow } from '../../components/common/ServiceRow'
import iconGigiAnak from '../../assets/Vector Gigi Anak.svg'
import iconGigiDewasa from '../../assets/Vector Gigi Dewasa.svg'
import iconGigiTiruan from '../../assets/Vector Gigi Tiruan.svg'
import iconHeadset from '../../assets/Vector headset.svg'
import iconMenu from '../../assets/Vector menu.svg'
import iconOrthodonti from '../../assets/Vector Orthodonti.svg'
import iconPemeriksaan from '../../assets/Icon pemeriksaan gigi.svg'
import whatsappLogo from '../../assets/Logo Whatsapp.svg'
import type { ServiceCategory } from '../../types'

type LayananProps = {
  activeCategoryId: string
  openServiceDetail: (serviceId: string) => void
  search: string
  serviceCategories: ServiceCategory[]
  setActiveCategoryId: (categoryId: string) => void
  setSearch: (search: string) => void
  startReservation: (serviceId?: string) => void
}

const serviceCategoryIcons: Record<string, string> = {
  'adult-care': iconGigiDewasa,
  consultation: iconPemeriksaan,
  dentures: iconGigiTiruan,
  'kids-care': iconGigiAnak,
  orthodonti: iconOrthodonti,
}

export function Layanan({
  activeCategoryId,
  openServiceDetail,
  search,
  serviceCategories,
  setActiveCategoryId,
  setSearch,
  startReservation,
}: LayananProps) {
  const query = search.trim().toLowerCase()
  const whatsappUrl = 'https://wa.me/6281335455194'
  const visibleCategories = serviceCategories
    .filter((category) => activeCategoryId === 'all' || category.id === activeCategoryId)
    .map((category) => ({
      ...category,
      services: category.services.filter(
        (service) =>
          service.title.toLowerCase().includes(query) ||
          service.description.toLowerCase().includes(query),
      ),
    }))
    .filter((category) => !query || category.services.length > 0)

  return (
    <>
      <Hero
        copy="Pilih perawatan gigi sesuai kebutuhan Anda, ditangani dokter profesional dengan peralatan modern dan steril."
        secondaryHref="#daftar-layanan"
        startReservation={() => startReservation()}
        title="Layanan Gigi Untuk Senyum yang Lebih Sehat"
      />
      <section className="content-section page-layout layanan-page" id="daftar-layanan">
        <aside className="service-sidebar">
          <strong>Daftar Kategori</strong>
          <button
            className={activeCategoryId === 'all' ? 'active' : ''}
            type="button"
            onClick={() => setActiveCategoryId('all')}
          >
            <CategoryIcon icon={iconMenu} />
            Semua
          </button>
          {serviceCategories.map((category) => (
            <button
              className={activeCategoryId === category.id ? 'active' : ''}
              key={category.id}
              type="button"
              onClick={() => setActiveCategoryId(category.id)}
            >
              <CategoryIcon category={category} icon={serviceCategoryIcons[category.id]} />
              {category.title}
            </button>
          ))}
          <div className="help-box">
            <span className="help-icon">
              <img src={iconHeadset} alt="" />
            </span>
            <div>
              <strong>Butuh Bantuan?</strong>
              <p>Konsultasikan dengan tim kami melalui whatsApp.</p>
            </div>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              <img src={whatsappLogo} alt="" />
              Chat WhatsApp
            </a>
          </div>
        </aside>

        <div className="service-list-area">
          <div className="list-toolbar">
            <div>
              <p className="breadcrumb">Beranda &gt; Layanan</p>
              <SectionHeading
                title="Daftar Layanan"
                description="Pilih layanan sesuai kebutuhan Anda. Klik detail untuk informasi lengkap."
              />
            </div>
            <label className="search-box">
              <span>Cari layanan</span>
              <input
                type="search"
                placeholder="Cari layanan..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="service-group-grid">
            {visibleCategories.map((category) => (
                <div className="service-group highlighted" key={category.id}>
                  <div className="service-group-heading">
                    <span className="round-icon">
                      <CategoryIcon category={category} icon={serviceCategoryIcons[category.id]} />
                    </span>
                    <h3>{category.title}</h3>
                    <span className="service-estimate-label">Estimasi Durasi</span>
                  </div>
                  <div className="service-row-list">
                    {category.services.map((service) => (
                      <ServiceRow key={service.id} openServiceDetail={openServiceDetail} service={service} />
                    ))}
                  </div>
                </div>
            ))}
          </div>
        </div>
      </section>
      <CtaStrip startReservation={() => startReservation()} />
    </>
  )
}

function CategoryIcon({ category, icon }: { category?: ServiceCategory; icon?: string }) {
  return <img className="service-category-icon" src={category?.iconUrl || icon || iconPemeriksaan} alt="" />
}
