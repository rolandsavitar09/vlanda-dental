import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

const databaseUrl = process.env.TEST_DATABASE_URL
if (!databaseUrl) throw new Error('TEST_DATABASE_URL wajib menunjuk ke database pengujian terpisah')
const parsedUrl = new URL(databaseUrl)
if (!/(test|testing)/i.test(parsedUrl.pathname) || /neon\.tech/i.test(parsedUrl.hostname)) {
  throw new Error('Database ditolak: gunakan database lokal khusus test dengan nama mengandung test')
}

process.env.DATABASE_URL = databaseUrl
process.env.JWT_SECRET = 'concurrency-test-secret'
const { prisma } = await import('../dist/src/lib/prisma.js')
const { app } = await import('../dist/src/app.js')
const jwt = (await import('jsonwebtoken')).default

const suffix = randomUUID()
const userId = `test-user-${suffix}`
const doctorId = `test-doctor-${suffix}`
const categoryId = `test-category-${suffix}`
const serviceId = `test-service-${suffix}`
const day = new Date()
day.setUTCDate(day.getUTCDate() + 3)
day.setUTCHours(0, 0, 0, 0)
const date = day.toISOString().slice(0, 10)
const slots = ['10.00', '10.30']
const server = app.listen(0)

try {
  await prisma.user.create({ data: { id: userId, name: 'Concurrency Test', email: `${suffix}@test.invalid`, passwordHash: 'x' } })
  await prisma.doctor.create({ data: { id: doctorId, name: 'Concurrency Test Doctor' } })
  await prisma.serviceCategory.create({ data: { id: categoryId, name: `Test ${suffix}` } })
  await prisma.service.create({ data: { id: serviceId, categoryId, title: 'Test 1 hour', description: 'Test', estimatedDuration: '1 Jam' } })
  await prisma.doctorSchedule.createMany({ data: slots.map((time) => ({ doctorId, date: day, time, status: 'AVAILABLE' })) })

  const address = server.address()
  const token = jwt.sign({ userId, role: 'CUSTOMER' }, process.env.JWT_SECRET)
  const body = JSON.stringify({ serviceId, doctorId, date, time: slots[0] })
  const sendBooking = () => fetch(`http://127.0.0.1:${address.port}/api/reservations`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body,
  })
  const responses = await Promise.all([sendBooking(), sendBooking()])
  const codes = responses.map((response) => response.status).sort()
  assert.deepEqual(codes, [201, 409])

  const [reservations, claimedSlots, availableSlots] = await Promise.all([
    prisma.reservation.count({ where: { userId, doctorId, date: day, status: { not: 'CANCELLED' } } }),
    prisma.doctorSchedule.count({ where: { doctorId, date: day, time: { in: slots }, status: 'FULL' } }),
    prisma.doctorSchedule.count({ where: { doctorId, date: day, time: { in: slots }, status: 'AVAILABLE' } }),
  ])
  assert.equal(reservations, 1)
  assert.equal(claimedSlots, 2)
  assert.equal(availableSlots, 0)
  console.log('Concurrent booking OK: 1 sukses, 1 HTTP 409, 1 reservation, 2 slot terklaim.')
} finally {
  server.close()
  await prisma.reservation.deleteMany({ where: { userId } })
  await prisma.doctorSchedule.deleteMany({ where: { doctorId } })
  await prisma.service.deleteMany({ where: { id: serviceId } })
  await prisma.serviceCategory.deleteMany({ where: { id: categoryId } })
  await prisma.doctor.deleteMany({ where: { id: doctorId } })
  await prisma.user.deleteMany({ where: { id: userId } })
  await prisma.$disconnect()
}
