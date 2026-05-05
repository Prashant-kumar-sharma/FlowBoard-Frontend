import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { CreateWorkspaceRequest } from '../../core/models/workspace.model';
import { Inject } from '@angular/core';

export interface CreateWorkspaceDialogData {
  mode?: 'create' | 'edit';
  workspace?: Partial<CreateWorkspaceRequest>;
}

@Component({
  selector: 'app-create-workspace-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <div class="dialog-shell">
      <div class="dialog-hero">
        <div class="dialog-badge">
          <mat-icon>space_dashboard</mat-icon>
        </div>
        <div>
          <p class="dialog-eyebrow">{{ dialogMode === 'edit' ? 'Workspace editing' : 'Workspace setup' }}</p>
          <h2 mat-dialog-title class="dialog-title">{{ dialogMode === 'edit' ? 'Edit Workspace' : 'Create Workspace' }}</h2>
          <p class="dialog-copy">
            {{ dialogMode === 'edit'
              ? 'Refine the workspace name, description, and visibility so the space still matches how your team works.'
              : 'Set up a shared home for boards, teammates, and the work that needs one clean place to live.' }}
          </p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-dialog-content class="dialog-content">
          <div class="dialog-grid">
            <mat-form-field appearance="fill" class="dialog-field">
              <mat-label>Workspace name</mat-label>
              <input matInput formControlName="name" maxlength="80" placeholder="Product Roadmap">
              <mat-hint>Give it a name your team will recognize immediately.</mat-hint>
              <mat-error *ngIf="form.controls.name.hasError('required')">
                Workspace name is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="fill" class="dialog-field">
              <mat-label>Description</mat-label>
              <textarea
                matInput
                formControlName="description"
                rows="4"
                maxlength="240"
                placeholder="Describe what this workspace is for"
              ></textarea>
              <mat-hint>Optional, but helpful when this space starts filling up.</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="fill" class="dialog-field">
              <mat-label>Visibility</mat-label>
              <mat-select formControlName="visibility">
                <mat-option value="PRIVATE">Private</mat-option>
                <mat-option value="PUBLIC">Public</mat-option>
              </mat-select>
              <mat-hint>Private keeps access tighter. Public makes discovery easier.</mat-hint>
            </mat-form-field>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end" class="dialog-actions">
          <button mat-button type="button" class="dialog-cancel" (click)="dialogRef.close()">Cancel</button>
          <button mat-flat-button color="primary" class="dialog-submit" type="submit" [disabled]="form.invalid">
            {{ dialogMode === 'edit' ? 'Save changes' : 'Create workspace' }}
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .dialog-shell {
      width: min(92vw, 36rem);
      padding: 1.5rem;
      background:
        radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 14rem),
        linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(240, 249, 255, 0.98));
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
      background: linear-gradient(135deg, #0f172a, #0284c7);
      color: white;
      box-shadow: 0 18px 42px rgba(2, 132, 199, 0.22);
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

    .dialog-field {
      width: 100%;
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
  `]
})
export class CreateWorkspaceDialogComponent {
  readonly dialogMode: 'create' | 'edit';
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    description: ['', [Validators.maxLength(240)]],
    visibility: ['PRIVATE' as 'PRIVATE' | 'PUBLIC', Validators.required],
  });

  constructor(
    private fb: NonNullableFormBuilder,
    public dialogRef: MatDialogRef<CreateWorkspaceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateWorkspaceDialogData | null
  ) {
    this.dialogMode = data?.mode ?? 'create';

    if (data?.workspace) {
      this.form.patchValue({
        name: data.workspace.name ?? '',
        description: data.workspace.description ?? '',
        visibility: data.workspace.visibility ?? 'PRIVATE',
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    const payload: CreateWorkspaceRequest = {
      name: value.name.trim(),
      description: value.description?.trim() || undefined,
      visibility: value.visibility,
    };

    this.dialogRef.close(payload);
  }
}
