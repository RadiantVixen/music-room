
// utils/roomImages.ts

export const GENRE_IMAGES: Record<string, string> = {
  "Pop": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
  "Hip-Hop": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
  "R&B": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80",
  "Rock": "https://images.unsplash.com/photo-1464375117522-1311dd6d0cd7?w=800&q=80",
  "Electronic": "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80",
  "EDM": "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80",
  "Jazz": "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80",
  "Classical": "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80",
  "Indie": "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800&q=80",
  "Lo-Fi": "https://images.unsplash.com/photo-15１１６７１７８２７７９-c97d3d27a１d４?w=８００&q=８０",
};

export const getRoomImageFromGenre = (genres?: string[]) => {
  if (!genres || genres.length === 0) {
    return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80";
  }

  const firstGenre = genres[0];

  return GENRE_IMAGES[firstGenre] || 
    "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80";
};