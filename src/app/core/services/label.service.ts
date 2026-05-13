import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Checklist, ChecklistItem, Label } from '../models/label.model';

@Injectable({ providedIn: 'root' })
export class LabelService {
  private readonly BASE = environment.services.label;

  constructor(private readonly http: HttpClient) {}

  getLabelsByBoard(boardId: number): Observable<Label[]> {
    return this.http.get<Label[]>(`${this.BASE}/boards/${boardId}/labels`);
  }
  createLabel(boardId: number, name: string, color: string): Observable<Label> {
    return this.http.post<Label>(`${this.BASE}/boards/${boardId}/labels`, { name, color });
  }
  updateLabel(id: number, name: string, color: string): Observable<Label> {
    return this.http.put<Label>(`${this.BASE}/labels/${id}`, { name, color });
  }
  deleteLabel(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/labels/${id}`);
  }
  addToCard(cardId: number, labelId: number): Observable<any> {
    return this.http.post(`${this.BASE}/cards/${cardId}/labels/${labelId}`, {});
  }
  removeFromCard(cardId: number, labelId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/cards/${cardId}/labels/${labelId}`);
  }
  getForCard(cardId: number): Observable<Label[]> {
    return this.http.get<Label[]>(`${this.BASE}/cards/${cardId}/labels`);
  }
  getChecklists(cardId: number): Observable<Checklist[]> {
    return this.http.get<Checklist[]>(`${this.BASE}/cards/${cardId}/checklists`);
  }
  createChecklist(cardId: number, title: string): Observable<Checklist> {
    return this.http.post<Checklist>(`${this.BASE}/cards/${cardId}/checklists`, { title });
  }
  addItem(checklistId: number, text: string, assigneeId?: number): Observable<ChecklistItem> {
    return this.http.post<ChecklistItem>(`${this.BASE}/checklists/${checklistId}/items`, { text, assigneeId });
  }
  toggleItem(itemId: number): Observable<ChecklistItem> {
    return this.http.patch<ChecklistItem>(`${this.BASE}/checklist-items/${itemId}/toggle`, {});
  }
  getProgress(checklistId: number): Observable<{progress: number}> {
    return this.http.get<{progress: number}>(`${this.BASE}/checklists/${checklistId}/progress`);
  }
  deleteChecklist(checklistId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/checklists/${checklistId}`);
  }
}
