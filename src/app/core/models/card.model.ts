export type CardPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CardStatus = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export interface Card {
  id: number;
  title: string;
  description?: string;
  listId: number;
  boardId: number;
  position: number;
  priority: CardPriority;
  status: CardStatus;
  dueDate?: string;
  startDate?: string;
  assigneeId?: number;
  createdById: number;
  isArchived: boolean;
  coverColor: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskList {
  id: number;
  name: string;
  boardId: number;
  position: number;
  color: string;
  isArchived: boolean;
  cards?: Card[];
}

export interface CreateCardRequest {
  title: string;
  description?: string;
  listId: number;
  boardId: number;
  priority?: CardPriority;
  dueDate?: string;
  assigneeId?: number;
}