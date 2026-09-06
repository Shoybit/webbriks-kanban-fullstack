"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  const [boards, setBoards] = useState<
    { id: string; name: string }[]
  >([]);

  const [columns, setColumns] = useState<
  { id: string; name: string; position: number }[]
>([]);

const [tasks, setTasks] = useState<
  {
    id: string;
    title: string;
    description: string | null;
    position: number;
    columnId: string;
  }[]
>([]);

const [showBoardForm, setShowBoardForm] = useState(false);
const [boardName, setBoardName] = useState("");
const [selectedBoardId, setSelectedBoardId] = useState("");
const [showColumnForm, setShowColumnForm] = useState(false);
const [columnName, setColumnName] = useState("");
const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
const [editingColumnName, setEditingColumnName] = useState("");
const [showTaskForm, setShowTaskForm] = useState(false);
const [taskTitle, setTaskTitle] = useState("");
const [taskColumnId, setTaskColumnId] = useState("");
const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
const [editingTaskTitle, setEditingTaskTitle] = useState("");
const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
const [editingBoardName, setEditingBoardName] = useState("");
const [showShareForm, setShowShareForm] = useState(false);
const [shareEmail, setShareEmail] = useState("");
const [userName, setUserName] = useState("");
const [toast, setToast] = useState<{
  message: string;
  type: "success" | "error";
} | null>(null);
const [showUserMenu, setShowUserMenu] = useState(false);
const sensors = useSensors(useSensor(PointerSensor));

const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;

  if (!over) return;

  const token = localStorage.getItem("token");

  if (!token) return;

  const draggedTask = tasks.find((task) => task.id === active.id);

  if (!draggedTask) return;

  const targetTask = tasks.find((task) => task.id === over.id);

  const targetColumnId = targetTask
    ? targetTask.columnId
    : columns.find((column) => column.id === over.id)?.id;

  if (!targetColumnId) return;

  const targetTasks = tasks
    .filter((task) => task.columnId === targetColumnId)
    .sort((a, b) => a.position - b.position)
    .filter((task) => task.id !== draggedTask.id);

  let newPosition = targetTasks.length;

  if (targetTask) {
    const targetIndex = targetTasks.findIndex(
      (task) => task.id === targetTask.id
    );

    if (targetIndex !== -1) {
      newPosition = targetIndex;
    }
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tasks/${draggedTask.id}/move`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      body: JSON.stringify({
        columnId: targetColumnId,
        position: newPosition,
      }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to move task");
    }

setTasks((currentTasks) => {
  const updatedTasks = [...currentTasks];

  const draggedIndex = updatedTasks.findIndex(
    (task) => task.id === draggedTask.id
  );

  if (draggedIndex === -1) return currentTasks;

  const [movedTask] = updatedTasks.splice(draggedIndex, 1);

  movedTask.columnId = targetColumnId;

  const targetIndexes = updatedTasks
    .map((task, index) =>
      task.columnId === targetColumnId ? index : -1
    )
    .filter((index) => index !== -1);

  const insertIndex =
    targetIndexes[newPosition] ?? updatedTasks.length;

  updatedTasks.splice(insertIndex, 0, movedTask);

  return updatedTasks.map((task, index) => ({
    ...task,
    position:
      task.columnId === targetColumnId
        ? updatedTasks
            .filter((item) => item.columnId === targetColumnId)
            .findIndex((item) => item.id === task.id)
        : task.position,
  }));
});
  } catch (error) {
    console.error("Failed to move task:", error);
  }
};

const handleCreateBoard = async () => {
  const token = localStorage.getItem("token");

  if (!token || !boardName.trim()) return;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/boards`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: boardName.trim(),
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to create board");
    }

    setBoards((currentBoards) => [data, ...currentBoards]);
    setSelectedBoardId(data.id);
    setBoardName("");
    setShowBoardForm(false);
    showToast("Board created successfully", "success");
  } catch (error) {
    console.error("Failed to create board:", error);
    showToast("Failed to create board", "error");
  }
};

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

const handleCreateColumn = async () => {
  const token = localStorage.getItem("token");

  if (!token || !selectedBoardId || !columnName.trim()) return;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/columns/${selectedBoardId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: columnName.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create column");
    }

    setColumns((currentColumns) => [...currentColumns, data.column]);
    setColumnName("");
    setShowColumnForm(false);
    showToast("Column created successfully", "success");
  } catch (error) {
    console.error("Failed to create column:", error);
    showToast("Failed to create column", "error");
  }
};

