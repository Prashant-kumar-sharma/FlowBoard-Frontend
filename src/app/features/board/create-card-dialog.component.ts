import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Card, CardPriority, CreateCardRequest } from '../../core/models/card.model';
import { BoardMember } from '../../core/models/board.model';
import { User } from '../../core/models/user.model';
import { WorkspaceMember } from '../../core/models/workspace.model';
import { AuthService } from '../../core/auth/auth.service';
import { BoardService } from '../../core/services/board.service';
import { WorkspaceService } from '../../core/services/workspace.service';

export interface CreateCardDialogData {
  listId: number;
  boardId: number;
  workspaceId?: number;
  mode?: 'create' | 'edit';
  card?: Partial<Card>;
}

@Component({
  selector: 'app-create-card-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="dialog-shell">
      <div class="dialog-hero">
        <div class="dialog-badge">
          <mat-icon>note_add</mat-icon>
        </div>

        <div class="dialog-copy-block">
          <p class="dialog-eyebrow">{{ dialogMode === 'edit' ? 'Card editing' : 'Card setup' }}</p>
          <h2 mat-dialog-title class="dialog-title">{{ dialogMode === 'edit' ? 'Edit Card' : 'Create New Card' }}</h2>
          <p class="dialog-copy">
            {{ dialogMode === 'edit'
              ? 'Update the task details, tune the priority, and keep the card clear for the next handoff.'
              : 'Capture the task clearly, set the urgency, and add just enough detail for the next teammate to move fast.' }}
          </p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSave()" novalidate>
        <mat-dialog-content class="dialog-content">
          <div class="dialog-grid">
            <label class="field-block">
              <span class="field-label">Title</span>
              <input
                class="field-input"
                type="text"
                formControlName="title"
                placeholder="What needs to be done?"
              >
              <span class="field-help" [class.field-error]="showTitleError()">
                {{ showTitleError() ? 'Title is required.' : 'Lead with an action so the card reads cleanly in the list.' }}
              </span>
            </label>

            <label class="field-block">
              <span class="field-label">Description</span>
              <textarea
                class="field-input field-textarea"
                formControlName="description"
                placeholder="Add more details, handoff notes, or acceptance criteria."
              ></textarea>
              <span class="field-help">Optional context, acceptance notes, or handoff details.</span>
            </label>

            <div class="field-row">
              <label class="field-block">
                <span class="field-label">Priority</span>
                <select class="field-input" formControlName="priority">
                  <option *ngFor="let p of priorities" [value]="p">{{ formatPriority(p) }}</option>
                </select>
                <span class="field-help">Choose the urgency level that best matches the work.</span>
              </label>

              <label class="field-block">
                <span class="field-label">Due date</span>
                <input class="field-input" type="date" formControlName="dueDate">
                <span class="field-help">Add a deadline if this card is time-sensitive.</span>
              </label>
            </div>

            <label class="field-block">
              <span class="field-label">Assignee</span>
              <select class="field-input" formControlName="assigneeId">
                <option value="">Unassigned</option>
                <option *ngFor="let member of assignableMembers; trackBy: trackByAssignableMember" [value]="member.userId.toString()">
                  {{ getAssignableMemberLabel(member.userId) }}
                </option>
              </select>
              <span class="field-help">
                {{ loadingAssignees
                  ? 'Loading workspace members...'
                  : assignableMembers.length
                    ? 'Pick one of the workspace members for this card.'
                    : 'No members were available for assignment.' }}
              </span>
            </label>

            <div class="card-preview">
              <div class="preview-top">
                <span class="priority-pill" [ngClass]="priorityClass(form.get('priority')?.value)">
                  {{ formatPriority(form.get('priority')?.value) }}
                </span>
                <span class="preview-date" *ngIf="form.get('dueDate')?.value">
                  Due {{ form.get('dueDate')?.value }}
                </span>
              </div>

              <p class="preview-title">{{ form.get('title')?.value || 'New card title' }}</p>
              <p class="preview-text">
                {{ form.get('description')?.value || 'Your card preview updates as you fill in the details.' }}
              </p>
            </div>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end" class="dialog-actions">
          <button mat-button type="button" class="dialog-cancel" (click)="onCancel()">Cancel</button>
          <button mat-flat-button color="primary" class="dialog-submit" type="submit" [disabled]="form.invalid">
            {{ dialogMode === 'edit' ? 'Save changes' : 'Create card' }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .dialog-shell {
      width: min(92vw, 36rem);
      padding: 1.4rem;
      display: flex;
      flex-direction: column;
      background:
        radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 14rem),
        linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
    }

    .dialog-hero {
      display: grid;
      grid-template-columns: 3.25rem 1fr;
      gap: 1rem;
      align-items: start;
      margin-bottom: 1.35rem;
    }

    .dialog-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 3.25rem;
      height: 3.25rem;
      border-radius: 1rem;
      background: linear-gradient(135deg, #1d4ed8, #0f172a);
      color: #fff;
      box-shadow: 0 16px 34px rgba(29, 78, 216, 0.18);
    }

    .dialog-copy-block {
      min-width: 0;
    }

    .dialog-eyebrow {
      margin: 0;
      color: #2563eb;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }

    .dialog-title {
      margin: 0.45rem 0 0;
      padding: 0;
      color: #0f172a;
      font-size: 1.1rem;
      font-weight: 800;
      line-height: 1.2;
    }

    .dialog-copy {
      margin: 0.55rem 0 0;
      color: #475569;
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .dialog-content {
      padding: 0 0 1rem !important;
      overflow: visible;
      max-height: none;
    }

    .dialog-grid {
      display: grid;
      gap: 1rem;
    }

    .field-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 1rem;
    }

    .field-block {
      display: grid;
      gap: 0.45rem;
    }

    .field-label {
      color: #0f172a;
      font-size: 0.88rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .field-input {
      width: 100%;
      height: 3rem;
      border: 1px solid #d7deea;
      border-radius: 0.95rem;
      background: #f8fafc;
      color: #0f172a;
      font: inherit;
      font-size: 1rem;
      line-height: 1.4;
      padding: 0 0.95rem;
      outline: none;
      transition: border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease;
    }

    .field-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
      background: #ffffff;
    }

    .field-input::placeholder {
      color: #94a3b8;
    }

    .field-textarea {
      min-height: 7.25rem;
      height: 7.25rem;
      padding-top: 0.8rem;
      padding-bottom: 0.8rem;
      resize: vertical;
    }

    select.field-input {
      appearance: none;
      background-image:
        linear-gradient(45deg, transparent 50%, #64748b 50%),
        linear-gradient(135deg, #64748b 50%, transparent 50%);
      background-position:
        calc(100% - 1.1rem) calc(50% - 0.12rem),
        calc(100% - 0.78rem) calc(50% - 0.12rem);
      background-size: 0.36rem 0.36rem, 0.36rem 0.36rem;
      background-repeat: no-repeat;
      padding-right: 2.2rem;
    }

    .field-help {
      color: #64748b;
      font-size: 0.78rem;
      line-height: 1.55;
    }

    .field-error {
      color: #dc2626;
    }

    .card-preview {
      border-radius: 1.1rem;
      background:
        radial-gradient(circle at top right, rgba(59, 130, 246, 0.08), transparent 9rem),
        linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
      border: 1px solid rgba(215, 222, 234, 0.9);
      padding: 1rem;
      margin-bottom: 0.4rem;
    }

    .preview-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .priority-pill {
      display: inline-flex;
      align-items: center;
      border-radius: 9999px;
      padding: 0.45rem 0.8rem;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .priority-pill.low {
      background: rgba(34, 197, 94, 0.14);
      color: #166534;
    }

    .priority-pill.medium {
      background: rgba(245, 158, 11, 0.16);
      color: #b45309;
    }

    .priority-pill.high {
      background: rgba(249, 115, 22, 0.16);
      color: #c2410c;
    }

    .priority-pill.critical {
      background: rgba(239, 68, 68, 0.16);
      color: #b91c1c;
    }

    .preview-date {
      color: #64748b;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .preview-title {
      margin: 0.8rem 0 0;
      color: #0f172a;
      font-size: 1.1rem;
      font-weight: 800;
      line-height: 1.3;
    }

    .preview-text {
      margin: 0.35rem 0 0;
      color: #475569;
      font-size: 0.9rem;
      line-height: 1.55;
    }

    .dialog-actions {
      gap: 0.75rem;
      padding: 1rem 0 0 !important;
      margin-top: 0.2rem;
      border-top: 1px solid rgba(226, 232, 240, 0.95);
      background: linear-gradient(180deg, rgba(255, 255, 255, 0), #ffffff 38%);
      flex-shrink: 0;
    }

    .dialog-cancel,
    .dialog-submit {
      min-height: 2.75rem;
      border-radius: 9999px;
      padding-inline: 1rem;
    }

    .dialog-submit {
      box-shadow: 0 14px 28px rgba(2, 132, 199, 0.18);
    }

    @media (max-width: 639px) {
      .dialog-shell {
        width: min(95vw, 36rem);
        padding: 1.1rem;
      }

      .dialog-hero {
        grid-template-columns: 1fr;
        gap: 0.85rem;
      }

      .field-row {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
  `]
})
export class CreateCardDialogComponent implements OnInit {
  readonly dialogMode: 'create' | 'edit';
  form: FormGroup;
  priorities: CardPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  boardMembers: BoardMember[] = [];
  workspaceMembers: WorkspaceMember[] = [];
  assignableUsers: Record<number, User> = {};
  loadingAssignees = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateCardDialogComponent>,
    private boardService: BoardService,
    private workspaceService: WorkspaceService,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA) public data: CreateCardDialogData
  ) {
    this.dialogMode = data?.mode ?? 'create';
    this.form = this.fb.group({
      title: [data.card?.title ?? '', Validators.required],
      description: [data.card?.description ?? ''],
      priority: [data.card?.priority ?? 'MEDIUM', Validators.required],
      dueDate: [data.card?.dueDate ?? ''],
      assigneeId: [data.card?.assigneeId != null ? String(data.card.assigneeId) : ''],
      listId: [data.card?.listId ?? data.listId],
      boardId: [data.card?.boardId ?? data.boardId]
    });
  }

  ngOnInit(): void {
    this.loadAssignableMembers();
  }

  showTitleError(): boolean {
    const control = this.form.get('title');
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  formatPriority(priority: CardPriority | null | undefined): string {
    return (priority || 'MEDIUM').toLowerCase().replace(/^\w/, (char) => char.toUpperCase());
  }

  priorityClass(priority: CardPriority | null | undefined): string {
    return (priority || 'MEDIUM').toLowerCase();
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const parsedAssigneeId =
      value.assigneeId === '' || value.assigneeId === null || value.assigneeId === undefined
        ? undefined
        : Number(value.assigneeId);
    const payload: Partial<CreateCardRequest> = {
      title: value.title.trim(),
      description: value.description?.trim() || undefined,
      priority: value.priority,
      dueDate: value.dueDate || undefined,
      assigneeId: Number.isFinite(parsedAssigneeId as number) ? parsedAssigneeId : undefined,
      listId: value.listId,
      boardId: value.boardId,
    };

    this.dialogRef.close(payload);
  }

  get assignableMembers(): Array<{ userId: number; role: string }> {
    return this.workspaceMembers.length ? this.workspaceMembers : this.boardMembers;
  }

  getAssignableMemberLabel(userId: number): string {
    const user = this.assignableUsers[userId];
    if (!user) {
      return `User #${userId}`;
    }

    return user.username || user.fullName || `User #${userId}`;
  }

  trackByAssignableMember(_: number, member: { userId: number }): number {
    return member.userId;
  }

  private loadAssignableMembers(): void {
    this.loadingAssignees = true;

    if (this.data.workspaceId) {
      this.boardService.getMembers(this.data.boardId).pipe(
        catchError(() => of([] as BoardMember[]))
      ).subscribe((boardMembers) => {
        this.boardMembers = boardMembers;
        this.workspaceService.getMembers(this.data.workspaceId!).pipe(
          catchError(() => of([] as WorkspaceMember[]))
        ).subscribe((members) => {
          this.workspaceMembers = members;
          const userIds = Array.from(new Set([
            ...members.map(member => member.userId),
            ...boardMembers.map(member => member.userId),
          ]));
          this.loadAssignableUsers(userIds, () => this.loadingAssignees = false);
        });
      });
      return;
    }

    forkJoin({
      board: this.boardService.getById(this.data.boardId).pipe(catchError(() => of(null))),
      boardMembers: this.boardService.getMembers(this.data.boardId).pipe(catchError(() => of([] as BoardMember[]))),
    }).subscribe(({ board, boardMembers }) => {
      this.boardMembers = boardMembers;

      if (!board) {
        this.loadAssignableUsers(boardMembers.map(member => member.userId), () => this.loadingAssignees = false);
        return;
      }

      this.workspaceService.getMembers(board.workspaceId).pipe(
        catchError(() => of([] as WorkspaceMember[]))
      ).subscribe((members) => {
        this.workspaceMembers = members;
        const userIds = Array.from(new Set([
          ...members.map(member => member.userId),
          ...boardMembers.map(member => member.userId),
        ]));
        this.loadAssignableUsers(userIds, () => this.loadingAssignees = false);
      });
    });
  }

  private loadAssignableUsers(userIds: number[], onComplete?: () => void): void {
    const unresolvedIds = userIds.filter(userId => !this.assignableUsers[userId]);

    if (!unresolvedIds.length) {
      onComplete?.();
      return;
    }

    forkJoin(
      unresolvedIds.map(userId =>
        this.authService.getUserById(userId).pipe(catchError(() => of(null)))
      )
    ).subscribe((users) => {
      const nextAssignableUsers = { ...this.assignableUsers };

      users
        .filter((user): user is User => !!user)
        .forEach((user) => {
          nextAssignableUsers[user.id] = user;
        });

      this.assignableUsers = nextAssignableUsers;
      onComplete?.();
    });
  }
}
