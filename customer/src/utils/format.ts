export function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

export function getInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'C'
}

export function getShortName(name: string) {
  return name.trim().split(' ')[0] || 'Customer'
}