const handleDeleteColumn = async (columnId: string) => {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/columns/${columnId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to delete column");
    }

    setColumns((currentColumns) =>
      currentColumns.filter((column) => column.id !== columnId)
    );
    showToast("Column deleted successfully", "success");
  } catch (error) {
    console.error("Failed to delete column:", error);
    showToast("Failed to delete column", "error");
  }
};

const handleUpdateColumn = async () => {
  const token = localStorage.getItem("token");

  if (!token || !editingColumnId || !editingColumnName.trim()) return;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/columns/${editingColumnId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingColumnName.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update column");
    }

    setColumns((currentColumns) =>
      currentColumns.map((column) =>
        column.id === editingColumnId ? data.column : column
      )
    );

    setEditingColumnId(null);
    setEditingColumnName("");
  } catch (error) {
    console.error("Failed to update column:", error);
  }
};

const handleCreateTask = async () => {
  const token = localStorage.getItem("token");

  if (!token || !taskColumnId || !taskTitle.trim()) return;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskColumnId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: taskTitle.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create task");
    }

    setTasks((currentTasks) => [...currentTasks, data.task]);

    setTaskTitle("");
    setTaskColumnId("");
    setShowTaskForm(false);
    showToast("Task created successfully", "success");
  } catch (error) {
    console.error("Failed to create task:", error);
    showToast("Failed to create task", "error");
  }
};

const handleDeleteTask = async (taskId: string) => {
  const token = localStorage.getItem("token");

  if (!token) return;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to delete task");
    }

    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId)
    );
  } catch (error) {
    console.error("Failed to delete task:", error);
  }
};

const handleUpdateTask = async () => {
  const token = localStorage.getItem("token");

  if (!token || !editingTaskId || !editingTaskTitle.trim()) return;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tasks/${editingTaskId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingTaskTitle.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update task");
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === editingTaskId ? data.task : task
      )
    );

    setEditingTaskId(null);
    setEditingTaskTitle("");
  } catch (error) {
    console.error("Failed to update task:", error);
  }
};

const handleDeleteBoard = async () => {
  const token = localStorage.getItem("token");

  if (!token || !selectedBoardId) return;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/boards/${selectedBoardId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

if (!response.ok) {
  const data = await response.json();
  throw new Error(data.message || "Failed to delete board");
}


    const remainingBoards = boards.filter(
      (board) => board.id !== selectedBoardId
    );

    setColumns([]);
    setTasks([]);

    setBoards(remainingBoards);
    setSelectedBoardId(remainingBoards[0]?.id || "");
    showToast("Board deleted successfully", "success");
  } catch (error) {
    console.error("Failed to delete board:", error);
    showToast("Failed to delete board", "error");
  }
};


const handleShareBoard = async () => {
  const token = localStorage.getItem("token");

  if (!token || !selectedBoardId || !shareEmail.trim()) return;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/boards/${selectedBoardId}/members`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: shareEmail.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to share board");
    }

    setShareEmail("");
    setShowShareForm(false);
    showToast("Board shared successfully", "success");
  } catch (error) {
    console.error("Failed to share board:", error);
    showToast("Failed to share board", "error");
  }
};

const handleUpdateBoard = async () => {
  const token = localStorage.getItem("token");

  if (!token || !editingBoardId || !editingBoardName.trim()) return;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/boards/${editingBoardId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editingBoardName.trim(),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to update board");
    }

setBoards((currentBoards) =>
  currentBoards.map((board) =>
    board.id === editingBoardId ? data : board
  )
);

    setEditingBoardId(null);
    setEditingBoardName("");
  } catch (error) {
    console.error("Failed to update board:", error);
  }
};

useEffect(() => {
  const user = localStorage.getItem("user");

  if (user) {
    const parsedUser = JSON.parse(user);
    setUserName(parsedUser.name || "");
  }
}, []);

  useEffect(() => {
    const fetchBoards = async () => {
      const token = localStorage.getItem("token");

      if (!token) return;

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/boards`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) return;

        const data = await response.json();

        setBoards(data);
        if (data.length > 0) {
  setSelectedBoardId(data[0].id);
}
      } catch (error) {
        console.error("Failed to fetch boards:", error);
      }
    };

    fetchBoards();
  }, []);

  useEffect(() => {
  const fetchColumns = async () => {
    const token = localStorage.getItem("token");

    if (!token || !selectedBoardId) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/columns/${selectedBoardId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );



      if (!response.ok) return;

      const data = await response.json();

      setColumns(data.columns);
    } catch (error) {
      console.error("Failed to fetch columns:", error);
    }
  };

  fetchColumns();
}, [selectedBoardId]);

