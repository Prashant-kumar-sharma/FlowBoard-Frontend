import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Board, BoardMember, CreateBoardRequest } from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private BASE = environment.services.board;
  constructor(private http: HttpClient) {}

  create(req: CreateBoardRequest): Observable<Board> {
    return this.http.post<Board>(`${this.BASE}/boards`, req);
  }
  getById(id: number): Observable<Board> {
    return this.http.get<Board>(`${this.BASE}/boards/${id}`);
  }
  getByWorkspace(workspaceId: number): Observable<Board[]> {
    return this.http.get<Board[]>(`${this.BASE}/boards/workspace/${workspaceId}`);
  }
  getMy(): Observable<Board[]> {
    return this.http.get<Board[]>(`${this.BASE}/boards/my`);
  }
  update(id: number, req: Partial<CreateBoardRequest>): Observable<Board> {
    return this.http.put<Board>(`${this.BASE}/boards/${id}`, req);
  }
  close(id: number): Observable<void> {
    return this.http.patch<void>(`${this.BASE}/boards/${id}/close`, {});
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/boards/${id}`);
  }
  addMember(id: number, userId: number, role = 'MEMBER'): Observable<BoardMember> {
    return this.http.post<BoardMember>(`${this.BASE}/boards/${id}/members`, { userId, role });
  }
  removeMember(id: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/boards/${id}/members/${userId}`);
  }
  updateMemberRole(id: number, userId: number, role: BoardMember['role']): Observable<BoardMember> {
    return this.http.put<BoardMember>(`${this.BASE}/boards/${id}/members/${userId}/role`, { role });
  }
  getMembers(id: number): Observable<BoardMember[]> {
    return this.http.get<BoardMember[]>(`${this.BASE}/boards/${id}/members`);
  }
}
