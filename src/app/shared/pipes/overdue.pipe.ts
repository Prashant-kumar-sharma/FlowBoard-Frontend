import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'overdue', standalone: true })
export class OverduePipe implements PipeTransform {
  transform(dueDate: string | undefined, status: string): boolean {
    if (!dueDate || status === 'DONE') return false;
    return new Date(dueDate) < new Date();
  }
}
