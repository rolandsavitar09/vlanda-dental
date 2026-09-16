import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { ApiError } from '../middleware/error.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getParam } from '../utils/request.js'

export const schedulesRouter = Router()

const withScheduleBooking = {
  doctor: true,
  reservations: {
    where: { status: { not: 'CANCELLED' } },
    include: {
      service: true,
      user: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  },
} as const

type ScheduleWithBooking = Awaited<ReturnType<typeof prisma.doctorSchedule.findMany>>[number] & {
  reservations: Array<{
    id: string
    code: string | null
    service: { title: string }
    user: { name: string }
  }>
}

const attachComputedBooking = async (schedules: ScheduleWithBooking[]) => {
  const reservationIds = schedules
    .map((schedule) => schedule.note)
    .filter((id): id is string => Boolean(id))
  const reservations = reservationIds.length > 0
    ? await prisma.reservation.findMany({
        where: { id: { in: reservationIds }, status: { not: 'CANCELLED' } },
        include: { service: true, user: true },
      })
    : []
  const reservationById = new Map(reservations.map((reservation) => [reservation.id, reservation]))

  return schedules.map((schedule) => {
    const scheduleReservations =
      schedule.reservations.length > 0
        ? schedule.reservations
        : schedule.note && reservationById.has(schedule.note)
          ? [reservationById.get(schedule.note)]
          : []

    return {
      ...schedule,
      reservations: scheduleReservations,
      status:
        schedule.status === 'OFF'
          ? 'OFF'
          : scheduleReservations.length > 0 || schedule.status === 'FULL'
            ? 'FULL'
            : 'AVAILABLE',
    }
  })
}

schedulesRouter.get(
  '/admin',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const doctorId = typeof req.query.doctorId === 'string' ? req.query.doctorId : undefined
    const status = typeof req.query.status === 'string' ? req.query.status : undefined

    const schedules = await prisma.doctorSchedule.findMany({
      where: {
        ...(doctorId ? { doctorId } : {}),
        ...(status ? { status } : {}),
      },
      include: withScheduleBooking,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })

    res.json(await attachComputedBooking(schedules))
  }),
)

schedulesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const doctorId = typeof req.query.doctorId === 'string' ? req.query.doctorId : undefined
    const status = typeof req.query.status === 'string' ? req.query.status : undefined

    const schedules = await prisma.doctorSchedule.findMany({
      where: {
        ...(doctorId ? { doctorId } : {}),
        ...(status ? { status } : {}),
      },
      include: withScheduleBooking,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })

    const computedSchedules = await attachComputedBooking(schedules)
    res.json(
      computedSchedules.map(({ reservations: _reservations, ...schedule }) => schedule),
    )
  }),
)

schedulesRouter.post(
  '/',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { doctorId, date, time, status, note } = req.body

    if (!doctorId || !date || !time) {
      throw new ApiError(400, 'Dokter, tanggal, dan jam wajib diisi')
    }

    const schedule = await prisma.doctorSchedule.create({
      data: {
        doctorId,
        date: new Date(date),
        time,
        status: status ?? 'AVAILABLE',
        note,
      },
      include: withScheduleBooking,
    })

    const [computedSchedule] = await attachComputedBooking([schedule])
    res.status(201).json(computedSchedule)
  }),
)

schedulesRouter.put(
  '/day/status',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { doctorId, date, status } = req.body

    if (!doctorId || !date || !status) {
      throw new ApiError(400, 'Dokter, tanggal, dan status wajib diisi')
    }

    await prisma.doctorSchedule.updateMany({
      where: {
        date: new Date(date),
        doctorId,
      },
      data: {
        note: status === 'AVAILABLE' ? null : undefined,
        status,
      },
    })

    const schedules = await prisma.doctorSchedule.findMany({
      where: {
        date: new Date(date),
        doctorId,
      },
      include: withScheduleBooking,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    })

    res.json(await attachComputedBooking(schedules))
  }),
)

schedulesRouter.put(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { date, ...payload } = req.body
    const schedule = await prisma.doctorSchedule.update({
      where: { id: getParam(req.params.id, 'id') },
      data: { ...payload, ...(date ? { date: new Date(date) } : {}) },
      include: withScheduleBooking,
    })

    const [computedSchedule] = await attachComputedBooking([schedule])
    res.json(computedSchedule)
  }),
)

schedulesRouter.delete(
  '/:id',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.doctorSchedule.delete({
      where: { id: getParam(req.params.id, 'id') },
    })

    res.status(204).send()
  }),
)
