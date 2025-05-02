import { defineCollection, z } from "astro:content";

// Koleksi BERITA (jangan diubah)
const beritaCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    pubDate: z.string(),
    author: z.string(),
    image: z
      .object({
        url: z.string(),
        alt: z.string(),
      })
      .optional(),
  }),
});

// Koleksi PROGRAM STUDI (revisi)
const prodiCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),

    // ✅ menu sticky untuk navbar
    menu: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        external: z.string().optional(),
      })
    ).optional(),

    // ✅ konten setiap tab menu
    sections: z.record(
      z.string(),
      z.object({
        title: z.string().optional(),
        content: z.string().optional(),
        external: z.string().optional(),
      })
    ),
  }),
});

export const collections = {
  berita: beritaCollection,
  "program-studi": prodiCollection,
};
