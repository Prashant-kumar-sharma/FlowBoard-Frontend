import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { Card } from '../../../core/models/card.model';
import { Board } from '../../../core/models/board.model';

@Component({
  selector: 'app-overdue-cards',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.22em] text-slate-400">Platform Admin</p>
          <h1 class="text-3xl font-bold text-white">Overdue Cards</h1>
          <p class="mt-1 text-sm text-slate-400">SLA monitoring across the entire platform.</p>
        </div>
        <a routerLink="/admin" class="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors">Back to Admin</a>
      </div>

      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-sm text-slate-500">
        {{ cards.length }} overdue cards found
      </div>

      <div class="grid gap-4">
        <div *ngFor="let card of cards" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div class="text-lg font-semibold text-slate-900">{{ card.title }}</div>
              <div class="mt-1 text-sm text-slate-500">{{ card.description || 'No description' }}</div>
              <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span class="rounded-full bg-slate-100 px-3 py-1">Board: {{ boardName(card.boardId) }}</span>
                <span class="rounded-full bg-slate-100 px-3 py-1">Due: {{ card.dueDate | date:'mediumDate' }}</span>
                <span class="rounded-full bg-rose-50 px-3 py-1 text-rose-700">{{ card.priority }}</span>
              </div>
            </div>
            <a [routerLink]="['/board', card.boardId]" class="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700">
              Open Board
            </a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class OverdueCardsComponent implements OnInit {
  cards: Card[] = [];
  boards: Board[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    forkJoin({
      cards: this.adminService.getOverdueCards(),
      boards: this.adminService.getAllBoards()
    }).subscribe({
      next: ({ cards, boards }) => {
        this.cards = [...cards].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
        this.boards = boards;
      }
    });
  }

  boardName(boardId: number): string {
    return this.boards.find(board => board.id === boardId)?.name || `Board #${boardId}`;
  }
}
