type FallbackPageProps = {
  actionLabel: string
  description: string
  onAction: () => void
  title: string
}

export function FallbackPage({ actionLabel, description, onAction, title }: FallbackPageProps) {
  return (
    <section className="content-section fallback-page">
      <div className="fallback-card">
        <span>404</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <button className="primary-button" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      </div>
    </section>
  )
}
