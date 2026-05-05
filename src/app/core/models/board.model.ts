export interface Board {
  id: number;
  name: string;
  description?: string;
  workspaceId: number;
  createdById: number;
  background: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  isClosed: boolean;
  members: BoardMember[];
  createdAt: string;
}

export interface BoardMember {
  id: number;
  userId: number;
  boardId: number;
  role: 'OBSERVER' | 'MEMBER' | 'ADMIN';
  addedAt: string;
}

export interface CreateBoardRequest {
  name: string;
  description?: string;
  background?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
  workspaceId: number;
}