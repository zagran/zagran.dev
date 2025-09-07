# Zagran's Professional Business Card Website

A modern, responsive business card website built with HTML/CSS/JavaScript and deployed on AWS using Infrastructure as Code (Terraform).

## 🌐 Live Website
- **URL**: https://zagran.dev
- **GitHub**: https://github.com/zagran/your-business-card-site
- **LinkedIn**: https://www.linkedin.com/in/zagran/

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Route53 DNS   │───▶│   CloudFront     │───▶│   S3 Bucket     │
│  zagran.dev     │    │   (Global CDN)   │    │  (Static Site)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  ACM SSL Cert    │
                       │ (Free HTTPS)     │
                       └──────────────────┘
```

### AWS Services Used
- **S3**: Static website hosting
- **CloudFront**: Global CDN for fast content delivery
- **Route53**: DNS management
- **ACM**: Free SSL certificates
- **IAM**: Access management
- **Terraform**: Infrastructure as Code

## 🚀 Features

- ✅ Modern, responsive design
- ✅ Dark/Light mode support
- ✅ Smooth animations and interactions
- ✅ Fast global loading (CloudFront CDN)
- ✅ HTTPS enabled
- ✅ SEO optimized
- ✅ Infrastructure as Code
- ✅ Automated deployments via GitHub Actions

## 💰 Cost Breakdown

| Service | Monthly Cost | What It Provides |
|---------|-------------|-----------------|
| S3 Storage | ~$0.01 | Website file hosting |
| CloudFront | ~$1-5 | Global CDN (1TB free tier) |
| Route53 | $0.50 | DNS hosting |
| ACM SSL | $0.00 | Free SSL certificates |
| **Total** | **~$1.51-5.51** | Professional website |

## 📁 Project Structure

```
zagran-business-card/
├── index.html                    # Main website file
├── error.html                    # 404 error page
├── README.md                     # This file
├── .gitignore                    # Git ignore rules
├── terraform/                    # Infrastructure as Code
│   ├── main.tf                   # Main Terraform configuration
│   ├── variables.tf              # Variable definitions
│   ├── outputs.tf                # Output values
│   └── terraform.tfvars.example  # Example variables
├── scripts/                      # Helper scripts
│   ├── secure-setup.sh           # S3 setuo
│   └── complete-setup.sh         # Full deployment script
└── .github/workflows/            # CI/CD pipelines
    ├── deploy.yml                # Main deployment workflow
    ├── test-credentials.yml      # Credential testing
```

## 🛠️ Local Development

### Prerequisites
```bash
# Install required tools
brew install terraform awscli  # macOS
# or
sudo apt-get install terraform awscli  # Ubuntu

# Configure AWS credentials
aws configure
# Enter your Access Key ID, Secret Access Key, region (us-east-1)
```

### Quick Start
```bash
# Clone the repository
git clone https://github.com/zagran/your-business-card-site.git
cd your-business-card-site

# Set up remote state storage
chmod +x scripts/setup-s3-only-state.sh
./scripts/setup-s3-only-state.sh

# Initialize and deploy infrastructure
cd terraform
terraform init
terraform plan
terraform apply

# Upload website files
aws s3 sync ../ s3://zagran.dev \
  --exclude "terraform/*" \
  --exclude ".git/*" \
  --exclude "scripts/*"

# View your website
terraform output website_url
```

## 🔧 Infrastructure Setup

### Option 1: Automated Setup (Recommended)
```bash
# Run complete setup script
chmod +x scripts/complete-setup.sh
./scripts/complete-setup.sh
```

### Option 2: Manual Setup

#### Step 1: Create Remote State Storage
```bash
# Create S3 bucket for Terraform state
aws s3 mb s3://zagran-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket zagran-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket zagran-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
  }'
```

#### Step 2: Configure Terraform
```bash
cd terraform