useEffect(() => {
  const fetchTasks = async () => {
    const token = localStorage.getItem("token");

    if (!token || columns.length === 0) return;

    try {
      const responses = await Promise.all(
        columns.map((column) =>
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tasks/${column.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      const taskLists = await Promise.all(
        responses.map((response) => response.json())
      );

      const allTasks = taskLists.flatMap((data) => data.tasks);

      setTasks(allTasks);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  fetchTasks();
}, [columns]);


function DraggableTask({
  task,
  children,
}: {
  task: {
    id: string;
    title: string;
    description: string | null;
    position: number;
    columnId: string;
  };
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}



function DroppableColumn({
  columnId,
  children,
}: {
  columnId: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id: columnId,
  });

  return (
    <div ref={setNodeRef}>
      {children}
    </div>
  );
}

const showToast = (
  message: string,
  type: "success" | "error"
) => {
  setToast({ message, type });

  setTimeout(() => {
    setToast(null);
  }, 3000);
};
  
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {toast && (
  <div
    className={`fixed right-5 top-5 z-50 rounded-xl px-5 py-3 text-sm font-medium text-white shadow-lg ${
      toast.type === "success"
        ? "bg-emerald-600"
        : "bg-red-600"
    }`}
  >
    {toast.message}
  </div>
)}
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 shadow-md shadow-slate-900/20">
              <span className="text-sm font-bold text-white">K</span>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Kanban Board
              </h1>
              <p className="hidden sm:block text-xs text-slate-400">
                Manage your workflow
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowBoardForm(true)}
              className="hidden sm:flex group rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:shadow-xl hover:shadow-slate-900/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Board
              </span>
            </button>

            {/* Mobile New Board Button */}
            <button
              onClick={() => setShowBoardForm(true)}
              className="sm:hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 p-2.5 text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/50 px-3 py-2 transition-all duration-200 hover:bg-white hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold text-white">
                  {userName.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700 max-w-[100px] truncate">
                  {userName || "User"}
                </span>
                <svg className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right animate-in fade-in slide-in-from-top-2 duration-200 rounded-xl bg-white/90 p-2 shadow-xl ring-1 ring-slate-200/80 backdrop-blur-sm">
                  <div className="border-b border-slate-200/80 px-3 py-2">
                    <p className="text-sm font-medium text-slate-900">
                      {userName || "User"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user") || "{}").email : "user@example.com"}
                    </p>
                  </div>
                  


                  <div className="border-t border-slate-200/80 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-10">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Board Select */}
            <div className="relative flex-1 sm:flex-none min-w-[150px] sm:min-w-[200px]">
              <select
                value={selectedBoardId}
                onChange={(event) => setSelectedBoardId(event.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 pr-8 sm:pr-10 text-sm font-medium text-slate-900 outline-none transition-all duration-200 focus:border-slate-400 focus:shadow-lg focus:shadow-slate-200/50 hover:border-slate-300 cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23475569' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                  backgroundPosition: 'right 0.75rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.25rem 1.25rem',
                }}
              >
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              type="button"
              onClick={() => {
                setEditingBoardId(selectedBoardId);
                setEditingBoardName(
                  boards.find((board) => board.id === selectedBoardId)?.name || ""
                );
              }}
              disabled={!selectedBoardId}
              className="rounded-xl border border-slate-200 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
            >
              <span className="hidden sm:inline">Edit Board</span>
              <svg className="sm:hidden h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </button>

            {editingBoardId === selectedBoardId && (
              <div className="flex w-full sm:w-auto items-center gap-2">
                <input
                  type="text"
                  value={editingBoardName}
                  onChange={(event) => setEditingBoardName(event.target.value)}
                  className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-400 focus:shadow-lg focus:shadow-slate-200/50"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleUpdateBoard}
                  className="rounded-xl bg-slate-900 px-3 sm:px-4 py-2 text-xs font-medium text-white transition-all duration-200 hover:bg-slate-800 active:scale-[0.98]"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingBoardId(null);
                    setEditingBoardName("");
                  }}
                  className="rounded-xl border border-slate-200 px-3 sm:px-4 py-2 text-xs font-medium text-slate-500 transition-all duration-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDeleteBoard}
              disabled={!selectedBoardId}
              className="rounded-xl border border-red-200 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-red-500 transition-all duration-200 hover:bg-red-50 hover:border-red-300 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
            >
              <span className="hidden sm:inline">Delete Board</span>
              <svg className="sm:hidden h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setShowShareForm(true)}
              disabled={!selectedBoardId}
              className="rounded-xl border border-slate-200 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
            >
              <span className="hidden sm:inline">Share Board</span>
              <svg className="sm:hidden h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </button>

            {showShareForm && (
              <div className="mt-2 flex w-full flex-wrap items-center gap-2 sm:mt-0 sm:w-auto">
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(event) => setShareEmail(event.target.value)}
                  placeholder="Enter user email..."
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-slate-400 focus:shadow-lg focus:shadow-slate-200/50 sm:min-w-[200px]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleShareBoard}
                  className="rounded-xl bg-slate-900 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-slate-800 active:scale-[0.98]"
                >
                  Share
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowShareForm(false);
                    setShareEmail("");
                  }}
                  className="rounded-xl border border-slate-200 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-slate-500 transition-all duration-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
          <p className="mt-2 ml-1 text-sm font-medium text-slate-500">
            Organize your tasks and workflow efficiently.
          </p>
        </div>

        {showBoardForm && (
          <div className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-2 duration-300 rounded-2xl bg-white/80 p-4 sm:p-6 shadow-lg ring-1 ring-slate-200/80 backdrop-blur-sm">
            <div className="mb-4 sm:mb-5 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                Create New Board
              </h3>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={boardName}
                  onChange={(event) => setBoardName(event.target.value)}
                  placeholder="Enter board name..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 sm:py-3 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-slate-400 focus:bg-white focus:shadow-lg focus:shadow-slate-200/50 hover:border-slate-300"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && boardName.trim()) {
                      handleCreateBoard();
                      event.preventDefault();
                    }
                  }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateBoard}
                  disabled={!boardName.trim()}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/30 transition-all duration-200 hover:shadow-xl hover:shadow-slate-900/40 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Create
                    <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowBoardForm(false);
                    setBoardName("");
                  }}
                  className="rounded-xl border border-slate-200 bg-white/50 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-semibold text-slate-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            Workflow
          </h2>

          <button
            type="button"
            onClick={() => setShowColumnForm(true)}
            className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:shadow-xl hover:shadow-slate-900/30 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Column
          </button>
        </div>   

        {showColumnForm && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300 rounded-2xl bg-white/80 p-4 sm:p-5 shadow-lg ring-1 ring-slate-200/80 backdrop-blur-sm">
            <div className="mb-3 sm:mb-4 flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700">
                <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-slate-900">
                Add New Column
              </h4>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={columnName}
                  onChange={(event) => setColumnName(event.target.value)}
                  placeholder="Enter column name..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-slate-400 focus:bg-white focus:shadow-lg focus:shadow-slate-200/50 hover:border-slate-300"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && columnName.trim()) {
                      handleCreateColumn();
                      event.preventDefault();
                    }
                  }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateColumn}
                  disabled={!columnName.trim()}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 sm:px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/30 transition-all duration-200 hover:shadow-xl hover:shadow-slate-900/40 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    Create
                    <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowColumnForm(false);
                    setColumnName("");
                  }}
                  className="rounded-xl border border-slate-200 bg-white/50 px-3 sm:px-4 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    
        {showTaskForm && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300 rounded-2xl bg-white/80 p-4 sm:p-5 shadow-lg ring-1 ring-slate-200/80 backdrop-blur-sm">
            <div className="mb-3 sm:mb-4 flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-900 to-slate-700">
                <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-slate-900">
                Add New Task
              </h4>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Enter task title..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 sm:py-3 pl-10 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-slate-400 focus:bg-white focus:shadow-lg focus:shadow-slate-200/50 hover:border-slate-300"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && taskTitle.trim()) {
                      handleCreateTask();
                      event.preventDefault();
                    }
                  }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreateTask}
                  disabled={!taskTitle.trim()}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/30 transition-all duration-200 hover:shadow-xl hover:shadow-slate-900/40 hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    Create
                    <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full"></div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowTaskForm(false);
                    setTaskTitle("");
                    setTaskColumnId("");
                  }}
                  className="rounded-xl border border-slate-200 bg-white/50 px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm active:scale-[0.98]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

