import { Response } from "express";
import { AuthRequest } from "./auth.middleware";
import { moveTask } from "./task.service";
import {
  createTask,
  getColumnTasks,
  updateTask,
  deleteTask,
} from "./task.service";

export const create = async (req: AuthRequest, res: Response) => {
  try {
    const columnId = String(req.params.columnId);
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    const task = await createTask(
      columnId,
      req.user!.userId,
      title,
      description
    );

    return res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Column not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create task",
    });
  }
};

export const getAll = async (req: AuthRequest, res: Response) => {
  try {
    const columnId = String(req.params.columnId);

    const tasks = await getColumnTasks(
      columnId,
      req.user!.userId
    );

    return res.status(200).json({
      tasks,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Column not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to fetch tasks",
    });
  }
};

export const update = async (req: AuthRequest, res: Response) => {
  try {
    const taskId = String(req.params.taskId);
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Task title is required",
      });
    }

    const task = await updateTask(
      taskId,
      req.user!.userId,
      title,
      description
    );

    return res.status(200).json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Task not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update task",
    });
  }
};

export const remove = async (req: AuthRequest, res: Response) => {
  try {
    const taskId = String(req.params.taskId);

    await deleteTask(
      taskId,
      req.user!.userId
    );

    return res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === "Task not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to delete task",
    });
  }
};

export const move = async (req: AuthRequest, res: Response) => {
  try {
    const taskId = String(req.params.taskId);
    const { columnId, position } = req.body;

    if (!columnId || typeof position !== "number") {
      return res.status(400).json({
        message: "Column ID and position are required",
      });
    }

    const task = await moveTask(
      taskId,
      req.user!.userId,
      columnId,
      position
    );

    return res.status(200).json({
      message: "Task moved successfully",
      task,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "Task not found" ||
        error.message === "Target column not found")
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to move task",
    });
  }
};