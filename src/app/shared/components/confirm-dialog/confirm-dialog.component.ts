import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog-container">
      <div class="confirm-header">
        <div class="icon-orb" [class.is-danger]="data.isDanger">
          <mat-icon>{{ data.isDanger ? 'warning' : 'help_outline' }}</mat-icon>
        </div>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>

      <mat-dialog-content>
        <p class="confirm-message">{{ data.message }}</p>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()" class="btn-cancel">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button
          mat-flat-button
          [color]="data.isDanger ? 'warn' : 'primary'"
          (click)="onConfirm()"
          class="btn-confirm"
          [class.btn-danger]="data.isDanger"
        >
          {{ data.confirmText || 'Confirm' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog-container {
      padding: 24px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 28px;
    }

    .confirm-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 16px;
    }

    .icon-orb {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.1);
      color: #6366f1;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.15);
    }

    .icon-orb.is-danger {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      box-shadow: 0 8px 20px rgba(239, 68, 68, 0.15);
    }

    .icon-orb mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      font-family: 'Material Icons' !important;
      font-feature-settings: 'liga' !important;
    }

    h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .confirm-message {
      color: #64748b;
      line-height: 1.6;
      text-align: center;
      font-size: 15px;
      margin: 8px 0 24px;
    }

    mat-dialog-actions {
      gap: 12px;
      padding: 0 !important;
      justify-content: center !important;
    }

    .btn-cancel {
      border-radius: 12px !important;
      padding: 0 20px !important;
      height: 44px !important;
      font-weight: 600 !important;
      color: #64748b !important;
    }

    .btn-confirm {
      border-radius: 12px !important;
      padding: 0 24px !important;
      height: 44px !important;
      font-weight: 600 !important;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2) !important;
    }

    .btn-danger {
      background-color: #ef4444 !important;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25) !important;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
