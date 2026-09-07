# zagran.dev

Personal portfolio and technical blog for Serhii Zahranychnyi, built with React and Vite and deployed to AWS.

**Live:** [zagran.dev](https://zagran.dev)

## Tech Stack

- **React 18** + **TypeScript**, built with **Vite** (SWC via `@vitejs/plugin-react-swc`)
- **React Router** for routing
- **shadcn/ui** (Radix UI primitives + Tailwind CSS)
- **TanStack Query** for data management
- **react-markdown** for article rendering
- **AWS** for hosting: S3 + CloudFront + Route53, provisioned with Terraform

## Getting Started

Requires Node.js and npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
npm install
npm run dev        # dev server on http://[::]:8080
```

Other scripts:

```sh
npm run build      # production build into dist/ (also prerenders routes + sitemap)
npm run build:dev  # development-mode build with the component tagger
npm run lint       # eslint
npm run preview    # preview the production build
```

## Project Layout

```
src/
  components/      Navigation, Footer, BlogCard, SkillCard, LegalPage
  components/ui/   shadcn/ui primitives
  pages/           Index, Blog, BlogPost, Privacy, Terms, NotFound
  data/            blogPosts.ts (article content), legal.ts (policy text)
  hooks/           use-document-title, use-seo, use-google-analytics
  lib/             seo.ts (route metadata), utils.ts
public/            robots.txt, og-image.jpg (copied to dist/ verbatim)
terraform/         AWS infrastructure, including functions/rewrite-uri.js
```

`@` is aliased to `src`, so imports read as `@/components/ui/button`.

## Content

Articles live as TypeScript objects in `src/data/blogPosts.ts`, newest first. Content is markdown inside the `content` field. See the `BlogPost` interface for the full shape, including `seoTitle`, `mediumUrl`, and `publication`.

Most articles are also published on Medium. Because the Medium versions were published there natively, they carry the canonical URL. To keep future articles canonical on this domain, publish here first and then use Medium's **Import Story** tool, which sets `rel=canonical` back to the source.

Policy text for `/privacy` and `/terms` lives in `src/data/legal.ts`.

## SEO

Social crawlers do not execute JavaScript, so per-route metadata cannot be injected at runtime alone. The build handles this in two layers:

- **Build time** — a Vite plugin in `vite.config.ts` writes one HTML file per route (`dist/blog/<id>/index.html`, etc.), each with its own `<title>`, description, canonical, Open Graph and Twitter tags, and JSON-LD. It also generates `sitemap.xml`. Route metadata comes from `src/lib/seo.ts`, which derives it from the post data so there is no second list to maintain.
- **Runtime** — `useSeo` keeps the canonical and social tags correct during client-side navigation, once React Router takes over. `useDocumentTitle` continues to own page titles.

Serving those nested files requires the CloudFront function described below.

## Infrastructure

Terraform in `terraform/` manages an S3 bucket (private, served through CloudFront with OAC), a CloudFront distribution, Route53 records, and an ACM certificate in `us-east-1`. State is stored remotely in the `zagran-terraform-state` bucket.

```sh
cd terraform
terraform init
terraform plan
terraform apply
terraform output      # s3 bucket name, cloudfront distribution id
```

A CloudFront function (`terraform/functions/rewrite-uri.js`) runs on viewer-request and maps extensionless URIs onto the prerendered files, so `/blog/foo` resolves to `/blog/foo/index.html`. Requests for paths with no matching object still fall through the distribution's 403 handler to `/index.html`, where React Router renders the 404 page.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the app, applies Terraform, syncs `dist/` to S3, and invalidates CloudFront. Hashed assets are cached for a year; HTML, `robots.txt`, and `sitemap.xml` are sent with no-cache so new articles are picked up promptly.

The CI IAM user needs CloudFront function permissions (`CreateFunction`, `PublishFunction`, `DescribeFunction`, `GetFunction`, `UpdateFunction`, `DeleteFunction`) in addition to its S3, Route53, ACM, and distribution permissions.

To deploy manually:

```sh
npm run build
cd terraform
aws s3 sync ../dist s3://$(terraform output -raw s3_bucket_name) --delete
aws cloudfront create-invalidation \
  --distribution-id $(terraform output -raw cloudfront_distribution_id) --paths "/*"
```

## Notes

This project was originally scaffolded with [Lovable](https://lovable.dev) and has since been taken over and deployed independently on AWS.
