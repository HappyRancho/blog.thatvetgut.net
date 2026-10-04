// Unsplash editorial photography. Remote images are resized at source; no stock-photo endorsement is implied.
export const photos = {
  dog: {
    id: "photo-1552053831-71594a27632d",
    alt: "Golden retriever outdoors in soft afternoon light",
  },
  cat: {
    id: "photo-1514888286974-6c03e2ca1dba",
    alt: "Black-and-white cat looking over a wooden surface",
  },
  puppy: {
    id: "photo-1558788353-f76d92427f16",
    alt: "Golden retriever looking toward the camera",
  },
  kitten: {
    id: "photo-1573865526739-10659fec78a5",
    alt: "Ginger cat resting at home",
  },
  horse: {
    id: "photo-1553284965-83fd3e82fa5a",
    alt: "White horse moving beside woodland",
  },
  cow: {
    id: "photo-1546445317-29f4545e9d53",
    alt: "Cattle outdoors",
  },
} as const;
export type PhotoKey = keyof typeof photos;
export function petPhoto(key: PhotoKey, width = 1000) {
  return `https://images.unsplash.com/${photos[key].id}?auto=format&fit=crop&w=${width}&q=80`;
}
