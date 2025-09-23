// src/sanityClient.js (CORRECTED)
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: 'p0umau0m', // Your Sanity project ID
  dataset: 'production',
  apiVersion: '2024-09-23', // Use a recent, static date
  useCdn: false,
  // Use import.meta.env for Vite projects
  token: import.meta.env.VITE_SANITY_TOKEN,
});

const builder = imageUrlBuilder(client);

export function urlFor(source) {
  return builder.image(source);
}