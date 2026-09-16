type ProfileFieldProps = {
  label: string
  value: string
}

export function ProfileField({ label, value }: ProfileFieldProps) {
  return (
    <div className="profile-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
