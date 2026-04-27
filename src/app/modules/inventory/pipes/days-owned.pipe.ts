import { Pipe, PipeTransform } from '@angular/core';
import { InventoryItem, daysOwned } from '../models/inventory-item.model';

@Pipe({ name: 'invyDaysOwned', standalone: true })
export class DaysOwnedPipe implements PipeTransform {
  transform(item: InventoryItem | null | undefined): string {
    if (!item) return '';
    const days = daysOwned(item);
    if (days < 1) return 'today';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} mo`;
    const years = Math.floor(days / 365);
    const remMonths = Math.floor((days - years * 365) / 30);
    return remMonths > 0 ? `${years}y ${remMonths}mo` : `${years}y`;
  }
}
