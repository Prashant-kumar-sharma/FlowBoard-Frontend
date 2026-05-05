import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateWorkspaceRequest, Workspace, WorkspaceMember } from '../models/workspace.model';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
  private readonly BASE = environment.services.workspace;

  constructor(private readonly http: HttpClient) {}

  create(req: CreateWorkspaceRequest): Observable<Workspace> {
    return this.http.post<Workspace>(`${this.BASE}/workspaces`, req);
  }
  getById(id: number): Observable<Workspace> {
    return this.http.get<Workspace>(`${this.BASE}/workspaces/${id}`);
  }
  getMy(): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(`${this.BASE}/workspaces/my`);
  }
  getPublic(): Observable<Workspace[]> {
    return this.http.get<Workspace[]>(`${this.BASE}/workspaces/public`);
  }
  update(id: number, req: Partial<CreateWorkspaceRequest>): Observable<Workspace> {
    return this.http.put<Workspace>(`${this.BASE}/workspaces/${id}`, req);
  }
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/workspaces/${id}`);
  }
  addMember(id: number, userId: number, role = 'MEMBER'): Observable<WorkspaceMember> {
    return this.http.post<WorkspaceMember>(`${this.BASE}/workspaces/${id}/members`, { userId, role });
  }
  removeMember(id: number, userId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/workspaces/${id}/members/${userId}`);
  }
  updateMemberRole(id: number, userId: number, role: WorkspaceMember['role']): Observable<void> {
    return this.http.put<void>(`${this.BASE}/workspaces/${id}/members/${userId}/role`, { role });
  }
  getMembers(id: number): Observable<WorkspaceMember[]> {
    return this.http.get<WorkspaceMember[]>(`${this.BASE}/workspaces/${id}/members`);
  }
}
