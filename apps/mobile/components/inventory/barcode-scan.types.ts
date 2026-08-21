export interface BeautyProduct {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  price: number | null;
  barcode: string;
}

export type ScanState =
  | 'idle'
  | 'searching'
  | 'found'
  | 'not-found'
  | 'added'
  | 'shelf-added'
  | 'error';

export type InputMode = 'camera' | 'manual';
