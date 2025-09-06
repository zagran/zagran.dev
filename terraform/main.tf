terraform {
  required_version = ">= 1.0"

  # S3-only remote state backend (no DynamoDB locking)
  backend "s3" {
    bucket  = "zagran-terraform-state"
    key     = "business-card/terraform.tfstate"
    region  = "us-east-1"
    encrypt = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Additional AWS provider for us-east-1 (required for ACM with CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# S3 Bucket for website hosting
resource "aws_s3_bucket" "website_bucket" {
  bucket = var.domain_name

  tags = {
    Name = "${var.project_name} Website Bucket"
  }
}

# S3 Bucket versioning
resource "aws_s3_bucket_versioning" "website_versioning" {
  bucket = aws_s3_bucket.website_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Website Configuration
resource "aws_s3_bucket_website_configuration" "website_config" {
  bucket = aws_s3_bucket.website_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

# S3 Bucket Public Access Block (keep private for CloudFront)
resource "aws_s3_bucket_public_access_block" "website_pab" {
  bucket = aws_s3_bucket.website_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Origin Access Control
resource "aws_cloudfront_origin_access_control" "website_oac" {
  count = var.enable_cloudfront ? 1 : 0

  name                              = "${var.domain_name}-oac"
  description                       = "OAC for ${var.domain_name}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ACM Certificate (must be in us-east-1 for CloudFront)
resource "aws_acm_certificate" "website_cert" {
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.domain_name} Certificate"
  }
}

# Route53 Zone (optional)
resource "aws_route53_zone" "website_zone" {
  count = var.create_route53_zone ? 1 : 0
  name  = var.domain_name

  tags = {
    Name = "${var.domain_name} Zone"
  }
}

# Route53 Records for ACM Certificate Validation
resource "aws_route53_record" "website_cert_validation" {
  for_each = var.create_route53_zone ? {
    for dvo in aws_acm_certificate.website_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = aws_route53_zone.website_zone[0].zone_id
}

# ACM Certificate Validation
resource "aws_acm_certificate_validation" "website_cert_validation" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.website_cert.arn
  validation_record_fqdns = var.create_route53_zone ? [for record in aws_route53_record.website_cert_validation : record.fqdn] : null

  # If not using Route53, certificate validation will need to be done manually
  count = var.create_route53_zone ? 1 : 0

  timeouts {
    create = "10m"
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "website_distribution" {
  count = var.enable_cloudfront ? 1 : 0

  origin {
    domain_name              = aws_s3_bucket.website_bucket.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.website_oac[0].id
    origin_id                = "S3-${var.domain_name}"
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for ${var.domain_name}"
  default_root_object = "index.html"

  aliases = [var.domain_name, "www.${var.domain_name}"]

  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.domain_name}"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
    compress               = true
  }

  # Additional cache behaviors for static assets
  ordered_cache_behavior {
    path_pattern     = "/assets/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "S3-${var.domain_name}"

    forwarded_values {
      query_string = false
      headers      = ["Origin"]
      cookies {
        forward = "none"
      }
    }

    min_ttl                = 0
    default_ttl            = 86400
    max_ttl                = 31536000
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
  }

  price_class = var.price_class

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.create_route53_zone ? aws_acm_certificate_validation.website_cert_validation[0].certificate_arn : aws_acm_certificate.website_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 404
    response_page_path = "/error.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 404
    response_page_path = "/error.html"
  }

  tags = {
    Name = "${var.domain_name} Distribution"
  }
}

# S3 Bucket Policy for CloudFront
resource "aws_s3_bucket_policy" "website_policy" {
  bucket = aws_s3_bucket.website_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.website_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = var.enable_cloudfront ? aws_cloudfront_distribution.website_distribution[0].arn : ""
          }
        }
      }
    ]
  })
}

# Route53 A Record for website (if using Route53)
resource "aws_route53_record" "website" {
  count   = var.create_route53_zone && var.enable_cloudfront ? 1 : 0
  zone_id = aws_route53_zone.website_zone[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website_distribution[0].domain_name
    zone_id                = aws_cloudfront_distribution.website_distribution[0].hosted_zone_id
    evaluate_target_health = false
  }
}

# Route53 A Record for www subdomain (if using Route53)
resource "aws_route53_record" "website_www" {
  count   = var.create_route53_zone && var.enable_cloudfront ? 1 : 0
  zone_id = aws_route53_zone.website_zone[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website_distribution[0].domain_name
    zone_id                = aws_cloudfront_distribution.website_distribution[0].hosted_zone_id
    evaluate_target_health = false
  }
}