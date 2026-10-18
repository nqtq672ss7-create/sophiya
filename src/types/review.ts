export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  bouquetTitle?: string;
  comment: string;
  isVerified: boolean;
  isPublished: boolean;
}
