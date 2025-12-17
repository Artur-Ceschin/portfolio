# Deployment Guide

This guide will help you deploy your portfolio to AWS using GitHub Actions, CloudFormation, S3, CloudFront, and Route53.

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Domain name** registered (via Route53 or external registrar)
3. **GitHub repository** with your code
4. **Route53 Hosted Zone** for your domain

## Setup Steps

### 1. Configure AWS IAM for GitHub Actions

You'll need to set up OIDC (OpenID Connect) for secure authentication between GitHub Actions and AWS.

#### Create IAM OIDC Provider

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

#### Create IAM Role

Create a file `github-actions-trust-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::YOUR_ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:YOUR_GITHUB_USERNAME/portfolio-dev:*"
        }
      }
    }
  ]
}
```

Create the role:

```bash
# Replace YOUR_ACCOUNT_ID and YOUR_GITHUB_USERNAME
aws iam create-role \
  --role-name GitHubActionsDeployRole \
  --assume-role-policy-document file://github-actions-trust-policy.json
```

#### Attach Policies to Role

```bash
# Create custom policy for deployment
cat > deployment-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": [
        "arn:aws:s3:::*-website",
        "arn:aws:s3:::*-website/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation",
        "cloudfront:GetInvalidation",
        "cloudfront:ListInvalidations"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "acm:*",
        "route53:*",
        "s3:*",
        "cloudfront:*",
        "iam:CreateServiceLinkedRole"
      ],
      "Resource": "*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name GitHubActionsDeployRole \
  --policy-name DeploymentPolicy \
  --policy-document file://deployment-policy.json
```

### 2. Configure Route53 Hosted Zone

If you don't have a hosted zone yet:

```bash
# Create hosted zone for your domain
aws route53 create-hosted-zone \
  --name arturceschin.dev \
  --caller-reference $(date +%s)

# Get the hosted zone ID
aws route53 list-hosted-zones-by-name \
  --dns-name arturceschin.dev \
  --query 'HostedZones[0].Id' \
  --output text
```

Update your domain's nameservers to point to the Route53 nameservers.

### 3. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

Add the following secrets:

| Secret Name                  | Description                                       | Example                                                  |
| ---------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| `AWS_ROLE_ARN`               | ARN of the IAM role created above                 | `arn:aws:iam::123456789012:role/GitHubActionsDeployRole` |
| `DOMAIN_NAME`                | Your domain name                                  | `arturceschin.dev`                                       |
| `ROUTE53_HOSTED_ZONE_ID`     | Route53 Hosted Zone ID                            | `Z1234567890ABC`                                         |
| `S3_BUCKET_NAME`             | Will be created by CloudFormation                 | `arturceschin.dev-website`                               |
| `CLOUDFRONT_DISTRIBUTION_ID` | Will be available after infrastructure deployment | `E1234567890ABC`                                         |

### 4. Deploy Infrastructure

1. Go to your GitHub repository
2. Click on **Actions** tab
3. Select **Deploy Infrastructure** workflow
4. Click **Run workflow**
5. Select action: **deploy**
6. Click **Run workflow**

This will create:

- S3 bucket for website hosting
- CloudFront distribution with HTTPS
- ACM certificate for SSL/TLS
- Route53 DNS records
- All necessary permissions

**Note:** After deployment, get the CloudFront Distribution ID:

```bash
aws cloudformation describe-stacks \
  --stack-name portfolio-infrastructure \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text
```

Add this as `CLOUDFRONT_DISTRIBUTION_ID` secret in GitHub.

### 5. Deploy Website

Once infrastructure is ready:

1. Push code to `main` branch, or
2. Go to Actions → **Deploy to AWS** → Run workflow

The workflow will:

- Build the Next.js app
- Upload to S3
- Invalidate CloudFront cache
- Your site will be live!

## Local Testing

Test the static export locally:

```bash
# Build the static site
npm run build

# The output will be in the 'out' directory
# You can test it with any static server
npx serve out
```

## Updating the Website

Every push to the `main` branch will automatically trigger a deployment.

## Cost Estimation

- **Route53 Hosted Zone**: $0.50/month
- **S3**: ~$0.023/GB/month (minimal for static site)
- **CloudFront**: Free tier includes 1TB data transfer out
- **ACM Certificate**: FREE

**Estimated monthly cost: ~$0.50 - $2.00/month** (mostly Route53)

## Troubleshooting

### Certificate Validation Stuck

If ACM certificate validation takes too long, check:

```bash
# Check certificate status
aws acm list-certificates --region us-east-1

# Check DNS records
aws route53 list-resource-record-sets --hosted-zone-id YOUR_ZONE_ID
```

### CloudFront Takes Time

CloudFront distributions take 15-20 minutes to deploy. Be patient!

### Build Fails

Check the GitHub Actions logs for errors. Common issues:

- Missing environment variables
- Node.js version mismatch
- Dependencies not installing

## Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Build
npm run build

# Deploy to S3
aws s3 sync out/ s3://arturceschin.dev-website --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## Cleanup

To delete all resources:

1. Go to Actions → **Deploy Infrastructure**
2. Run workflow with action: **delete**

Or manually:

```bash
# Delete CloudFormation stack (deletes all resources)
aws cloudformation delete-stack --stack-name portfolio-infrastructure

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name portfolio-infrastructure
```

## Support

For issues or questions, check:

- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
