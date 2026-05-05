import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Card, CardPriority, CardStatus, CreateCardRequest, TaskList } from '../models/card.model';

@Injectable({ providedIn: 'root' })
export class CardService {
  private CARD = environment.services.card;
  private LIST = environment.services.list;
  constructor(private http: HttpClient) {}

  // Cards
  create(req: CreateCardRequest): Observable<Card> {
    return this.http.post<Card>(`${this.CARD}/cards`, req);
  }
  getById(id: number): Observable<Card> {
    return this.http.get<Card>(`${this.CARD}/cards/${id}`);
  }
  getByList(listId: number): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.CARD}/cards/list/${listId}`);
  }
  getByBoard(boardId: number): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.CARD}/cards/board/${boardId}`);
  }
  update(id: number, req: Partial<CreateCardRequest>): Observable<Card> {
    return this.http.put<Card>(`${this.CARD}/cards/${id}`, req);
  }
  move(id: number, targetListId: number, position: number): Observable<Card> {
    return this.http.patch<Card>(`${this.CARD}/cards/${id}/move`, { targetListId, position });
  }
  reorder(listId: number, orderedIds: number[]): Observable<void> {
    return this.http.put<void>(`${this.CARD}/cards/list/${listId}/reorder`, orderedIds);
  }
  setAssignee(id: number, assigneeId: number | null): Observable<Card> {
    return this.http.patch<Card>(`${this.CARD}/cards/${id}/assignee`, { assigneeId });
  }
  setPriority(id: number, priority: CardPriority): Observable<Card> {
    return this.http.patch<Card>(`${this.CARD}/cards/${id}/priority`, { priority });
  }
  setStatus(id: number, status: CardStatus): Observable<Card> {
    return this.http.patch<Card>(`${this.CARD}/cards/${id}/status`, { status });
  }
  archive(id: number): Observable<void> {
    return this.http.patch<void>(`${this.CARD}/cards/${id}/archive`, {});
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.CARD}/cards/${id}`);
  }
  getOverdue(): Observable<Card[]> {
    return this.http.get<Card[]>(`${this.CARD}/cards/overdue`);
  }

  // Lists
  getLists(boardId: number): Observable<TaskList[]> {
    return this.http.get<TaskList[]>(`${this.LIST}/lists/board/${boardId}`);
  }
  createList(boardId: number, name: string): Observable<TaskList> {
    return this.http.post<TaskList>(`${this.LIST}/lists`, { boardId, name });
  }
  updateList(id: number, name: string, color?: string): Observable<TaskList> {
    return this.http.put<TaskList>(`${this.LIST}/lists/${id}`, { name, color });
  }
  reorderLists(boardId: number, orderedIds: number[]): Observable<void> {
    return this.http.put<void>(`${this.LIST}/lists/board/${boardId}/reorder`, orderedIds);
  }
  archiveList(id: number): Observable<void> {
    return this.http.patch<void>(`${this.LIST}/lists/${id}/archive`, {});
  }
  deleteList(id: number): Observable<void> {
    return this.http.delete<void>(`${this.LIST}/lists/${id}`);
  }
}
