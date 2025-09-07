#!/bin/bash

# Secure S3 + CloudFront Setup Script
BUCKET_NAME="zagran.dev"
REGION="us-east-1"

echo "Setting up secure S3 + CloudFront deployment for $BUCKET_NAME"

# 1. Create S3 bucket (if it doesn't exist)
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "Bucket already exists"

# 2. Keep bucket private (don't modify block public access settings)
echo "Keeping S3 bucket private for security..."

# 3. Upload your website files
echo "Uploading website files..."
aws s3 sync . s3://$BUCKET_NAME \
    --exclude ".git/*" \
    --exclude "*.sh" \
    --exclude "*.md" \
    --cache-control "max-age=31536000" \
    --exclude "*.html"

# Upload HTML files with different cache settings
aws s3 sync . s3://$BUCKET_NAME \
    --exclude "*" \
    --include "*.html" \
    --cache-control "max-age=0,no-cache,no-store,must-revalidate"

# 4. Create Origin Access Control for CloudFront
echo "Creating CloudFront Origin Access Control..."
OAC_ID=$(aws cloudfront create-origin-access-control \
    --origin-access-control-config '{
        "Name": "'$BUCKET_NAME'-oac",
        "Description": "OAC for '$BUCKET_NAME'",
        "OriginAccessControlOriginType": "s3",
        "SigningBehavior": "always",
        "SigningProtocol": "sigv4"
    }' \
    --query 'OriginAccessControl.Id' \
    --output text)

echo "Created OAC with ID: $OAC_ID"

# 5. Create CloudFront distribution config
cat > cloudfront-config.json << EOF
{
    "CallerReference": "$(date +%s)",
    "Comment": "Distribution for $BUCKET_NAME",
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [
            {
                "Id": "S3-$BUCKET_NAME",
                "DomainName": "$BUCKET_NAME.s3.$REGION.amazonaws.com",
                "S3OriginConfig": {
                    "OriginAccessIdentity": ""
                },
                "OriginAccessControlId": "$OAC_ID"
            }
        ]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$BUCKET_NAME",
        "ViewerProtocolPolicy": "redirect-to-https",
        "TrustedSigners": {
            "Enabled": false,
            "Quantity": 0
        },
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {
                "Forward": "none"
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000,
        "Compress": true
    },
    "Enabled": true,
    "PriceClass": "PriceClass_100"
}
EOF

echo "Creating CloudFront distribution..."
DISTRIBUTION_ID=$(aws cloudfront create-distribution \
    --distribution-config file://cloudfront-config.json \
    --query 'Distribution.Id' \
    --output text)

echo "Created CloudFront distribution: $DISTRIBUTION_ID"

# 6. Update S3 bucket policy to allow CloudFront access
echo "Updating S3 bucket policy for CloudFront access..."
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCloudFrontServicePrincipal",
            "Effect": "Allow",
            "Principal": {
                "Service": "cloudfront.amazonaws.com"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*",
            "Condition": {
                "StringEquals": {
                    "AWS:SourceArn": "arn:aws:cloudfront::'$(aws sts get-caller-identity --query Account --output text)':distribution/'$DISTRIBUTION_ID'"
                }
            }
        }
    ]
}'

echo "Setup complete!"
echo "CloudFront Distribution ID: $DISTRIBUTION_ID"
echo "Your website will be available at the CloudFront domain (check AWS Console)"
echo "Note: CloudFront deployment takes 15-20 minutes to fully propagate"

# Clean up
rm cloudfront-config.json