<div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
<DndContext
  sensors={sensors}
  onDragEnd={handleDragEnd}
>
    {columns.map((column) => (
      <DroppableColumn
        key={column.id}
        columnId={column.id}
      >
        <div className="rounded-2xl bg-slate-200/70 p-4 sm:p-5 shadow-inner">
          <div className="mb-4 sm:mb-5 flex flex-wrap items-center justify-between gap-2">
            {editingColumnId === column.id ? (
              <div className="flex w-full sm:w-auto flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={editingColumnName}
                  onChange={(event) =>
                    setEditingColumnName(event.target.value)
                  }
                  className="flex-1 sm:flex-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none transition-all duration-200 focus:border-slate-400 focus:shadow-lg focus:shadow-slate-200/50"
                  autoFocus
                />

                <button
                  type="button"
                  onClick={handleUpdateColumn}
                  className="rounded-xl bg-slate-900 px-3 sm:px-4 py-2 text-xs font-medium text-white transition-all duration-200 hover:bg-slate-800"
                >
                  Save
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingColumnId(null);
                    setEditingColumnName("");
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition-all duration-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-700">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                {column.name}
              </h3>
            )}

            <div className="flex items-center gap-1 sm:gap-2">
              {editingColumnId !== column.id && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingColumnId(column.id);
                      setEditingColumnName(column.name);
                    }}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteColumn(column.id)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                  >
                    Delete
                  </button>
                </>
              )}

              <span className="rounded-full bg-white/60 px-2.5 sm:px-3 py-1 text-xs font-medium text-slate-500">
                {
                  tasks.filter(
                    (task) => task.columnId === column.id
                  ).length
                }
              </span>
            </div>
          </div>

