import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateBoardRequest } from '../../core/models/board.model';

export interface CreateBoardDialogData {
  workspaceId: number;
  mode?: 'create' | 'edit';
  board?: Partial<CreateBoardRequest>;
}

@Component({
  selector: 'app-create-board-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="dialog-shell">
      <div class="dialog-hero">
        <div class="dialog-badge">
          <mat-icon>view_kanban</mat-icon>
        </div>
        <div>
          <p class="dialog-eyebrow">{{ dialogMode === 'edit' ? 'Board editing' : 'Board setup' }}</p>
          <h2 mat-dialog-title class="dialog-title">{{ dialogMode === 'edit' ? 'Edit Board' : 'Create Board' }}</h2>
          <p class="dialog-copy">
            {{ dialogMode === 'edit'
              ? 'Refresh the board details and background so it still stands out the right way in the workspace.'
              : 'Give this board a purpose, a visibility level, and a background that stands out in the workspace.' }}
          </p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-dialog-content class="dialog-content">
          <div class="dialog-grid">
            <mat-form-field appearance="fill" class="dialog-field">
              <mat-label>Board name</mat-label>
              <input matInput formControlName="name" maxlength="80" placeholder="Sprint Planning">
              <mat-hint>Name the board around the work it owns.</mat-hint>
              <mat-error *ngIf="form.controls.name.hasError('required')">
                Board name is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="fill" class="dialog-field">
              <mat-label>Description</mat-label>
              <textarea
                matInput
                formControlName="description"
                rows="3"
                maxlength="240"
                placeholder="What is this board used for?"
              ></textarea>
              <mat-hint>Describe the rhythm or outcome this board supports.</mat-hint>
            </mat-form-field>

            <div class="dialog-split">
              <mat-form-field appearance="fill" class="dialog-field">
                <mat-label>Visibility</mat-label>
                <mat-select formControlName="visibility">
                  <mat-option value="PRIVATE">Private</mat-option>
                  <mat-option value="PUBLIC">Public</mat-option>
                </mat-select>
                <mat-hint>Choose who should be able to find and open it.</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="fill" class="dialog-field">
                <mat-label>Background</mat-label>
                <mat-select formControlName="background">
                  <mat-option *ngFor="let option of backgroundOptions" [value]="option.value">
                    <div class="option-row">
                      <span class="color-dot" [style.background]="option.value"></span>
                      <span>{{ option.label }}</span>
                    </div>
                  </mat-option>
                </mat-select>
                <mat-hint>Pick a color that makes the board easy to spot.</mat-hint>
              </mat-form-field>
            </div>

            <div class="background-preview" [style.background]="form.controls.background.value">
              <div class="background-preview-overlay"></div>
              <div class="background-preview-copy">
                <p class="preview-label">Live preview</p>
                <p class="preview-title">{{ form.controls.name.value || 'Board title preview' }}</p>
                <p class="preview-text">
                  {{ form.controls.description.value || 'Your board will carry this background across the planning surface.' }}
                </p>
              </div>
            </div>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end" class="dialog-actions">
          <button mat-button type="button" class="dialog-cancel" (click)="dialogRef.close()">Cancel</button>
          <button mat-flat-button color="primary" class="dialog-submit" type="submit" [disabled]="form.invalid">
            {{ dialogMode === 'edit' ? 'Save changes' : 'Create board' }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .dialog-shell {
      width: min(92vw, 38rem);
      padding: 1.5rem;
      background:
        radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 14rem),
        linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(239, 246, 255, 0.98));
    }

    .dialog-hero {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 1rem;
      align-items: start;
      padding: 0.25rem 0 1.25rem;
    }

    .dialog-badge {
      display: flex;
      height: 3.25rem;
      width: 3.25rem;
      align-items: center;
      justify-content: center;
      border-radius: 1.1rem;
      background: linear-gradient(135deg, #0f172a, #0369a1);
      color: white;
      box-shadow: 0 18px 42px rgba(3, 105, 161, 0.22);
    }

    .dialog-eyebrow {
      margin: 0;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: rgba(2, 132, 199, 0.78);
    }

    .dialog-title {
      margin: 0.5rem 0 0;
      padding: 0;
      font-size: 1.7rem;
      font-weight: 700;
      color: #0f172a;
    }

    .dialog-copy {
      margin: 0.6rem 0 0;
      font-size: 0.98rem;
      line-height: 1.7;
      color: #475569;
    }

    .dialog-content {
      padding: 0 !important;
    }

    .dialog-grid {
      display: grid;
      gap: 1rem;
    }

    .dialog-split {
      display: grid;
      gap: 1rem;
    }

    .dialog-field {
      width: 100%;
    }

    .option-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .color-dot {
      display: inline-block;
      height: 1rem;
      width: 1rem;
      border-radius: 9999px;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
    }

    .background-preview {
      position: relative;
      overflow: hidden;
      min-height: 8.5rem;
      border-radius: 1.4rem;
      padding: 1.25rem;
      color: white;
      box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
    }

    .background-preview-overlay {
      position: absolute;
      inset: 0;
      background:
        linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.58)),
        radial-gradient(circle at top left, rgba(255, 255, 255, 0.18), transparent 42%);
      pointer-events: none;
    }

    .background-preview-copy {
      position: relative;
    }

    .preview-label {
      margin: 0;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: rgba(224, 242, 254, 0.78);
    }

    .preview-title {
      margin: 0.7rem 0 0;
      font-size: 1.35rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .preview-text {
      margin: 0.55rem 0 0;
      max-width: 26rem;
      font-size: 0.92rem;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.86);
    }

    .dialog-actions {
      padding: 1rem 0 0 !important;
      margin-top: 0.5rem;
      border-top: 1px solid rgba(148, 163, 184, 0.16);
      gap: 0.75rem;
    }

    .dialog-cancel,
    .dialog-submit {
      border-radius: 9999px;
    }

    .dialog-submit {
      box-shadow: 0 16px 36px rgba(2, 132, 199, 0.22);
    }

    @media (min-width: 700px) {
      .dialog-split {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `]
})
export class CreateBoardDialogComponent {
  readonly dialogMode: 'create' | 'edit';
  readonly backgroundOptions = [
    { label: 'Ocean Blue', value: '#0079BF' },
    { label: 'Forest Green', value: '#2E7D32' },
    { label: 'Sunset Orange', value: '#EF6C00' },
    { label: 'Ruby Red', value: '#C62828' },
    { label: 'Violet', value: '#6A1B9A' },
    { label: 'Slate', value: '#455A64' },
  ];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', [Validators.maxLength(240)]],
    visibility: ['PRIVATE' as 'PRIVATE' | 'PUBLIC', Validators.required],
    background: ['#0079BF', Validators.required],
  });

  constructor(
    private fb: NonNullableFormBuilder,
    public dialogRef: MatDialogRef<CreateBoardDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateBoardDialogData
  ) {
    this.dialogMode = data?.mode ?? 'create';

    if (data?.board) {
      this.form.patchValue({
        name: data.board.name ?? '',
        description: data.board.description ?? '',
        visibility: data.board.visibility ?? 'PRIVATE',
        background: data.board.background ?? '#0079BF',
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const payload: CreateBoardRequest = {
      workspaceId: this.data.workspaceId,
      name: value.name.trim(),
      description: value.description.trim() || undefined,
      visibility: value.visibility,
      background: value.background,
    };

    this.dialogRef.close(payload);
  }
}
