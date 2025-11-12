import { BookStatus, IBook } from '~types/books';

export interface BoardData {
  boardType: BookStatus;
  data: IBook[];
  totalItems: number;
  hasNextPage: boolean;
  pageIndex: number;
  filterParams: string[];
  sortType: string;
  sortDirection: string;
  language: string;
  booksCountByYear?: any;
  timestamp: number;
}

