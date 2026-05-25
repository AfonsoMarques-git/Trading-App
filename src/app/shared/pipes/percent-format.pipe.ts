import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'percentFmt', standalone: true })
export class PercentFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, opts: { signed?: boolean } = { signed: true }): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    const sign = opts.signed && value > 0 ? '+' : '';
    return sign + value.toFixed(2) + '%';
  }
}
