import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Board } from '../../core/models/board.model';

export interface MoveListDialogData {
  listName: string;
  boards: Board[];
}

@Component({
  selector: 'app-move-list-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
  ],
  template: `
    <div class="dialog-shell">
      <div class="dialog-hero">
        <div class="dialog-badge">
          <mat-icon>swap_horiz</mat-icon>
        </div>
        <div>
          <p class="dialog-eyebrow">List transfer</p>
          <h2 mat-dialog-title class="dialog-title">Move "{{ data.listName }}"</h2>
          <p class="dialog-copy">
            Choose the board that should receive this list. Cards in the list will move with it.
          </p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-dialog-content class="dialog-content">
          <mat-form-field appearance="fill" class="dialog-field">
            <mat-label>Target board</mat-label>
            <mat-select formControlName="boardId">
              <mat-option *ngFor="let board of data.boards" [value]="board.id">
                {{ board.name }}
              </mat-option>
            </mat-select>
            <mat-hint>Select another board in this workspace.</mat-hint>
          </mat-form-field>
        </mat-dialog-content>

        <mat-dialog-actions align="end" class="dialog-actions">
          <button mat-button type="button" class="dialog-cancel" (click)="dialogRef.close()">Cancel</button>
          <button mat-flat-button color="primary" class="dialog-submit" type="submit" [disabled]="form.invalid">
            Move list
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [`
    .dialog-shell {
      width: min(92vw, 32rem);
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
      padding: 0.25rem 0 1.2rem;
    }

    .dialog-badge {
      display: flex;
      height: 3.1rem;
      width: 3.1rem;
      align-items: center;
      justify-content: center;
      border-radius: 1rem;
      background: linear-gradient(135deg, #0f766e, #0f172a);
      color: white;
      box-shadow: 0 18px 42px rgba(15, 23, 42, 0.2);
    }

    .dialog-eyebrow {
      margin: 0;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: rgba(13, 148, 136, 0.82);
    }

    .dialog-title {
      margin: 0.5rem 0 0;
      padding: 0;
      font-size: 1.55rem;
      font-weight: 700;
      color: #0f172a;
    }

    .dialog-copy {
      margin: 0.6rem 0 0;
      font-size: 0.95rem;
      line-height: 1.65;
      color: #475569;
    }

    .dialog-content {
      padding: 0 !important;
    }

    .dialog-field {
      width: 100%;
    }

    .dialog-actions {
      padding: 1rem 0 0 !important;
      margin-top: 0.75rem;
      border-top: 1px solid rgba(148, 163, 184, 0.16);
      gap: 0.75rem;
    }

    .dialog-cancel,
    .dialog-submit {
      border-radius: 9999px;
    }
  `]
})
export class MoveListDialogComponent {
  readonly form = this.fb.group({
    boardId: [this.data.boards[0]?.id ?? 0, [Validators.required, Validators.min(1)]],
  });

  constructor(
    private fb: NonNullableFormBuilder,
    public dialogRef: MatDialogRef<MoveListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MoveListDialogData
  ) {}

  submit(): void {
    if (this.form.invalid) {
      return;
    }

    this.dialogRef.close(this.form.getRawValue().boardId);
  }
}
