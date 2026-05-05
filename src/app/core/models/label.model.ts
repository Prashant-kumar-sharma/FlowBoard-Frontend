export interface Label {
  id: number;
  boardId: number;
  name: string;
  color: string;
  createdAt: string;
}

export interface Checklist {
  id: number;
  cardId: number;
  title: string;
  position: number;
  items: ChecklistItem[];
  createdAt: string;
}

export interface ChecklistItem {
  id: number;
  checklistId: number;
  text: string;
  isCompleted: boolean;
  assigneeId?: number;
  dueDate?: string;
  position?: number;
}