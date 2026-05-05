export interface Workspace {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  visibility: 'PUBLIC' | 'PRIVATE';
  logoUrl?: string;
  members: WorkspaceMember[];
  createdAt: string;
}

export interface WorkspaceMember {
  id: number;
  userId: number;
  workspaceId: number;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
}