import { Injectable, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class PaginacionEs extends MatPaginatorIntl {
  private translate = inject(TranslateService);

  constructor() {
    super();
    this.actualizarTextos();
    this.translate.onLangChange.subscribe(() => {
      this.actualizarTextos();
    });
  }

  private actualizarTextos() {
    this.itemsPerPageLabel = this.translate.instant('PAGINATOR.ITEMS_PER_PAGE');
    this.nextPageLabel = this.translate.instant('PAGINATOR.NEXT_PAGE');
    this.previousPageLabel = this.translate.instant('PAGINATOR.PREV_PAGE');
    this.firstPageLabel = this.translate.instant('PAGINATOR.FIRST_PAGE');
    this.lastPageLabel = this.translate.instant('PAGINATOR.LAST_PAGE');
    this.changes.next();
  }

  override getRangeLabel = (page: number, pageSize: number, length: number) => {
    const ofLabel = this.translate.instant('PAGINATOR.OF');

    if (length === 0 || pageSize === 0) {
      return `0 ${ofLabel} ${length}`;
    }
    length = Math.max(length, 0);
    const startIndex = page * pageSize;
    const endIndex =
      startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;
    return `${startIndex + 1} - ${endIndex} ${ofLabel} ${length}`;
  };
}
