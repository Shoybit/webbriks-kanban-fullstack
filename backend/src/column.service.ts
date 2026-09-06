import { prisma } from "./lib/prisma";

export const createColumn = async (
  boardId: string,
  userId: string,
  name: string
) => {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId,
            },
          },
        },
      ],
    },
  });

  if (!board) {
    throw new Error("Board not found");
  }

  const lastColumn = await prisma.column.findFirst({
    where: {
      boardId,
    },
    orderBy: {
      position: "desc",
    },
  });

  const position = lastColumn ? lastColumn.position + 1 : 0;

  return prisma.column.create({
    data: {
      name,
      position,
      boardId,
    },
  });
};

export const getBoardColumns = async (
  boardId: string,
  userId: string
) => {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId,
            },
          },
        },
      ],
    },
  });

  if (!board) {
    throw new Error("Board not found");
  }

  return prisma.column.findMany({
    where: {
      boardId,
    },
    orderBy: {
      position: "asc",
    },
  });
};

export const updateColumn = async (
  columnId: string,
  userId: string,
  name: string
) => {
  const column = await prisma.column.findFirst({
    where: {
      id: columnId,
      board: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
    },
  });

  if (!column) {
    throw new Error("Column not found");
  }

  return prisma.column.update({
    where: {
      id: columnId,
    },
    data: {
      name,
    },
  });
};

export const deleteColumn = async (
  columnId: string,
  userId: string
) => {
  const column = await prisma.column.findFirst({
    where: {
      id: columnId,
      board: {
        OR: [
          { ownerId: userId },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
    },
  });

  if (!column) {
    throw new Error("Column not found");
  }

  await prisma.column.delete({
    where: {
      id: columnId,
    },
  });
};