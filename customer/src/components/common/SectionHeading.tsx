type SectionHeadingProps = {
  title: string
  description: string
}

export function SectionHeading({ description, title }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  )
}
