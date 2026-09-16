import type { IconName } from '../../types'
import { Icon } from './Icon'

type InfoLineProps = {
  description: string
  icon: IconName
  title: string
}

export function InfoLine({ description, icon, title }: InfoLineProps) {
  return (
    <div className="info-line">
      <Icon name={icon} />
      <div>
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
    </div>
  )
}
