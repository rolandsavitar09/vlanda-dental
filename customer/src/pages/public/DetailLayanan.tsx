import { InfoLine } from '../../components/common/InfoLine'
import type { Service, ServiceCategory } from '../../types'

type DetailLayananProps = {
  goBack: () => void
  service: Service
  serviceCategories: ServiceCategory[]
  startReservation: (serviceId?: string) => void
}

export function DetailLayanan({ goBack, service, serviceCategories, startReservation }: DetailLayananProps) {
  const category = serviceCategories.find((item) => item.id === service.categoryId)

  return (
    <section className="content-section detail-page">
      <p className="breadcrumb">Beranda &gt; Layanan &gt; {service.title}</p>
      <button className="outline-button detail-back-button" type="button" onClick={goBack}>
        Kembali
      </button>
      <div className="detail-hero">
        <div>
          <span className="pill">{category?.title}</span>
          <h1>{service.title}</h1>
          <p>{service.description}</p>
          <div className="detail-meta">
            <InfoLine icon="clock" title="Estimasi Durasi" description={service.duration} />
            <InfoLine icon="check" title="Biaya" description={service.price} />
          </div>
          <button className="primary-button" type="button" onClick={() => startReservation(service.id)}>
            Reservasi Layanan Ini
          </button>
        </div>
        <div className="detail-panel">
          <h2>Yang perlu disiapkan</h2>
          <ul>
            <li>Ceritakan keluhan utama dengan jelas saat data diri.</li>
            <li>Datang sesuai jadwal setelah reservasi dikonfirmasi admin.</li>
            <li>Admin dapat menghubungi Anda bila jadwal perlu disesuaikan.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
