export interface TaskList {
  id: number;
  boardId: number;
  name: string;
  position: number;
  color?: string;
  isArchived: boolean;
  createdAt: string;
}