# Create terraform.tfvars (copy from terraform.tfvars.example)
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your values
domain_name         = "zagran.dev"
aws_region         = "us-east-1"
environment        = "production"
project_name       = "zagran-business-card"
create_route53_zone = true
enable_cloudfront  = true
price_class        = "PriceClass_100"
```

#### Step 3: Deploy Infrastructure
```bash
terraform init
terraform plan
terraform apply
```

## 🤖 GitHub Actions Setup

### Required Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions:

- `AWS_ACCESS_KEY_ID`: Your AWS access key
- `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

### IAM Permissions
Your AWS user needs these permissions:

<details>
<summary>Click to expand IAM Policy JSON</summary>

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*"
      ],
      "Resource": [
        "arn:aws:s3:::zagran.dev",
        "arn:aws:s3:::zagran.dev/*",
        "arn:aws:s3:::zagran-terraform-state",
        "arn:aws:s3:::zagran-terraform-state/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "acm:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:GetUser",
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```
</details>

### Deployment Workflow
Every push to `main` branch automatically:
1. Runs `terraform plan` and `terraform apply`
2. Syncs website files to S3
3. Invalidates CloudFront cache
4. Deploys your changes globally

## 🌍 Domain Configuration

### If You Own zagran.dev (or your domain):

#### Option A: Using Route53 (Managed by Terraform)
1. Set `create_route53_zone = true` in `terraform.tfvars`
2. After `terraform apply`, get the nameservers:
   ```bash
   terraform output route53_name_servers
   ```
3. Update your domain registrar to use these nameservers

#### Option B: External DNS Provider
1. Set `create_route53_zone = false` in `terraform.tfvars`
2. Get your CloudFront domain:
   ```bash
   terraform output cloudfront_domain_name
   ```
3. Create CNAME records:
   - `zagran.dev` → `d1234567890.cloudfront.net`
   - `www.zagran.dev` → `d1234567890.cloudfront.net`

### SSL Certificate
- **Automatic**: ACM provides free SSL certificates
- **Validation**: DNS validation (automatic if using Route53)
- **Renewal**: Automatic

## 📝 Content Management

### Updating Website Content
1. Edit `index.html` directly
2. Commit and push changes
3. GitHub Actions automatically deploys

### Key Sections to Customize
```html
<!-- Update these in index.html -->
<h1>Your Name</h1>
<p class="subtitle">Your Title</p>
<p class="description">Your description...</p>

<!-- Social links -->
<a href="https://www.linkedin.com/in/zagran/">LinkedIn</a>
<a href="https://github.com/zagran">GitHub</a>
<a href="mailto:your.email@example.com">Email</a>

<!-- Skills section -->
<div class="skill-card">
  <h3>Your Skill</h3>
  <p>Description</p>
</div>
```

## 🧪 Testing

### Test AWS Credentials
```bash
# Manual trigger in GitHub Actions
# Go to Actions → "Test AWS Credentials" → "Run workflow"

# Or test locally
aws sts get-caller-identity
aws s3 ls s3://zagran.dev
```

### Test Website
```bash
# Check if website is accessible
curl -I https://zagran.dev

# Check CloudFront distribution
aws cloudfront list-distributions --query 'DistributionList.Items[?contains(Origins.Items[0].DomainName, `zagran.dev`)]'
```

### Terraform Validation
```bash
cd terraform
terraform fmt -check
terraform validate
terraform plan
```

## 🔥 Troubleshooting

### Common Issues

#### 1. "Credentials could not be loaded"
```bash
# Check GitHub secrets are set correctly:
# - AWS_ACCESS_KEY_ID
# - AWS_SECRET_ACCESS_KEY

# Test locally
aws sts get-caller-identity
```

#### 2. "Bucket already exists" (Different region)
```bash
# Check if bucket exists in different region
aws s3api get-bucket-location --bucket zagran.dev

# If needed, choose a different bucket name in terraform.tfvars
```

#### 3. SSL Certificate Validation Pending
```bash
# Check certificate status
aws acm describe-certificate --certificate-arn YOUR_CERT_ARN --region us-east-1

# If using external DNS, add these records manually:
aws acm describe-certificate --certificate-arn YOUR_CERT_ARN --region us-east-1 \
  --query 'Certificate.DomainValidationOptions'
```

#### 4. CloudFront Deployment Taking Long
- CloudFront deployments take 15-20 minutes
- Check status: AWS Console → CloudFront → Distributions
- Wait for "Deployed" status before testing

#### 5. Terraform State Conflicts
```bash
# If you have duplicate resources, destroy GitHub-created ones:
# Go to Actions → "Destroy Duplicate Infrastructure" → Run workflow

# Or use the local state:
terraform import RESOURCE_TYPE.RESOURCE_NAME RESOURCE_ID
```

### Recovery Commands

#### Reset Everything (Nuclear Option)
```bash
# Destroy all infrastructure
cd terraform
terraform destroy

# Clean state
rm -f terraform.tfstate*
rm -rf .terraform/

# Start fresh
terraform init
terraform apply
```

#### Recover from Corrupted State
```bash
# List S3 state versions
aws s3api list-object-versions \
  --bucket zagran-terraform-state \
  --prefix business-card/terraform.tfstate

# Download specific version
aws s3api get-object \
  --bucket zagran-terraform-state \
  --key business-card/terraform.tfstate \
  --version-id VERSION_ID \
  terraform.tfstate
```

## 📊 Monitoring & Maintenance

### CloudWatch Metrics
Monitor these metrics in AWS CloudWatch:
- S3: BucketRequests, BucketBytes
- CloudFront: Requests, BytesDownloaded, ErrorRate
- Route53: QueryCount

### Regular Maintenance
- **Monthly**: Check AWS costs
- **Quarterly**: Review SSL certificate status
- **Yearly**: Rotate AWS access keys

### Performance Optimization
```bash
# Enable CloudFront compression (already configured in Terraform)
# Monitor Core Web Vitals using Google PageSpeed Insights
# Optimize images before uploading

# Check website performance
curl -o /dev/null -s -w "%{time_total}\n" https://zagran.dev
```

## 🔒 Security Best Practices

### AWS Security
- ✅ S3 bucket is private (access only through CloudFront)
- ✅ HTTPS enforced (HTTP redirects to HTTPS)
- ✅ AWS access keys have minimal required permissions
- ✅ Terraform state is encrypted in S3
- ✅ Regular security updates

### Recommended Actions
```bash
# Rotate AWS keys every 90 days
aws iam create-access-key --user-name zagran-github-actions
aws iam delete-access-key --access-key-id OLD_KEY --user-name zagran-github-actions

# Enable AWS CloudTrail for audit logging
# Set up AWS Config for compliance monitoring
# Enable AWS GuardDuty for threat detection
```

## 🤝 Contributing

### Local Development
```bash
# Make changes to index.html
# Test locally by opening in browser
open index.html

# Deploy changes
git add .
git commit -m "Update content"
git push origin main
```

### Pull Request Process
1. Create feature branch
2. Make changes
3. Test locally
4. Submit pull request
5. GitHub Actions runs terraform plan
6. After merge, changes deploy automatically

## 📚 Additional Resources

### Terraform Documentation
- [AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [S3 Static Website](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)

### AWS Pricing
- [S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)
- [Route53 Pricing](https://aws.amazon.com/route53/pricing/)

### GitHub Actions
- [AWS Actions](https://github.com/aws-actions)
- [Terraform GitHub Actions](https://learn.hashicorp.com/tutorials/terraform/github-actions)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Zagran**
- Website: https://zagran.dev
- LinkedIn: https://www.linkedin.com/in/zagran/
- GitHub: https://github.com/zagran

---

*Built with ❤️ using Terraform, AWS, and GitHub Actions*