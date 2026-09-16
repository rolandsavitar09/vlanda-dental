import type { Doctor } from '../types'

const dayIndexByName: Record<string, number> = {
  Minggu: 0,
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
}

export function getAvailableDatesForDoctor(doctor: Doctor, totalDates = 6) {
  const practiceDays = getPracticeDays(doctor)
  const dates: string[] = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  cursor.setDate(cursor.getDate() + 1)

  while (dates.length < totalDates) {
    if (practiceDays.has(cursor.getDay())) {
      dates.push(toDateInputValue(cursor))
    }

    cursor.setDate(cursor.getDate() + 1)
  }

  return dates
}

function getPracticeDays(doctor: Doctor) {
  const days = new Set<number>()

  doctor.schedule.forEach((schedule) => {
    if (schedule.day.includes(' - ')) {
      const [startDay, endDay] = schedule.day.split(' - ')
      const startIndex = dayIndexByName[startDay]
      const endIndex = dayIndexByName[endDay]

      if (startIndex === undefined || endIndex === undefined) {
        return
      }

      let index = startIndex
      while (true) {
        days.add(index)
        if (index === endIndex) {
          break
        }
        index = (index + 1) % 7
      }

      return
    }

    const dayIndex = dayIndexByName[schedule.day]
    if (dayIndex !== undefined) {
      days.add(dayIndex)
    }
  })

  return days
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const availableTimes = ['08.00', '09.30', '10.30', '15.30', '16.30', '18.30', '19.30']
