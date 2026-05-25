import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyFmt', standalone: true })
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number | null | undefined, opts: { compact?: boolean; signed?: boolean } = {}): string {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    const sign = opts.signed && value > 0 ? '+' : '';

    // Large compact values (e.g. market cap $3.54T)
    if (opts.compact && Math.abs(value) >= 1_000_000) {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 2,
      });
      return sign + formatter.format(value);
    }

    // Micro-prices for tokens like SHIB ($0.0000245)
    const abs = Math.abs(value);
    if (abs > 0 && abs < 0.01) {
      const decimals =
        abs < 0.000001 ? 8 :
        abs < 0.0001   ? 7 :
                         4;
      return sign + new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(value);
    }

    return sign + new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }
}
