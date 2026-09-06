import { Response } from "express";
import { AuthRequest } from "./auth.middleware";
import {
  createColumn,
  getBoardColumns,
  updateColumn,
  deleteColumn,
} from "./column.service";

export const create = async (req: AuthRequest, res: Response) => {
  try {
    const boardId = String(req.params.boardId);
    const { name } = req.body;

    if (!boardId) {
      return res.status(400).json({
        message: "Board ID is required",
      });
    }

    if (!name) {
      return res.status(400).json({
        message: "Column name is required",
      });
    }

    const column = await createColumn(
      boardId,
      req.user!.userId,
      name
    );

    return res.status(201).json({
      message: "Column created successfully",
      column,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Board not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create column",
    });
  }
};
export const getAll = async (req: AuthRequest, res: Response) => {
  try {
    const boardId = String(req.params.boardId);

    const columns = await getBoardColumns(
      boardId,
      req.user!.userId
    );

    return res.status(200).json({
      columns,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Board not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to fetch columns",
    });
  }
};

export const update = async (req: AuthRequest, res: Response) => {
  try {
    const columnId = String(req.params.columnId);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Column name is required",
      });
    }

    const column = await updateColumn(
      columnId,
      req.user!.userId,
      name
    );

    return res.status(200).json({
      message: "Column updated successfully",
      column,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Column not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update column",
    });
  }
};

export const remove = async (req: AuthRequest, res: Response) => {
  try {
    const columnId = String(req.params.columnId);

    await deleteColumn(
      columnId,
      req.user!.userId
    );

    return res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === "Column not found") {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to delete column",
    });
  }
};