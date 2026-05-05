import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

export interface CreateListDialogResult {
  name: string;
}

@Component({
  selector: 'app-create-list-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  template: `
    <div class="dialog-shell">
      <div class="dialog-hero">
        <div class="dialog-badge">
          <mat-icon>segment</mat-icon>
        </div>
        <div>
          <p class="dialog-eyebrow">List setup</p>
          <h2 mat-dialog-title class="dialog-title">Create List</h2>
          <p class="dialog-copy">
            Add a new stage to your board with a short, clear name that fits your workflow.
          </p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-dialog-content class="dialog-content">
          <div class="dialog-grid">
            <mat-form-field appearance="fill" class="dialog-field">
              <mat-label>List name</mat-label>
              <input matInput formControlName="name" maxlength="60" placeholder="To Do">
              <mat-hint>Use a short stage name like Intake, Doing, Review, or Done.</mat-hint>
              <mat-error *ngIf="form.controls.name.hasError('required')">
                List name is required
              </mat-error>
            </mat-form-field>

            <div class="list-preview">
              <div class="list-preview-copy">
                <p class="preview-label">Preview</p>
                <p class="preview-title">{{ form.controls.name.value || 'New list' }}</p>
                <p class="preview-text">This will show up as a clean list on the board, ready for cards right away.</p>
              </div>
            </div>
          </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end" class="dialog-actions">
          <button mat-button type="button" class="dialog-cancel" (click)="dialogRef.close()">Cancel</button>
          <button mat-flat-button color="primary" class="dialog-submit" type="submit" [disabled]="form.invalid">
            Create list
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .dialog-shell {
      width: min(92vw, 34rem);
      padding: 1.5rem;
      background:
        radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 14rem),
        linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.98));
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
      background: linear-gradient(135deg, #155e75, #0f172a);
      color: white;
      box-shadow: 0 18px 42px rgba(15, 23, 42, 0.2);
    }

    .dialog-eyebrow {
      margin: 0;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: rgba(8, 145, 178, 0.78);
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

    .list-preview {
      overflow: hidden;
      border-radius: 1.35rem;
      background: white;
      border: 1px solid rgba(148, 163, 184, 0.16);
      box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
    }

    .list-preview-copy {
      padding: 1rem 1.05rem;
    }

    .preview-label {
      margin: 0;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: rgba(2, 132, 199, 0.74);
    }

    .preview-title {
      margin: 0.65rem 0 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
    }

    .preview-text {
      margin: 0.45rem 0 0;
      font-size: 0.92rem;
      line-height: 1.6;
      color: #475569;
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
export class CreateListDialogComponent {
  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
  });

  constructor(
    private fb: NonNullableFormBuilder,
    public dialogRef: MatDialogRef<CreateListDialogComponent>
  ) {}

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    this.dialogRef.close({
      name: value.name.trim(),
    } satisfies CreateListDialogResult);
  }
}
