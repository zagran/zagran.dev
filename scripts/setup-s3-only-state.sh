#!/bin/bash
# setup-s3-only-state.sh

set -e

BUCKET_NAME="zagran-terraform-state"
REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🚀 Setting up S3-only Terraform state storage..."
echo "Account ID: $ACCOUNT_ID"
echo "Bucket: $BUCKET_NAME"
echo "Region: $REGION"
echo "💰 Cost: ~$0.01/month (no DynamoDB charges)"
echo ""

# Create S3 bucket for Terraform state
echo "1. Creating S3 bucket for Terraform state..."
if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "   ✅ Bucket $BUCKET_NAME already exists"
else
    aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$REGION"
    echo "   ✅ Created bucket $BUCKET_NAME"
fi

# Enable versioning (important for state recovery)
echo "2. Enabling versioning on state bucket..."
aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled
echo "   ✅ Versioning enabled (protects against state corruption)"

# Enable server-side encryption
echo "3. Enabling encryption on state bucket..."
aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration '{
        "Rules": [
            {
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }
        ]
    }'
echo "   ✅ Encryption enabled"

# Block all public access
echo "4. Blocking public access to state bucket..."
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
echo "   ✅ Public access blocked"

# Add bucket policy for additional security
echo "5. Adding bucket policy for HTTPS-only access..."
aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "DenyInsecureConnections",
                "Effect": "Deny",
                "Principal": "*",
                "Action": "s3:*",
                "Resource": [
                    "arn:aws:s3:::'"$BUCKET_NAME"'",
                    "arn:aws:s3:::'"$BUCKET_NAME"'/*"
                ],
                "Condition": {
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                }
            }
        ]
    }'
echo "   ✅ HTTPS-only policy added"

echo ""
echo "🎉 S3-only remote state storage setup complete!"
echo ""
echo "⚠️  Note: No state locking (DynamoDB not used)"
echo "   - Don't run terraform from multiple locations simultaneously"
echo "   - This is fine for personal projects"
echo ""
echo "Backend configuration for your main.tf:"
echo "---------------------------------------"
cat << EOF
terraform {
  backend "s3" {
    bucket  = "$BUCKET_NAME"
    key     = "business-card/terraform.tfstate"
    region  = "$REGION"
    encrypt = true
  }
}
EOF
echo ""
echo "Next steps:"
echo "1. Update your main.tf with the backend configuration above"
echo "2. Run 'terraform init' to migrate existing state"
echo "3. Commit and push changes"