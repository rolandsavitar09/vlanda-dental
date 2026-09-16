import type { Service } from '../../types'
import { Icon } from './Icon'

type ServiceRowProps = {
  openServiceDetail: (serviceId: string) => void
  service: Service
}

export function ServiceRow({ openServiceDetail, service }: ServiceRowProps) {
  return (
    <div className="service-row">
      <div>
        <strong>{service.title}</strong>
        <p>{service.description}</p>
      </div>
      <span>{service.duration}</span>
      <button className="outline-button small" type="button" onClick={() => openServiceDetail(service.id)}>
        Lihat Detail <Icon name="arrow" />
      </button>
    </div>
  )
}
