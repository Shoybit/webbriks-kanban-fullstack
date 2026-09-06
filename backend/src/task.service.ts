import { prisma } from "./lib/prisma";

export const createTask = async (
  columnId: string,
  userId: string,
  title: string,
  description?: string
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

  const lastTask = await prisma.task.findFirst({
    where: {
      columnId,
    },
    orderBy: {
      position: "desc",
    },
  });

  const position = lastTask ? lastTask.position + 1 : 0;

  return prisma.task.create({
    data: {
      title,
      ...(description !== undefined ? { description } : {}),
      position,
      columnId,
    },
  });
};

export const getColumnTasks = async (
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

  return prisma.task.findMany({
    where: {
      columnId,
    },
    orderBy: {
      position: "asc",
    },
  });
};

export const updateTask = async (
  taskId: string,
  userId: string,
  title: string,
  description?: string
) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      column: {
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
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  return prisma.task.update({
    where: {
      id: taskId,
    },
    data: {
      title,
      ...(description !== undefined ? { description } : {}),
    },
  });
};

export const deleteTask = async (
  taskId: string,
  userId: string
) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      column: {
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
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  await prisma.task.delete({
    where: {
      id: taskId,
    },
  });
};

export const moveTask = async (
  taskId: string,
  userId: string,
  targetColumnId: string,
  targetPosition: number
) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      column: {
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
    },
    include: {
      column: {
        select: {
          boardId: true,
        },
      },
    },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  const targetColumn = await prisma.column.findFirst({
    where: {
      id: targetColumnId,
      boardId: task.column.boardId,
    },
  });

  if (!targetColumn) {
    throw new Error("Target column not found");
  }

return prisma.$transaction(async (tx) => {
  const sourceColumnId = task.columnId;

  if (sourceColumnId === targetColumnId) {
    const tasks = await tx.task.findMany({
      where: {
        columnId: sourceColumnId,
      },
      orderBy: {
        position: "asc",
      },
    });

    const currentIndex = tasks.findIndex((item) => item.id === taskId);

    tasks.splice(currentIndex, 1);

    const position = Math.max(
      0,
      Math.min(targetPosition, tasks.length)
    );

    tasks.splice(position, 0, task);

    for (let index = 0; index < tasks.length; index++) {
      await tx.task.update({
        where: {
          id: tasks[index]!.id,
        },
        data: {
          position: index,
        },
      });
    }
  } else {
    const sourceTasks = await tx.task.findMany({
      where: {
        columnId: sourceColumnId,
        id: {
          not: taskId,
        },
      },
      orderBy: {
        position: "asc",
      },
    });

    const targetTasks = await tx.task.findMany({
      where: {
        columnId: targetColumnId,
      },
      orderBy: {
        position: "asc",
      },
    });

    const position = Math.max(
      0,
      Math.min(targetPosition, targetTasks.length)
    );

    targetTasks.splice(position, 0, task);

    for (let index = 0; index < sourceTasks.length; index++) {
      await tx.task.update({
        where: {
          id: sourceTasks[index]!.id,
        },
        data: {
          position: index,
        },
      });
    }

    for (let index = 0; index < targetTasks.length; index++) {
      await tx.task.update({
        where: {
          id: targetTasks[index]!.id,
        },
        data: {
          columnId: targetColumnId,
          position: index,
        },
      });
    }
  }

  return tx.task.findUnique({
    where: {
      id: taskId,
    },
  });
});
};