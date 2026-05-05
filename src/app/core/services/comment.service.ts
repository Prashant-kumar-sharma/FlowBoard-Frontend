import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Attachment, Comment } from '../models/comment.model';

@Injectable({ providedIn: 'root' })
export class CommentService {
  private BASE = environment.services.comment;
  constructor(private http: HttpClient) {}

  getByCard(cardId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.BASE}/cards/${cardId}/comments`);
  }
  add(cardId: number, content: string, parentCommentId?: number): Observable<Comment> {
    return this.http.post<Comment>(`${this.BASE}/cards/${cardId}/comments`, { content, parentCommentId });
  }
  getReplies(commentId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.BASE}/comments/${commentId}/replies`);
  }
  update(id: number, content: string): Observable<Comment> {
    return this.http.put<Comment>(`${this.BASE}/comments/${id}`, { content });
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/comments/${id}`);
  }
  getAttachments(cardId: number): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(`${this.BASE}/cards/${cardId}/attachments`);
  }
  addAttachment(cardId: number, fileName: string, fileUrl: string, fileType: string, sizeKb: number): Observable<Attachment> {
    return this.http.post<Attachment>(`${this.BASE}/cards/${cardId}/attachments`, { fileName, fileUrl, fileType, sizeKb });
  }
  upload(cardId: number, file: File): Observable<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Attachment>(`${this.BASE}/cards/${cardId}/attachments/upload`, formData);
  }
  deleteAttachment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/attachments/${id}`);
  }
}
