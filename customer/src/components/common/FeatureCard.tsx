import type { IconName } from '../../types'
import { Icon } from './Icon'

type FeatureCardProps = {
  description: string
  icon: IconName
  title: string
}

export function FeatureCard({ description, icon, title }: FeatureCardProps) {
  return (
    <article className="feature-card">
      <span className="round-icon">
        <Icon name={icon} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  )
}
