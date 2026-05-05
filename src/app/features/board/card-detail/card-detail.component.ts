import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Store } from '@ngrx/store';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Card, CardPriority, CardStatus } from '../../../core/models/card.model';
import { Comment, Attachment } from '../../../core/models/comment.model';
import { Label, Checklist } from '../../../core/models/label.model';
import { CardService } from '../../../core/services/card.service';
import { CommentService } from '../../../core/services/comment.service';
import { LabelService } from '../../../core/services/label.service';
import { AuthService } from '../../../core/auth/auth.service';
import { BoardService } from '../../../core/services/board.service';
import { BoardMember } from '../../../core/models/board.model';
import { User } from '../../../core/models/user.model';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { WorkspaceMember } from '../../../core/models/workspace.model';
import { environment } from '../../../../environments/environment';
import * as BoardActions from '../../../store/board/board.actions';
import { PromptDialogComponent } from '../../../shared/components/prompt-dialog/prompt-dialog.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-card-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatChipsModule,
    MatProgressBarModule, MatSnackBarModule, MatDatepickerModule,
    MatNativeDateModule, MatDividerModule, TimeAgoPipe, MatIconModule
  ],
  styles: [`
    .card-back-button {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      align-self: flex-start;
      min-height: 2.5rem;
      padding: 0.55rem 0.95rem !important;
      border-radius: 9999px !important;
      border: 1px solid rgba(203, 213, 225, 0.95) !important;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.96)) !important;
      color: #334155 !important;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
      transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, color 180ms ease;
    }

    .card-back-button:hover {
      transform: translateY(-1px);
      border-color: rgba(14, 165, 233, 0.45) !important;
      color: #0369a1 !important;
      box-shadow: 0 14px 28px rgba(14, 165, 233, 0.12);
    }

    .card-back-button:focus-visible {
      outline: none;
      box-shadow:
        0 0 0 3px rgba(186, 230, 253, 0.9),
        0 14px 28px rgba(14, 165, 233, 0.14);
    }

    .card-back-icon {
      margin: 0 !important;
      width: 1rem;
      height: 1rem;
      font-size: 1rem;
    }
  `],
  template: `
    <div class="flex h-full min-h-[600px]">
      <!-- Main Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Cover Bar -->
        <div *ngIf="card.coverColor !== '#FFFFFF'"
             class="h-8 rounded-lg mb-4 -mx-6 -mt-6"
             [style.background]="card.coverColor"></div>

        <div class="mb-4 flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h2 class="text-xl font-bold text-gray-800 mb-1 cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1"
                contenteditable="true"
                (blur)="updateTitle($event)">{{ card.title }}</h2>

            <p class="text-xs text-gray-400">in list <strong>{{ card.listId }}</strong></p>
          </div>

          <button
            mat-stroked-button
            type="button"
            class="card-back-button"
            (click)="closePanel()"
            aria-label="Go back"
          >
            <mat-icon class="card-back-icon">arrow_back</mat-icon>
            <span>Back</span>
          </button>
        </div>

        <!-- Labels -->
        <div class="mb-4">
          <div class="mb-2 flex items-center justify-between gap-3">
            <p class="text-xs font-semibold text-gray-500 uppercase">Labels</p>
            <button
              type="button"
              class="rounded border border-gray-200 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 transition hover:border-primary hover:text-primary"
              (click)="showLabelManager = !showLabelManager"
            >
              {{ showLabelManager ? 'Close' : 'Manage' }}
            </button>
          </div>

          <div *ngIf="labels.length; else emptyLabels" class="flex flex-wrap gap-2">
            <span *ngFor="let label of labels"
                  class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-white"
                  [style.background]="label.color">
              {{ label.name }}
              <button
                type="button"
                class="rounded-full bg-white/20 px-1.5 py-0 text-[10px] font-bold leading-none text-white transition hover:bg-white/30"
                (click)="removeLabel(label)"
                aria-label="Remove label"
              >
                x
              </button>
            </span>
          </div>

          <ng-template #emptyLabels>
            <p class="text-sm text-gray-400">No labels on this card yet.</p>
          </ng-template>

          <div *ngIf="showLabelManager" class="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
            <p class="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Board Labels</p>

            <div *ngIf="boardLabels.length; else noBoardLabels" class="flex flex-wrap gap-2">
              <button
                *ngFor="let label of boardLabels"
                type="button"
                class="rounded-full border px-3 py-1 text-xs font-semibold text-white transition hover:scale-[1.02]"
                [style.background]="label.color"
                [style.borderColor]="label.color"
                (click)="toggleCardLabel(label)"
              >
                {{ isLabelAssigned(label.id) ? 'Remove' : 'Add' }} {{ label.name }}
              </button>
            </div>

            <ng-template #noBoardLabels>
              <p class="text-sm text-gray-400">No board labels yet. Create the first one below.</p>
            </ng-template>

            <div class="mt-4 border-t border-gray-200 pt-3">
              <p class="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Create Label</p>
              <div class="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  [(ngModel)]="newLabelName"
                  placeholder="Label name"
                  class="min-w-[12rem] flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                <input
                  type="color"
                  [(ngModel)]="newLabelColor"
                  class="h-10 w-12 cursor-pointer rounded border border-gray-200 bg-white p-1"
                >
                <button
                  mat-flat-button
                  color="primary"
                  type="button"
                  [disabled]="!newLabelName.trim() || creatingLabel"
                  (click)="createLabel()"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="mb-6">
          <p class="text-sm font-semibold text-gray-600 mb-2">Description</p>
          <textarea class="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                    [(ngModel)]="description"
                    (blur)="updateDescription()"
                    placeholder="Add a description..."></textarea>
        </div>

        <!-- Attachments -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-semibold text-gray-600">Attachments</p>
            <button type="button" 
                    class="text-xs text-primary font-bold hover:underline"
                    (click)="fileInput.click()">+ Upload File</button>
            <input #fileInput type="file" (change)="onFileSelected($event)" class="hidden">
          </div>
          
          <div *ngIf="attachments.length; else noAttachments" class="grid grid-cols-1 gap-2">
            <div *ngFor="let att of attachments" 
                 class="flex items-center gap-3 p-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition group">
              <div class="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                <mat-icon *ngIf="!isImage(att.fileType)">insert_drive_file</mat-icon>
                <img *ngIf="isImage(att.fileType)" [src]="getAttachmentUrl(att.fileUrl)" class="w-full h-full object-cover rounded">
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-700 truncate">{{ att.fileName }}</p>
                <p class="text-[10px] text-gray-400">{{ att.sizeKb }} KB • {{ att.fileType }}</p>
              </div>
              <div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                <a [href]="getAttachmentUrl(att.fileUrl)" 
                   target="_blank"
                   class="p-1 hover:bg-gray-200 rounded text-gray-500">
                  <mat-icon class="text-lg">download</mat-icon>
                </a>
                <button (click)="removeAttachment(att.id)" 
                        class="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-500">
                  <mat-icon class="text-lg">delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
          <ng-template #noAttachments>
            <p class="text-sm text-gray-400">No attachments yet.</p>
          </ng-template>

          <!-- Uploading State -->
          <div *ngIf="isUploading" class="mt-2">
            <p class="text-[10px] text-primary font-bold animate-pulse mb-1 uppercase tracking-wider">Uploading file...</p>
            <mat-progress-bar mode="indeterminate" class="h-1 rounded"></mat-progress-bar>
          </div>
        </div>

        <!-- Checklists -->
        <div *ngFor="let checklist of checklists" class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-semibold text-gray-600">{{ checklist.title }}</p>
            <span class="text-xs text-gray-400">{{ getProgress(checklist) }}%</span>
          </div>
          <mat-progress-bar mode="determinate" [value]="getProgress(checklist)" class="mb-3 rounded"></mat-progress-bar>
          <div *ngFor="let item of checklist.items" class="flex items-center gap-2 py-1">
            <input type="checkbox" [checked]="item.isCompleted"
                   (change)="toggleItem(item.id)"
                   class="w-4 h-4 accent-primary cursor-pointer">
            <span class="text-sm" [class.line-through]="item.isCompleted" [class.text-gray-400]="item.isCompleted">
              {{ item.text }}
            </span>
          </div>
          <div class="mt-2 flex gap-2">
            <input #newItemInput type="text" placeholder="Add an item"
                   class="flex-1 border border-gray-200 rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
            <button mat-flat-button color="primary" class="text-sm h-8"
                    (click)="addChecklistItem(checklist.id, newItemInput.value); newItemInput.value = ''">
              Add
            </button>
          </div>
        </div>

        <!-- Comments -->
        <mat-divider class="my-4"></mat-divider>
        <div class="mb-4">
          <p class="text-sm font-semibold text-gray-600 mb-3">
            Activity <span class="text-gray-400 font-normal">({{ comments.length }})</span>
          </p>

          <!-- New Comment -->
          <div class="flex gap-3 mb-4">
            <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {{ currentUserInitial }}
            </div>
            <div class="flex-1 relative">
              <textarea #commentInput
                        class="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="2"
                        [(ngModel)]="newComment"
                        (input)="onCommentInput($event)"
                        (keydown)="onCommentKeyDown($event)"
                        placeholder="Write a comment... Use @ to mention someone"></textarea>
              
              <!-- Mention Dropdown -->
              <div *ngIf="showMentionDropdown" 
                   class="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                <div class="p-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mention Member</span>
                  <span class="text-[10px] text-gray-400">↑↓ to navigate</span>
                </div>
                <div class="max-h-48 overflow-y-auto">
                  <div *ngFor="let member of filteredMentionMembers; let i = index"
                       (click)="selectMention(member)"
                       class="flex items-center gap-3 p-3 cursor-pointer transition"
                       [class.bg-primary]="i === mentionIndex"
                       [class.text-white]="i === mentionIndex"
                       [class.hover:bg-gray-50]="i !== mentionIndex">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                         [style.background]="i === mentionIndex ? 'rgba(255,255,255,0.2)' : '#e2e8f0'">
                      {{ getCommentAuthorInitials(member.userId) }}
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-semibold">{{ getCommentAuthorLabel(member.userId) }}</span>
                      <span class="text-[10px]" [class]="i === mentionIndex ? 'text-white/80' : 'text-gray-400'">
                        &#64;{{ getMemberUsername(member.userId) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div *ngIf="!filteredMentionMembers.length" class="p-4 text-center text-sm text-gray-400">
                  No members found
                </div>
              </div>

              <button mat-flat-button color="primary" class="mt-1 text-sm h-8"
                      type="button"
                      [disabled]="!newComment.trim() || savingComment"
                      (click)="addComment()">Save</button>
            </div>
          </div>

          <!-- Existing Comments -->
          <div *ngFor="let comment of comments" class="flex gap-3 mb-6 group">
            <div class="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {{ getCommentAuthorInitials(comment.authorId) }}
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-700">{{ getCommentAuthorLabel(comment.authorId) }}</span>
                  <span class="text-xs text-gray-400">{{ comment.createdAt | timeAgo }}</span>
                </div>
                
                <!-- Comment Actions -->
                <div class="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition">
                  <button *ngIf="!comment.isDeleted" 
                          class="text-[10px] uppercase font-bold text-gray-400 hover:text-primary"
                          (click)="startReplying(comment.id)">Reply</button>
                  
                  <ng-container *ngIf="isCommentOwner(comment.authorId) && !comment.isDeleted">
                    <button class="text-[10px] uppercase font-bold text-gray-400 hover:text-primary"
                            (click)="startEditingComment(comment)">Edit</button>
                    <button class="text-[10px] uppercase font-bold text-gray-400 hover:text-red-500"
                            (click)="deleteComment(comment.id)">Delete</button>
                  </ng-container>
                </div>
              </div>

              <!-- Inline Editor -->
              <div *ngIf="editingCommentId === comment.id; else commentContent">
                <textarea class="w-full border border-primary rounded-lg p-2 text-sm resize-none focus:outline-none bg-white"
                          rows="2"
                          [(ngModel)]="editingContent"></textarea>
                <div class="flex gap-2 mt-1">
                  <button class="text-[10px] px-3 py-1 bg-primary text-white rounded font-bold uppercase"
                          (click)="saveCommentEdit(comment.id)">Save</button>
                  <button class="text-[10px] px-3 py-1 bg-gray-100 text-gray-500 rounded font-bold uppercase hover:bg-gray-200"
                          (click)="cancelEditing()">Cancel</button>
                </div>
              </div>

              <ng-template #commentContent>
                <p *ngIf="!comment.isDeleted" class="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                  {{ comment.content }}
                </p>
                <p *ngIf="comment.isDeleted" class="text-sm text-gray-400 italic">Comment deleted</p>
              </ng-template>

              <!-- Reply Input Box -->
              <div *ngIf="replyingToCommentId === comment.id" class="mt-3">
                <textarea class="w-full border border-primary rounded-lg p-2 text-sm resize-none focus:outline-none bg-white"
                          rows="2" placeholder="Write a reply..."
                          [(ngModel)]="newReplyContent"></textarea>
                <div class="flex gap-2 mt-1">
                  <button class="text-[10px] px-3 py-1 bg-primary text-white rounded font-bold uppercase disabled:opacity-50"
                          [disabled]="!newReplyContent.trim() || savingComment"
                          (click)="addReply(comment.id)">Reply</button>
                  <button class="text-[10px] px-3 py-1 bg-gray-100 text-gray-500 rounded font-bold uppercase hover:bg-gray-200"
                          (click)="cancelReplying()">Cancel</button>
                </div>
              </div>

              <!-- Replies Thread -->
              <div *ngIf="repliesMap[comment.id]?.length" class="mt-4 pl-4 border-l-2 border-gray-100 space-y-4">
                <div *ngFor="let reply of repliesMap[comment.id]" class="flex gap-3 group">
                  <div class="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                    {{ getCommentAuthorInitials(reply.authorId) }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-medium text-gray-700">{{ getCommentAuthorLabel(reply.authorId) }}</span>
                        <span class="text-[10px] text-gray-400">{{ reply.createdAt | timeAgo }}</span>
                      </div>
                      
                      <!-- Reply Actions -->
                      <div class="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition">
                        <ng-container *ngIf="isCommentOwner(reply.authorId) && !reply.isDeleted">
                          <button class="text-[9px] uppercase font-bold text-gray-400 hover:text-primary"
                                  (click)="startEditingComment(reply)">Edit</button>
                          <button class="text-[9px] uppercase font-bold text-gray-400 hover:text-red-500"
                                  (click)="deleteComment(reply.id)">Delete</button>
                        </ng-container>
                      </div>
                    </div>

                    <!-- Reply Inline Editor -->
                    <div *ngIf="editingCommentId === reply.id; else replyContent">
                      <textarea class="w-full border border-primary rounded-lg p-2 text-sm resize-none focus:outline-none bg-white"
                                rows="2"
                                [(ngModel)]="editingContent"></textarea>
                      <div class="flex gap-2 mt-1">
                        <button class="text-[10px] px-3 py-1 bg-primary text-white rounded font-bold uppercase"
                                (click)="saveCommentEdit(reply.id)">Save</button>
                        <button class="text-[10px] px-3 py-1 bg-gray-100 text-gray-500 rounded font-bold uppercase hover:bg-gray-200"
                                (click)="cancelEditing()">Cancel</button>
                      </div>
                    </div>

                    <ng-template #replyContent>
                      <p *ngIf="!reply.isDeleted" class="text-sm text-gray-600 bg-gray-50 rounded-lg p-2">
                        {{ reply.content }}
                      </p>
                      <p *ngIf="reply.isDeleted" class="text-sm text-gray-400 italic">Reply deleted</p>
                    </ng-template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="w-48 border-l p-4 space-y-4 bg-gray-50 flex-shrink-0">
        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase mb-2">Assignee</p>
          <select class="w-full text-sm border border-gray-200 rounded p-1.5 bg-white"
                  [(ngModel)]="selectedAssigneeId"
                  [ngModelOptions]="{ standalone: true }"
                  (ngModelChange)="onAssigneeChange($event)">
            <option value="">Unassigned</option>
            <option *ngFor="let member of assignableMembers; trackBy: trackByAssignableMember" [value]="member.userId.toString()">
              {{ getAssignableMemberLabel(member.userId) }}
            </option>
          </select>
          <span class="text-xs text-gray-400 mt-1 block">
            Assign this card to a workspace member.
          </span>
        </div>

        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase mb-2">Status</p>
          <select class="w-full text-sm border border-gray-200 rounded p-1.5 bg-white"
                  [(ngModel)]="card.status" (change)="updateStatus()">
            <option *ngFor="let s of statuses" [value]="s">{{ s.replace('_', ' ') }}</option>
          </select>
        </div>

        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase mb-2">Priority</p>
          <select class="w-full text-sm border border-gray-200 rounded p-1.5 bg-white"
                  [(ngModel)]="card.priority" (change)="updatePriority()">
            <option *ngFor="let p of priorities" [value]="p">{{ p }}</option>
          </select>
        </div>

        <div>
          <p class="text-xs font-semibold text-gray-500 uppercase mb-2">Due Date</p>
          <input type="date" class="w-full text-sm border border-gray-200 rounded p-1.5 bg-white"
                 [value]="card.dueDate" (change)="updateDueDate($event)">
          <span *ngIf="card.isOverdue" class="text-xs text-red-500 mt-1 block">Overdue!</span>
        </div>

        <mat-divider></mat-divider>

        <button mat-stroked-button color="warn" class="w-full text-xs h-8"
                (click)="archiveCard()">Archive Card</button>

        <button mat-stroked-button class="w-full text-xs h-8"
                (click)="addChecklist()">+ Checklist</button>
      </div>
    </div>
  `
})
export class CardDetailComponent implements OnInit {
  card: Card;
  comments: Comment[] = [];
  attachments: Attachment[] = [];
  labels: Label[] = [];
  boardLabels: Label[] = [];
  checklists: Checklist[] = [];
  boardMembers: BoardMember[] = [];
  workspaceMembers: WorkspaceMember[] = [];
  commentAuthors: Record<number, User> = {};
  assignableUsers: Record<number, User> = {};
  description = '';
  newComment = '';
  currentUserInitial = '?';
  selectedAssigneeId = '';
  savingComment = false;
  showLabelManager = false;
  creatingLabel = false;
  newLabelName = '';
  newLabelColor = '#2563eb';
  isUploading = false;
  priorities: CardPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  statuses: CardStatus[] = ['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];

  // Mention State
  showMentionDropdown = false;
  filteredMentionMembers: BoardMember[] = [];
  mentionIndex = 0;
  mentionTriggerPos = -1;
  mentionSearchTerm = '';

  // Comment Edit State
  editingCommentId: number | null = null;
  editingContent = '';

  // Reply State
  replyingToCommentId: number | null = null;
  newReplyContent = '';
  repliesMap: Record<number, Comment[]> = {};

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { card: Card; workspaceId?: number },
    private dialogRef: MatDialogRef<CardDetailComponent>,
    private cardService: CardService,
    private commentService: CommentService,
    private labelService: LabelService,
    private authService: AuthService,
    private boardService: BoardService,
    private workspaceService: WorkspaceService,
    private store: Store,
    private dialog: MatDialog,
    private snack: MatSnackBar
  ) {
    this.card = { ...data.card };
    this.description = this.card.description || '';
    this.selectedAssigneeId = this.card.assigneeId != null ? String(this.card.assigneeId) : '';
  }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) this.currentUserInitial = user.fullName[0].toUpperCase();

    forkJoin({
      comments: this.commentService.getByCard(this.card.id),
      labels: this.labelService.getForCard(this.card.id),
      boardLabels: this.labelService.getLabelsByBoard(this.card.boardId),
      checklists: this.labelService.getChecklists(this.card.id),
      boardMembers: this.boardService.getMembers(this.card.boardId),
      board: this.boardService.getById(this.card.boardId),
      attachments: this.commentService.getAttachments(this.card.id)
    }).subscribe(({ comments, labels, boardLabels, checklists, boardMembers, board, attachments }) => {
      this.comments = comments;
      this.labels = labels;
      this.boardLabels = boardLabels;
      this.checklists = checklists;
      this.boardMembers = boardMembers;
      this.attachments = attachments;
      this.loadCommentAuthors(comments);
      this.loadAssignableMembers(this.data.workspaceId ?? board.workspaceId, boardMembers);
      
      // Fetch replies for each comment
      this.comments.forEach(comment => this.loadReplies(comment.id));
    });
  }

  updateTitle(event: Event): void {
    const el = event.target as HTMLElement;
    const newTitle = el.innerText.trim();
    if (newTitle && newTitle !== this.card.title) {
      this.cardService.update(this.card.id, { title: newTitle } as any).subscribe(updated => {
        this.card = updated;
        this.store.dispatch(BoardActions.updateCard({ card: updated }));
      });
    }
  }

  updateDescription(): void {
    this.cardService.update(this.card.id, { description: this.description } as any).subscribe(updated => {
      this.card = updated;
      this.store.dispatch(BoardActions.updateCard({ card: updated }));
    });
  }

  updateStatus(): void {
    this.cardService.setStatus(this.card.id, this.card.status).subscribe(updated => {
      this.card = updated;
      this.store.dispatch(BoardActions.updateCard({ card: updated }));
    });
  }

  updatePriority(): void {
    this.cardService.setPriority(this.card.id, this.card.priority).subscribe(updated => {
      this.card = updated;
      this.store.dispatch(BoardActions.updateCard({ card: updated }));
    });
  }

  updateAssignee(value: string): void {
    const assigneeId = value === '' ? null : Number(value);
    this.selectedAssigneeId = value;

    this.cardService.setAssignee(this.card.id, assigneeId).subscribe(updated => {
      this.card = updated;
      this.selectedAssigneeId = updated.assigneeId != null ? String(updated.assigneeId) : '';
      this.store.dispatch(BoardActions.updateCard({ card: updated }));
      this.snack.open(
        updated.assigneeId ? `Assigned to ${this.getAssignableMemberLabel(updated.assigneeId)}` : 'Card unassigned',
        'Close',
        { duration: 2500 }
      );
    }, (err) => {
      this.selectedAssigneeId = this.card.assigneeId != null ? String(this.card.assigneeId) : '';
      const message = err?.error?.message || err?.message || 'Failed to update assignee';
      this.snack.open(message, 'Close', { duration: 4000 });
    });
  }

  onAssigneeChange(value: string | null | undefined): void {
    const nextValue = value ?? '';
    if (nextValue === (this.card.assigneeId != null ? String(this.card.assigneeId) : '')) {
      return;
    }
    this.updateAssignee(nextValue);
  }

  updateDueDate(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.cardService.update(this.card.id, { dueDate: val } as any).subscribe(updated => {
      this.card = updated;
      this.store.dispatch(BoardActions.updateCard({ card: updated }));
    });
  }

  addComment(): void {
    if (!this.newComment.trim()) return;
    this.savingComment = true;
    this.commentService.add(this.card.id, this.newComment).subscribe({
      next: (comment) => {
        this.comments = [...this.comments, comment];
        this.newComment = '';
        this.loadCommentAuthors([comment]);
        this.snack.open('Comment saved', 'Close', { duration: 2000 });
        this.savingComment = false;
      },
      error: (err) => {
        const message = err?.error?.message || err?.message || 'Failed to save comment';
        this.snack.open(message, 'Close', { duration: 4000 });
        this.savingComment = false;
      }
    });
  }

  loadReplies(commentId: number): void {
    this.commentService.getReplies(commentId).subscribe(replies => {
      this.repliesMap[commentId] = replies;
      this.loadCommentAuthors(replies);
    });
  }

  startReplying(commentId: number): void {
    this.replyingToCommentId = commentId;
    this.newReplyContent = '';
  }

  cancelReplying(): void {
    this.replyingToCommentId = null;
    this.newReplyContent = '';
  }

  addReply(parentCommentId: number): void {
    if (!this.newReplyContent.trim() || this.savingComment) return;
    this.savingComment = true;

    this.commentService.add(this.card.id, this.newReplyContent, parentCommentId).subscribe({
      next: (reply) => {
        if (!this.repliesMap[parentCommentId]) {
          this.repliesMap[parentCommentId] = [];
        }
        this.repliesMap[parentCommentId] = [...this.repliesMap[parentCommentId], reply];
        this.loadCommentAuthors([reply]);
        this.cancelReplying();
        this.snack.open('Reply saved', 'Close', { duration: 2000 });
        this.savingComment = false;
      },
      error: (err) => {
        const message = err?.error?.message || err?.message || 'Failed to save reply';
        this.snack.open(message, 'Close', { duration: 4000 });
        this.savingComment = false;
      }
    });
  }

  isCommentOwner(authorId: number): boolean {
    const user = this.authService.getCurrentUser();
    return user ? user.id === authorId : false;
  }

  startEditingComment(comment: Comment): void {
    this.editingCommentId = comment.id;
    this.editingContent = comment.content;
  }

  cancelEditing(): void {
    this.editingCommentId = null;
    this.editingContent = '';
  }

  saveCommentEdit(commentId: number): void {
    if (!this.editingContent.trim()) return;
    
    this.commentService.update(commentId, this.editingContent).subscribe({
      next: (updated) => {
        if (updated.parentCommentId) {
          const parentId = updated.parentCommentId;
          if (this.repliesMap[parentId]) {
            this.repliesMap[parentId] = this.repliesMap[parentId].map(c => c.id === commentId ? updated : c);
          }
        } else {
          this.comments = this.comments.map(c => c.id === commentId ? updated : c);
        }
        this.cancelEditing();
        this.snack.open('Comment updated', 'Close', { duration: 2000 });
      },
      error: (err) => {
        const message = err?.error?.message || err?.message || 'Failed to update comment';
        this.snack.open(message, 'Close', { duration: 4000 });
      }
    });
  }

  deleteComment(commentId: number): void {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    this.commentService.delete(commentId).subscribe({
      next: () => {
        // Try deleting from top-level comments
        let foundTopLevel = false;
        this.comments = this.comments.map(c => {
          if (c.id === commentId) {
            foundTopLevel = true;
            return { ...c, isDeleted: true, content: '[deleted]' };
          }
          return c;
        });

        // If not found in top-level, search in replies
        if (!foundTopLevel) {
          for (const parentId of Object.keys(this.repliesMap)) {
            const pId = Number(parentId);
            const replies = this.repliesMap[pId];
            if (replies.find(r => r.id === commentId)) {
              this.repliesMap[pId] = replies.map(r => r.id === commentId ? { ...r, isDeleted: true, content: '[deleted]' } : r);
              break;
            }
          }
        }

        this.snack.open('Comment deleted', 'Close', { duration: 2000 });
      },
      error: (err) => {
        const message = err?.error?.message || err?.message || 'Failed to delete comment';
        this.snack.open(message, 'Close', { duration: 4000 });
      }
    });
  }

  toggleItem(itemId: number): void {
    this.labelService.toggleItem(itemId).subscribe(updated => {
      this.checklists = this.checklists.map(cl => ({
        ...cl,
        items: cl.items.map(i => i.id === itemId ? updated : i)
      }));
    });
  }

  addChecklistItem(checklistId: number, text: string): void {
    if (!text.trim()) return;
    this.labelService.addItem(checklistId, text).subscribe(item => {
      this.checklists = this.checklists.map(cl =>
        cl.id === checklistId ? { ...cl, items: [...cl.items, item] } : cl
      );
    });
  }

  addChecklist(): void {
    const dialogRef = this.dialog.open(PromptDialogComponent, {
      width: '420px',
      maxWidth: '94vw',
      autoFocus: false,
      data: {
        title: 'Create Checklist',
        message: 'Give this checklist a clear title so the next steps are easy to scan.',
        placeholder: 'Checklist title',
        confirmText: 'Create',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe((title?: string | null) => {
      if (!title) {
        return;
      }

      this.labelService.createChecklist(this.card.id, title).subscribe(cl => {
        this.checklists = [...this.checklists, { ...cl, items: [] }];
      });
    });
  }

  archiveCard(): void {
    this.cardService.archive(this.card.id).subscribe(() => {
      this.store.dispatch(BoardActions.archiveCard({ cardId: this.card.id }));
      this.snack.open('Card archived', 'Close', { duration: 2000 });
      this.dialogRef.close();
    });
  }

  getProgress(checklist: Checklist): number {
    if (!checklist.items.length) return 0;
    const done = checklist.items.filter(i => i.isCompleted).length;
    return Math.round((done / checklist.items.length) * 100);
  }

  closePanel(): void {
    this.dialogRef.close();
  }

  isLabelAssigned(labelId: number): boolean {
    return this.labels.some(label => label.id === labelId);
  }

  toggleCardLabel(label: Label): void {
    if (this.isLabelAssigned(label.id)) {
      this.removeLabel(label);
      return;
    }

    this.labelService.addToCard(this.card.id, label.id).subscribe({
      next: () => {
        this.labels = [...this.labels, label];
        this.snack.open(`Added label "${label.name}"`, 'Close', { duration: 2000 });
      },
      error: (err) => {
        const message = err?.error?.message || err?.message || 'Failed to add label';
        this.snack.open(message, 'Close', { duration: 4000 });
      }
    });
  }

  removeLabel(label: Label): void {
    this.labelService.removeFromCard(this.card.id, label.id).subscribe({
      next: () => {
        this.labels = this.labels.filter(item => item.id !== label.id);
        this.snack.open(`Removed label "${label.name}"`, 'Close', { duration: 2000 });
      },
      error: (err) => {
        const message = err?.error?.message || err?.message || 'Failed to remove label';
        this.snack.open(message, 'Close', { duration: 4000 });
      }
    });
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    this.isUploading = true;
    this.commentService.upload(this.card.id, file).subscribe({
      next: (att) => {
        this.attachments = [...this.attachments, att];
        this.isUploading = false;
        this.snack.open(`File "${file.name}" attached successfully`, 'Close', { duration: 2500 });
      },
      error: (err) => {
        this.isUploading = false;
        const message = err?.error?.message || err?.message || 'Failed to upload file';
        this.snack.open(message, 'Close', { duration: 4500 });
      }
    });
  }

  removeAttachment(id: number): void {
    if (!confirm('Delete this attachment?')) return;
    
    this.commentService.deleteAttachment(id).subscribe(() => {
      this.attachments = this.attachments.filter(a => a.id !== id);
      this.snack.open('Attachment removed', 'Close', { duration: 2000 });
    });
  }

  isImage(type: string | undefined): boolean {
    return !!type && type.startsWith('image/');
  }

  getAttachmentUrl(url: string): string {
    if (url.startsWith('/api/v1/files/')) {
      return environment.services.comment.replace('/api/v1', '') + url;
    }
    return url;
  }

  createLabel(): void {
    const name = this.newLabelName.trim();
    if (!name) {
      return;
    }

    this.creatingLabel = true;
    this.labelService.createLabel(this.card.boardId, name, this.newLabelColor).subscribe({
      next: (label) => {
        this.boardLabels = [...this.boardLabels, label];
        this.newLabelName = '';
        this.snack.open(`Created label "${label.name}"`, 'Close', { duration: 2000 });
        this.creatingLabel = false;
      },
      error: (err) => {
        const message = err?.error?.message || err?.message || 'Failed to create label';
        this.snack.open(message, 'Close', { duration: 4000 });
        this.creatingLabel = false;
      }
    });
  }

  getCommentAuthorLabel(authorId: number): string {
    const author = this.commentAuthors[authorId];
    return author ? author.username || author.fullName : `User #${authorId}`;
  }

  getCommentAuthorInitials(authorId: number): string {
    const author = this.commentAuthors[authorId];
    if (!author) {
      return String(authorId).slice(-2);
    }

    return author.fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
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

  private loadCommentAuthors(comments: Comment[]): void {
    const authorIds = Array.from(new Set(comments.map(comment => comment.authorId)))
      .filter(authorId => !this.commentAuthors[authorId]);

    if (!authorIds.length) {
      return;
    }

    forkJoin(
      authorIds.map(authorId =>
        this.authService.getUserById(authorId).pipe(catchError(() => of(null)))
      )
    ).subscribe((authors) => {
      authors
        .filter((author): author is User => !!author)
        .forEach((author) => {
          this.commentAuthors[author.id] = author;
        });
    });
  }

  private loadAssignableMembers(workspaceId: number | undefined, boardMembers: BoardMember[]): void {
    if (!workspaceId) {
      this.loadAssignableUsers(boardMembers.map(member => member.userId));
      return;
    }

    this.workspaceService.getMembers(workspaceId).pipe(
      catchError(() => of([] as WorkspaceMember[]))
    ).subscribe((members) => {
      this.workspaceMembers = members;
      const userIds = Array.from(new Set([
        ...members.map(member => member.userId),
        ...boardMembers.map(member => member.userId),
      ]));

      this.loadAssignableUsers(userIds);
    });
  }

  private loadAssignableUsers(userIds: number[]): void {
    const unresolvedIds = userIds.filter(userId => !this.assignableUsers[userId]);

    if (!unresolvedIds.length) {
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
    });
  }

  // Mention Dropdown Logic
  onCommentInput(event: any): void {
    const textarea = event.target;
    const value = textarea.value;
    const pos = textarea.selectionStart;

    // Check for @ trigger
    const lastAt = value.lastIndexOf('@', pos - 1);
    if (lastAt !== -1 && (lastAt === 0 || value[lastAt - 1] === ' ' || value[lastAt - 1] === '\n')) {
      const mentionText = value.substring(lastAt + 1, pos);

      // Once the user types whitespace/newline after a mention, stop showing suggestions.
      if (/\s/.test(mentionText)) {
        this.closeMentionDropdown();
        return;
      }

      this.mentionTriggerPos = lastAt;
      this.mentionSearchTerm = mentionText.toLowerCase();
      this.showMentionDropdown = true;
      this.filterMentions();
      return;
    }

    this.closeMentionDropdown();
  }

  onCommentKeyDown(event: KeyboardEvent): void {
    if (!this.showMentionDropdown) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.mentionIndex = (this.mentionIndex + 1) % this.filteredMentionMembers.length;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.mentionIndex = (this.mentionIndex - 1 + this.filteredMentionMembers.length) % this.filteredMentionMembers.length;
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      if (this.filteredMentionMembers[this.mentionIndex]) {
        this.selectMention(this.filteredMentionMembers[this.mentionIndex]);
      }
    } else if (event.key === 'Escape') {
      this.closeMentionDropdown();
    }
  }

  filterMentions(): void {
    this.filteredMentionMembers = this.boardMembers.filter(member => {
      const username = this.getMemberUsername(member.userId).toLowerCase();
      const fullName = (this.assignableUsers[member.userId]?.fullName || '').toLowerCase();
      const matches = username.includes(this.mentionSearchTerm) || fullName.includes(this.mentionSearchTerm);
      return matches;
    });
    this.mentionIndex = 0;
  }

  selectMention(member: BoardMember): void {
    const username = this.getMemberUsername(member.userId);
    const prefix = this.newComment.substring(0, this.mentionTriggerPos);
    const suffix = this.newComment.substring(this.mentionTriggerPos + this.mentionSearchTerm.length + 1);
    
    this.newComment = prefix + '@' + username + ' ' + suffix;
    this.closeMentionDropdown();
    
    // Set focus back to textarea (optional, since ngModel will sync)
  }

  closeMentionDropdown(): void {
    this.showMentionDropdown = false;
    this.mentionIndex = 0;
    this.mentionTriggerPos = -1;
  }

  getMemberUsername(userId: number): string {
    return this.assignableUsers[userId]?.username || this.assignableUsers[userId]?.fullName?.replace(/\s+/g, '').toLowerCase() || 'user' + userId;
  }
}
