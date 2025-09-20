import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

const client = createClient({
  projectId: 'p0umau0m', // Oyage Sanity project ID eka methana danna
  dataset: 'production',
  useCdn: true,
  apiVersion: '2023-05-03',
  token: 'skMAvzfa1Ot4Q3puMVcWDMfCJdTZW7L11lnVt0Dh0pSbx9iihZkh9WGZ0LQiaS2hJtveq3BBVZEkHeZLh8dT8wHkvM2kKIRF0DjI1IX71rjLi0b4BLHLV4W82jkBSPnMIncKgxzflxXmROBlU8aEISzqKI3oCWVA6hJvRAMCUfmyE1vsH3oU' 

});

const builder = imageUrlBuilder(client);

// urlFor function eka hadala, eka export karanawa
export const urlFor = (source) => builder.image(source);

// client eka default export eka widihata yawanawa
export default client;