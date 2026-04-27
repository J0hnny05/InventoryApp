import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'invyMoney', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined, currency: string = 'USD'): string {
    if (value == null || Number.isNaN(value)) return '—';
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits: value % 1 === 0 ? 0 : 2,
      }).format(value);
    } catch {
      return `${value.toFixed(2)} ${currency}`;
    }
  }
}
