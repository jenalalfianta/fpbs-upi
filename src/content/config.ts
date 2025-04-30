import { defineCollection, z } from "astro:content";

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

const prodiCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    sections: z.record(
      z.object({
        title: z.string(),
        content: z.string().optional(),
        externalLink: z.string().url().optional(),
      })
    )
  }),
});

export const collections = {
  berita: beritaCollection,
  "program-studi": prodiCollection,
};
