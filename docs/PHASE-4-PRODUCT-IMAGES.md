# Phase 4 — Product Images and Media

## Included
- S3-compatible object storage client.
- Short-lived signed PUT URLs for product images.
- Admin-only upload URL and completion endpoints.
- Server-side content type, size, product ownership and object existence checks.
- Product image records in Prisma, ordered by sortOrder.
- Admin product catalogue supports uploading JPG, PNG, WebP and AVIF files (maximum 8 MB).
- Product listing/detail APIs expose public image URLs without exposing storage credentials or raw storage keys to public clients.
- Admin image deletion endpoint removes object and database record.
- Audit events for image additions/deletions.

## Storage setup
Configure the S3-compatible bucket and credentials in `.env`:
- `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET`
- `S3_PUBLIC_BASE_URL` must point to the public CDN/base URL serving product images.
- Set bucket CORS to allow your storefront origin to PUT images with the Content-Type header.
- The product image bucket is intended for public, non-sensitive catalogue photos. Never put customer CAD/STL/OBJ files in this bucket.

## Important
- Image upload depends on correctly configured external object storage and CORS; it has not been exercised against a live bucket here.
- Product images are public by design. Customer model files require a separate private bucket, malware scanning, access controls and short-lived signed download links.
- Add image reorder/cover selection, thumbnail generation, EXIF stripping, virus scanning, storage lifecycle policies and integration tests before production.
