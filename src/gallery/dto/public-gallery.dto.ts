export type PublicGalleryImage = {
  id: number;
  title: string | null;
  description: string | null;
  url: string;
  altText: string | null;
  displayOrder: number;
};

export type PublicGalleryResponse = {
  id: number | null;
  title: string | null;
  description: string | null;
  layout: string | null;
  imageCount: number;
  images: PublicGalleryImage[];
};
