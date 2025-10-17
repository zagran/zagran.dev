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
npm preview
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
- `*` - 404 NotFound page

**Important:** When adding new routes, they MUST be added ABOVE the catch-all `*` route in App.tsx:23

### Key Directories

- `src/components/` - React components (Navigation, BlogCard, SkillCard)
- `src/components/ui/` - shadcn/ui components (button, card, etc.)
- `src/pages/` - Page-level components (Index, Blog, BlogPost, NotFound)
- `src/data/` - Data files (blogPosts.ts contains blog content)
- `src/lib/` - Utility functions (utils.ts with cn helper)
- `src/hooks/` - Custom React hooks

### Import Alias

The project uses `@` as an alias for the `src` directory:
```typescript
import { Button } from "@/components/ui/button";
```

### Blog System

Blog posts are stored as TypeScript objects in `src/data/blogPosts.ts`. Each post contains:
- `id` - URL-friendly identifier
- `title`, `excerpt`, `content` - Post text
- `date`, `readTime` - Metadata
- `category`, `tags` - Classification
- `coverImage` (optional) - Hero image

Content is written in markdown format within the `content` field and rendered using react-markdown.

## AWS Infrastructure (Terraform)

Infrastructure is defined in the `terraform/` directory and deployed via GitHub Actions.

**Key Resources:**
- S3 bucket for static hosting (private, accessed through CloudFront)
- CloudFront distribution with HTTPS
- Route53 DNS records
- ACM SSL certificate (must be in us-east-1)
- Remote state stored in S3 (`zagran-terraform-state` bucket)

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

**Build Output:** The build process creates a `dist/` directory (not `build/`)

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
- The project uses SWC for faster builds via `@vitejs/plugin-react-swc`
