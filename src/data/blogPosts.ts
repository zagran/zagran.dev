export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  coverImage?: string;
}

export const blogPosts: BlogPost[] = [
  // Add these to your blogPosts array:

{
  id: "monitoring-email-bounces-aws-ses",
  title: "Monitoring Your Email Bounces and Bounce Rate using Amazon SES, Lambda, SNS, and DynamoDB",
  excerpt: "Learn how to build a robust email bounce monitoring system using AWS services to maintain a healthy SES reputation and prevent service disruptions.",
  content: `# Monitoring Your Email Bounces and Bounce Rate using Amazon SES, Lambda, SNS, and DynamoDB

When using Amazon SES, a situation may occur where your Account status in the Amazon SES Reputation Dashboard changes from HEALTHY, causing Amazon to stop the ability to send emails. To prevent this, it is better to start monitoring your Reputation right after going into production.

## The Solution Stack

An adequate bundle of services for this includes:
- **AWS Lambda**: Process bounce notifications
- **Amazon SNS**: Receive events from Amazon SES
- **Amazon DynamoDB**: Store bounce data for analysis

Amazon SNS will get events from Amazon SES and trigger Lambda. The Lambda function will store data to DynamoDB and do other things that you want — for example, remove an email address from a subscription list via an API, or send a message to Slack/Telegram/Messenger.

## Setting Up SNS Topics

First, in the Notifications settings of your domain, add Amazon SNS Topics for the Bounces, Complaints and Deliveries events.

You can use 1 topic for all events, separating is optional. For example, if you want to send Complaint events to Lambda and the email of the administrator, it is better to separate.

## Creating the Lambda Function

Create a Lambda function named \`ses-notification-nodejs\`:
- Use Node.js 12.x Runtime with default settings
- This is enough for this task

## Setting Up DynamoDB

Create a DynamoDB table:
- Table name: \`mailing\`
- Primary key: \`UserId\`
- Default settings will be enough for a start
- You can fine-tune it later

## IAM Permissions

Go to IAM and add a permission to the Lambda role. The best option is to add the permission to exactly one table. This follows the principle of least privilege and ensures your Lambda function only has access to the resources it needs.

## Lambda Function Code

The Lambda function processes SNS notifications from SES and stores them to DynamoDB. Key features:
- Parse incoming SNS messages
- Extract bounce/complaint information
- Store data in DynamoDB for tracking
- Optional: Send notifications to external services (Slack, Telegram, etc.)

## Benefits

With this setup, you can:
- Monitor all Bounce and Complaint events from your SES service
- Keep your Amazon SES in a healthy state
- Prevent service disruptions due to reputation issues
- Build automated responses to email issues

## Code Repository

You can find examples with Telegram notification in my repository: [zagran/ses-notification-nodejs](https://github.com/zagran/ses-notification-nodejs)

This monitoring system is essential for any production application using Amazon SES to ensure reliable email delivery and maintain sender reputation.`,
  date: "2020-03-15",
  readTime: "7 min read",
  category: "Cloud",
  tags: ["AWS", "Lambda", "SES", "DynamoDB", "SNS", "Email", "DevOps"],
},
{
  id: "using-image-search-in-your-app",
  title: "Using Image Search in Your App",
  excerpt: "Implement Google Custom Search API to automatically provide relevant images for user-generated content, improving engagement and user experience.",
  content: `# Using Image Search in Your App

Every content on a site, in an application or simply in a letter, looks more expressive and eye-catching when it's accompanied by an image. Images are a vital part of our online lives, from ordinary users to media giants and news portals.

## The Problem

Let's say we ask a user to create some content in our system, for example, their financial goal. In this case, it's necessary to put an image here (to provide an example of the user's motivation, visualization).

Most of the time, the user will skip this phase, since there are multiple steps involved in finding/selecting/taking a photo and uploading it. People are lazy, and if a photo is not readily available in their desktop or photo gallery, they'll often skip this step.

## Available Solutions

There are lots of solutions available:
- Third-party services like [Unsplash](https://unsplash.com/)
- [Splashbase](http://www.splashbase.co/)

Although these are very good services, most likely you will have to pay for them. This can be frustrating when many of the features that come with a paid service may not even be needed.

## Google Custom Search Solution

If you are already working with some Google products in your project, why not utilize their search service? According to statistics from 2018, 90.15% of users will use Google for image searches.

### Setup

First, add the necessary packages:
\`\`\`bash
pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib
\`\`\`

Don't forget to add these packages to requirements:
\`\`\`bash
pip freeze > requirements.txt
\`\`\`

### API Configuration

1. Activate custom search in your Google account to receive an API_KEY
2. Create a Custom Search Engine ID (CSE_ID) using the panel at [https://cse.google.com/cse/all](https://cse.google.com/cse/all)
3. Enable the image search function

### Implementation

Create a service class that receives a phrase or term for entry (in our case, the goal header) and returns an array of images.

### Supported Parameters

Google Custom Search service supports many parameters. For our use case, we used:

\`\`\`python
searchType='image'  # Indicates we're looking for images
imgType='photo'     # Options: clipart, face, lineart, stock, photo, animated
imgSize='xxlarge'   # Options: icon, small, medium, large, xlarge, xxlarge, huge
\`\`\`

#### Parameter Choices

- **imgSize**: We tried all options and found \`xxlarge\` returns the most relevant images
- **imgType**: \`photo\` option is most suitable for realistic images
- **imgDominantColor**: Optional parameter to specify predominant color in photos

### Pagination

The pagination parameters were skipped intentionally as 10 images are given by default. This is exactly what we need for the user to choose from.

### Response Handling

We return only the links, then depending on the selected image, we will process it as needed:
- Save the image
- Optimize for web
- Crop to required dimensions
- Apply any other transformations

## Results

The user enters the title, and we can provide excellent accompanying pictures automatically. The result will differ from what the user would get when using the browser, as the browser has different search settings by default.

## Benefits

- Improved user engagement
- Reduced friction in content creation
- Automated image suggestion
- Cost-effective compared to paid services
- Leverages Google's powerful image search

This solution significantly improves the user experience by automatically providing relevant images for user-generated content without requiring manual search and upload steps.`,
  date: "2019-09-24",
  readTime: "6 min read",
  category: "Backend",
  tags: ["Python", "Google API", "Image Search", "UX", "Automation"],
}
];
