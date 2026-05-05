import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TaskList } from '../models/card.model';

@Injectable({ providedIn: 'root' })
export class ListService {
  private readonly http = inject(HttpClient);
  private get url() { return environment.services.list + '/lists'; }

  create(data: Partial<TaskList>): Observable<TaskList> { return this.http.post<TaskList>(this.url, data); }
  getById(id: number): Observable<TaskList> { return this.http.get<TaskList>(`${this.url}/${id}`); }
  getByBoard(boardId: number): Observable<TaskList[]> { return this.http.get<TaskList[]>(`${this.url}/board/${boardId}`); }
  getArchived(boardId: number): Observable<TaskList[]> { return this.http.get<TaskList[]>(`${this.url}/board/${boardId}/archived`); }
  update(id: number, name: string, color?: string): Observable<TaskList> {
    return this.http.put<TaskList>(`${this.url}/${id}`, { name, color });
  }
  reorder(boardId: number, orderedIds: number[]): Observable<void> {
    return this.http.put<void>(`${this.url}/board/${boardId}/reorder`, orderedIds);
  }
  archive(id: number): Observable<void> { return this.http.patch<void>(`${this.url}/${id}/archive`, {}); }
  unarchive(id: number): Observable<void> { return this.http.patch<void>(`${this.url}/${id}/unarchive`, {}); }
  move(id: number, targetBoardId: number): Observable<TaskList> {
    return this.http.patch<TaskList>(`${this.url}/${id}/move`, { targetBoardId });
  }
  delete(id: number): Observable<void> { return this.http.delete<void>(`${this.url}/${id}`); }
}
