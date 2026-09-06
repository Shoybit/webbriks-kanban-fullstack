import { prisma } from "./lib/prisma";

export const createBoard = async (name: string, ownerId: string) => {
  const board = await prisma.board.create({
    data: {
      name,
      ownerId,
      members: {
        create: {
          userId: ownerId,
        },
      },
    },
  });

  return board;
};

export const getUserBoards = async (userId: string) => {
  const boards = await prisma.board.findMany({
    where: {
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return boards;
};

export const getBoardById = async (boardId: string, userId: string) => {
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
    include: {
      columns: {
        orderBy: {
          position: "asc",
        },
        include: {
          tasks: {
            orderBy: {
              position: "asc",
            },
          },
        },
      },
    },
  });

  if (!board) {
    throw new Error("Board not found");
  }

  return board;
};

export const updateBoard = async (
  boardId: string,
  userId: string,
  name: string
) => {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      ownerId: userId,
    },
  });

  if (!board) {
    throw new Error("Board not found");
  }

  return prisma.board.update({
    where: {
      id: boardId,
    },
    data: {
      name,
    },
  });
};

export const deleteBoard = async (
  boardId: string,
  userId: string
) => {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      ownerId: userId,
    },
  });

  if (!board) {
    throw new Error("Board not found");
  }

  await prisma.board.delete({
    where: {
      id: boardId,
    },
  });
};

export const addBoardMember = async (
  boardId: string,
  ownerId: string,
  userEmail: string
) => {
  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      ownerId,
    },
  });

  if (!board) {
    throw new Error("Board not found");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: userEmail,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const existingMember = await prisma.boardMember.findUnique({
  where: {
    boardId_userId: {
      boardId,
      userId: user.id,
    },
  },
});

if (existingMember) {
  throw new Error("User already has access to this board");
}

  return prisma.boardMember.create({
    data: {
      boardId,
      userId: user.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
};