# outputs.tf

output "website_url" {
  description = "Website URL"
  value       = var.enable_cloudfront ? "https://${var.domain_name}" : "http://${aws_s3_bucket_website_configuration.website_config.website_endpoint}"
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = aws_s3_bucket.website_bucket.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.website_bucket.arn
}

output "s3_website_endpoint" {
  description = "S3 website endpoint"
  value       = aws_s3_bucket_website_configuration.website_config.website_endpoint
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.website_distribution[0].id : null
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.website_distribution[0].domain_name : null
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.website_distribution[0].arn : null
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = var.create_route53_zone ? aws_route53_zone.website_zone[0].zone_id : null
}

output "route53_name_servers" {
  description = "Route53 name servers"
  value       = var.create_route53_zone ? aws_route53_zone.website_zone[0].name_servers : null
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN"
  value       = aws_acm_certificate.website_cert.arn
}

output "acm_certificate_status" {
  description = "ACM certificate validation status"
  value       = aws_acm_certificate.website_cert.status
}