<div className="space-y-3">
  <SortableContext
    items={tasks
      .filter((task) => task.columnId === column.id)
      .sort((a, b) => a.position - b.position)
      .map((task) => task.id)}
    strategy={verticalListSortingStrategy}
  >
    {tasks
      .filter((task) => task.columnId === column.id)
      .sort((a, b) => a.position - b.position)
      .map((task) => (
              <DraggableTask
                key={task.id}
                task={task}
              >
                <div
      className="rounded-xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-slate-200/50 transition-all duration-200 hover:shadow-md hover:ring-slate-300 cursor-grab active:cursor-grabbing"
    >
                  {editingTaskId === task.id ? (
<div className="flex flex-wrap items-center gap-2">
  <input
    type="text"
    value={editingTaskTitle}
    onChange={(event) =>
      setEditingTaskTitle(event.target.value)
    }
    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-slate-400 focus:shadow-lg focus:shadow-slate-200/50"
    autoFocus
  />

  <button
    type="button"
    onPointerDown={(event) => event.stopPropagation()}
    onClick={handleUpdateTask}
    className="rounded-xl bg-slate-900 px-3 sm:px-4 py-2 text-xs font-medium text-white transition-all duration-200 hover:bg-slate-800"
  >
    Save
  </button>

  <button
    type="button"
    onPointerDown={(event) => event.stopPropagation()}
    onClick={() => {
      setEditingTaskId(null);
      setEditingTaskTitle("");
    }}
    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition-all duration-200 hover:bg-slate-50"
  >
    Cancel
  </button>
</div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 flex-1">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={() => {
                              setEditingTaskId(task.id);
                              setEditingTaskTitle(task.title);
                            }}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                          >
                            Edit
                          </button>

                    <button
                      type="button"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => handleDeleteTask(task.id)}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {task.description && (
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">
                      {task.description}
                    </p>
                  )}
                </div>
                 </DraggableTask>
              ))}
                </SortableContext>
            {tasks.filter(
              (task) => task.columnId === column.id
            ).length === 0 && (
              <div className="flex h-24 sm:h-30 items-center justify-center rounded-xl border-2 border-dashed border-slate-300/60 bg-white/30 p-6 sm:p-8">
                <p className="text-sm font-medium text-slate-400">
                  No tasks yet
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setTaskColumnId(column.id);
                setShowTaskForm(true);
              }}
              className="mt-3 sm:mt-4 w-full rounded-xl border border-dashed border-slate-300 px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium text-slate-500 transition-all duration-200 hover:border-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-sm"
            >
              + Add Task
            </button>
          </div>
        </div>
      </DroppableColumn>
    ))}
  </DndContext>
</div>
      </section>
    </main>
  );
}