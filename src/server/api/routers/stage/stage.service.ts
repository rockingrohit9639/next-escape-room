import { type PrismaClient } from "@prisma/client"
import { type CreateStageSchema } from "./stage.schema"
import { TRPCError } from "@trpc/server"

export async function createStage(input: CreateStageSchema, userId: string, db: PrismaClient) {
  const escapeRoom = await db.escapeRoom.findUnique({
    where: { id: input.escapeRoomId },
    select: { createdById: true },
  })

  if (!escapeRoom) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Escape room not found.",
    })
  }

  if (escapeRoom.createdById !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You are not allowed to add stage in this escape room.",
    })
  }

  const stage = await db.stage.create({
    data: {
      label: input.label,
      description: input.description,
      background: input.background,
      order: 0,
      timeLimit: input.timeLimit,
      createdById: userId,
      escapeRoomId: input.escapeRoomId,
    },
  })

  return stage
}

export async function findAllEscapeRoomStages(
  escapeRoomId: string,
  userId: string,
  db: PrismaClient,
) {
  return db.stage.findMany({
    where: { escapeRoomId, createdById: userId },
  })
}

export async function findStageById(stageId: string, userId: string, db: PrismaClient) {
  const stage = await db.stage.findUnique({
    where: { id: stageId, createdById: userId },
    include: { escapeRoom: { select: { label: true } } },
  })

  if (!stage) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Stage not found or not allowed to you.",
    })
  }

  return stage
}

export async function removeStage(stageId: string, userId: string, db: PrismaClient) {
  const stage = await db.stage.findUnique({
    where: { id: stageId, createdById: userId },
    select: { id: true },
  })

  if (!stage) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Stage does not exists.",
    })
  }

  return db.stage.delete({
    where: { id: stage.id },
    select: { id: true, escapeRoomId: true },
  })
}
