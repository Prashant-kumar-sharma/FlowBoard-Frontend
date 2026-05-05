import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

export interface PromptDialogData {
  title: string;
  message: string;
  placeholder?: string;
  value?: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-prompt-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule],
  template: `
    <div class="prompt-dialog-container">
      <h2 mat-dialog-title>{{ data.title }}</h2>
      
      <mat-dialog-content>
        <p class="prompt-message" *ngIf="data.message">{{ data.message }}</p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>{{ data.placeholder || 'Enter value' }}</mat-label>
          <input matInput [(ngModel)]="value" (keyup.enter)="onConfirm()" autofocus>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">{{ data.cancelText || 'Cancel' }}</button>
        <button mat-flat-button color="primary" (click)="onConfirm()" [disabled]="!value.trim()">
          {{ data.confirmText || 'Save' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .prompt-dialog-container {
      padding: 16px;
      border-radius: 24px;
    }
    h2 {
      margin: 0 0 16px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .prompt-message {
      color: #64748b;
      margin-bottom: 20px;
    }
    .full-width {
      width: 100%;
    }
    mat-dialog-actions {
      gap: 8px;
      margin-top: 16px;
    }
  `]
})
export class PromptDialogComponent {
  value: string = '';

  constructor(
    public dialogRef: MatDialogRef<PromptDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PromptDialogData
  ) {
    this.value = data.value || '';
  }

  onConfirm(): void {
    if (this.value.trim()) {
      this.dialogRef.close(this.value.trim());
    }
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
