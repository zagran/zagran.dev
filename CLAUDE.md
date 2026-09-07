# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a personal portfolio website (zagran.dev) built as a modern React application with a blog feature. The project uses Vite as the build tool and is deployed to AWS using Terraform for infrastructure as code.

**Tech Stack:**
- React 18 with TypeScript
- Vite for build tooling
- React Router for navigation
- shadcn/ui components (Radix UI primitives + Tailwind CSS)
- TanStack Query for data management
- Deployed on AWS (S3 + CloudFront + Route53)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://[::]:8080)
npm run dev

# Build for production
npm run build

# Build for development (with component tagger)
npm run build:dev

# Lint the code
npm run lint

# Preview production build
npm run preview
```

## Architecture

### Application Structure

**Entry Point:** src/main.tsx → App.tsx
- App.tsx sets up React Query, Tooltip Provider, Toaster components, and React Router
- All routes are defined in App.tsx

**Routing:**
- `/` - Index page (homepage with hero, skills, blog preview)
- `/blog` - Blog listing page
- `/blog/:id` - Individual blog post page
- `/privacy` - Privacy Policy
- `/terms` - Terms of Service
- `*` - 404 NotFound page

**Important:** When adding new routes, they MUST be added ABOVE the catch-all `*` route in App.tsx. A new route also needs an entry in `getRoutes()` in `src/lib/seo.ts`, or it will not be prerendered and will fall back to the homepage's metadata.

### Key Directories

- `src/components/` - React components (Navigation, Footer, BlogCard, SkillCard, LegalPage)
- `src/components/ui/` - shadcn/ui components (button, card, etc.)
- `src/pages/` - Page-level components (Index, Blog, BlogPost, Privacy, Terms, NotFound)
- `src/data/` - Data files (blogPosts.ts contains blog content, legal.ts contains policy text)
- `src/lib/` - Utility functions (utils.ts with cn helper, seo.ts with route metadata)
- `src/hooks/` - Custom React hooks (use-document-title.ts for titles, use-seo.ts for canonical/social tags)
- `public/` - Files copied to dist/ verbatim (robots.txt, og-image.jpg)
- `terraform/functions/` - CloudFront function source (rewrite-uri.js)

`Footer` is shared across Index, Blog, BlogPost, and the legal pages. It is not
inlined on any page - edit `src/components/Footer.tsx` to change it everywhere.

### Import Alias

The project uses `@` as an alias for the `src` directory:
```typescript
import { Button } from "@/components/ui/button";
```

### Blog System

Blog posts are stored as TypeScript objects in `src/data/blogPosts.ts`. Each post contains:
- `id` - URL-friendly identifier
- `title` - Display title shown in the post
- `seoTitle` (optional) - SEO-optimized title for browser tab (follows patterns like "How to...", "X Ways to...", "Problem → Solution")
- `excerpt`, `content` - Post text
- `date`, `readTime` - Metadata
- `category`, `tags` - Classification
- `coverImage` (optional) - Hero image
- `mediumUrl` (optional) - Canonical Medium permalink, shown as a footer credit
- `publication` (optional) - Medium publication it ran in (e.g. "Level Up Coding")

Content is written in markdown format within the `content` field and rendered using react-markdown.

Posts are ordered newest-first in the array. When adding one:

- Put it at the top of the array if it is the newest.
- Backticks inside `content` must be escaped (`` \` ``) because it is a template literal.
- A literal `${` must be escaped as `\${`, or TypeScript will treat it as interpolation.
- The `id` becomes the URL slug and **must not contain a dot** - the CloudFront
  rewrite keys off "no dot in the last path segment", so a dotted slug would be
  served as a file and never reach the page. The build fails loudly if you try.
- The first markdown image in `content` becomes the article's social share image.

Most articles are also published on Medium. Those were published there natively,
so Medium holds the canonical URL. To keep future articles canonical on this
domain, publish here first and then use Medium's Import Story tool, which sets
`rel=canonical` back to the source.

## SEO and Prerendering

Social crawlers (LinkedIn, Slack, X) do not execute JavaScript, so per-route
metadata cannot live only in the React runtime. Two layers cover this:

**Build time.** The `prerender` plugin in `vite.config.ts` writes one HTML file
per route - `dist/index.html`, `dist/blog/index.html`, `dist/blog/<id>/index.html`,
`dist/privacy/index.html`, `dist/terms/index.html` - each with its own title,
description, `rel=canonical`, Open Graph and Twitter tags, and JSON-LD
(`BlogPosting` for articles, `Person` elsewhere). The same pass writes
`sitemap.xml`.

**Runtime.** `useSeo` (src/hooks/use-seo.ts) updates the canonical and social
tags during client-side navigation. `useDocumentTitle` still owns titles; the two
are used together on each page.

**Route metadata lives in one place:** `getRoutes()` in `src/lib/seo.ts`, derived
from `blogPosts` so there is no second list to maintain. That file is imported by
`vite.config.ts`, so it must use a **relative** import for `blogPosts` - the `@`
alias is not resolvable from the Vite config.

Never add a static `rel=canonical` to `index.html`. It is served for every route,
so a hardcoded canonical would declare every article to be the homepage.

## AWS Infrastructure (Terraform)

Infrastructure is defined in the `terraform/` directory and deployed via GitHub Actions.

**Key Resources:**
- S3 bucket for static hosting (private, accessed through CloudFront via OAC)
- CloudFront distribution with HTTPS
- CloudFront function (`terraform/functions/rewrite-uri.js`) on viewer-request
- Route53 DNS records
- ACM SSL certificate (must be in us-east-1)
- Remote state stored in S3 (`zagran-terraform-state` bucket)

**The CloudFront function is what makes prerendering work.** It maps extensionless
URIs onto the generated files (`/blog/foo` to `/blog/foo/index.html`). Paths with
no matching object still 403 from S3 and fall through the distribution's
`custom_error_response` to `/index.html`, where React Router renders the 404 page.
The function is ES5 only - the CloudFront Functions runtime is not a full JS engine.

The CI IAM user needs these CloudFront function permissions, beyond its existing
S3/Route53/ACM/distribution ones: `CreateFunction`, `PublishFunction`,
`DescribeFunction`, `GetFunction`, `UpdateFunction`, `DeleteFunction`.

**Terraform Commands:**
```bash
cd terraform

# Initialize Terraform
terraform init

# Plan changes
terraform plan

# Apply changes
terraform apply

# View outputs (S3 bucket, CloudFront distribution ID)
terraform output
```

## Deployment

Deployments are automated via GitHub Actions on push to `main`:

1. Build React app (`npm run build` creates `dist/` directory)
2. Apply Terraform configuration
3. Sync `dist/` to S3 bucket
4. Invalidate CloudFront cache

**Build Output:** The build process creates a `dist/` directory (not `build/`).
Beyond the bundle it contains one prerendered `index.html` per route, plus
`sitemap.xml`, `robots.txt`, and `og-image.jpg`.

The deploy syncs in two passes: hashed assets get a one-year cache, while HTML,
`robots.txt`, and `sitemap.xml` get `no-cache` so new articles are picked up
promptly. Keep that split if you edit the workflow.

**Manual Deployment:**
```bash
# Build the app
npm run build

# Get terraform outputs
cd terraform
export BUCKET_NAME=$(terraform output -raw s3_bucket_name)
export CF_ID=$(terraform output -raw cloudfront_distribution_id)

# Deploy to S3
aws s3 sync ../dist s3://$BUCKET_NAME --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id $CF_ID --paths "/*"
```

## Component Library (shadcn/ui)

The project uses shadcn/ui components configured via `components.json`. Components are in `src/components/ui/`.

**Adding new components:**
```bash
npx shadcn@latest add <component-name>
```

Components use Tailwind CSS with a custom theme configuration in `tailwind.config.ts`.

## Styling

- Tailwind CSS for utility-first styling
- Custom theme with CSS variables in `src/index.css`
- Dark mode support via `next-themes`
- Typography plugin for markdown content (`@tailwindcss/typography`)

## Important Notes

- The development server runs on port 8080 (not the default 5173)
- This project was originally created with Lovable.dev (see README.md)
- When adding new routes, always place them before the `*` catch-all route
- Blog posts are currently static data in TypeScript files (not fetched from a CMS)
- Legal page text lives in `src/data/legal.ts`; `/privacy` and `/terms` are stable
  public URLs intended for reuse (app store listings, OAuth consent screens), so
  do not rename those routes
- The policy text is jurisdiction-neutral by design: no governing-law clause and
  no GDPR/CCPA statutory claims
- The project uses SWC for faster builds via `@vitejs/plugin-react-swc`
- Page titles follow SEO-optimized patterns:
  - Homepage: "[Name] — [Role] | [Core Specialty]"
  - Blog listing: Descriptive without suffix
  - Blog posts: Use `seoTitle` if available, formatted for engagement ("How to...", "X Ways to...", etc.)
  - Use `useDocumentTitle(title, "")` to omit the suffix when the title already includes branding
