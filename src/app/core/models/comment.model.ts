export interface Comment {
  id: number;
  cardId: number;
  authorId: number;
  content: string;
  parentCommentId?: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export interface Attachment {
  id: number;
  cardId: number;
  uploaderId: number;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  sizeKb?: number;
  uploadedAt: string;
}