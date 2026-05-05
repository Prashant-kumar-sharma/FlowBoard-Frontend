import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardPriority } from '../../../core/models/card.model';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
          [ngClass]="classes">
      {{ priority }}
    </span>
  `
})
export class PriorityBadgeComponent {
  @Input() priority: CardPriority = 'MEDIUM';

  get classes(): object {
    return {
      'bg-gray-100 text-gray-600':   this.priority === 'LOW',
      'bg-blue-100 text-blue-700':   this.priority === 'MEDIUM',
      'bg-orange-100 text-orange-700': this.priority === 'HIGH',
      'bg-red-100 text-red-700':     this.priority === 'CRITICAL',
    };
  }
}
