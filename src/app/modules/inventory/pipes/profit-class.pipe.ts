import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'invyProfitClass', standalone: true })
export class ProfitClassPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null || value === 0) return 'invy-muted';
    return value > 0 ? 'invy-positive' : 'invy-negative';
  }
}
