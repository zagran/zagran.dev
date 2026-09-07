export interface BlogPost {
  id: string;
  title: string;
  seoTitle?: string; // SEO-optimized title for browser tab
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  coverImage?: string;
  mediumUrl?: string; // canonical Medium permalink
  publication?: string; // Medium publication it ran in, if any
}

export const blogPosts: BlogPost[] = [
{
  id: "the-trust-your-zero-trust-architecture-still-grants",
  title: "The Trust Your Zero-Trust Architecture Still Grants",
  seoTitle: "Zero Trust in AWS: The Data-Plane Gap Examiners Never Ask About",
  excerpt: "What an examiner sees, and what nobody is looking at. Mature IAM, documented segmentation, and a zero-trust policy can satisfy every question actually asked while leaving the data-plane trust gap entirely unaddressed. Four places implicit trust enters the VPC — and what verified workload identity would require.",
  content: `![The Trust Your Zero-Trust Architecture Still Grants](https://miro.medium.com/v2/resize:fit:1024/1*Lsa5Oa2Gcd5ydWCa8zKGCg.jpeg)

*What an examiner sees, and what nobody is looking at.*

Since August 31, 2025, there has been no FFIEC-issued cybersecurity self-assessment tool. The FFIEC sunset the Cybersecurity Assessment Tool on that date, having announced the decision the previous September, and declined to update it. Institutions were told to refer instead to the NIST Cybersecurity Framework 2.0 and CISA's Cybersecurity Performance Goals. What a large bank measures about its own cloud security posture is now, to a meaningful degree, a matter of institutional choice.

Consider what that choice produces in practice. A federal examiner reviewing a large institution's cloud architecture under the FFIEC IT Examination Handbook's Architecture, Infrastructure, and Operations booklet will look for evidence of zero-trust controls. The institution will produce IAM policies, identity federation diagrams, network segmentation records, and perimeter controls. All of it will be real, and most of it will be good.

What the examiner is unlikely to see is a map of which workloads implicitly trust each other inside the VPC once IAM has said yes.

That surface is what lateral movement exploits after an initial credential compromise. In financial cloud environments, where the same infrastructure that processes payments also feeds Bank Secrecy Act reporting and sanctions-screening systems, a successful pivot inside a trusted VPC threatens the integrity of the financial-crime controls that U.S. supervisors rely on, not only the confidentiality of customer data.

## What the standards require, and how far apart they are from each other

NIST SP 800-207, published in August 2020, defines zero trust as a set of principles rather than a product category. Its seven tenets are architectural: all communication is secured regardless of network location; access to individual enterprise resources is granted on a per-session basis; access is determined by dynamic policy including the observable state of client identity, application or service, and the requesting asset; and all resource authentication and authorization are dynamic and strictly enforced before access is allowed. The document separates the Policy Decision Point, comprising a Policy Engine that makes the access decision and a Policy Administrator that establishes or shuts down the communication path, from the Policy Enforcement Point, which enables, monitors, and eventually terminates the connection. The whole design is built around moving those components closer to the resource, so that network position confers nothing.

NIST closed the cloud-native gap three years later. SP 800-207A, published on September 13, 2023, sets out identity-based segmentation for cloud-native applications in five numbered requirements covering encrypted connections, service authentication through short-lived credentials, service-to-service authorization, phishing-resistant user identity management, and per-request user authorization. It names ingress proxies, sidecars, and egress proxies as the policy enforcement points, and requires that they be "always invoked (non-bypassable), verifiable, and independent of the application code." It specifies mTLS at the connection level with certificate lifetimes as short as fifteen to thirty minutes. It names SPIFFE explicitly, defining a SPIFFE ID as a string that uniquely identifies a workload, carried in a cryptographically verifiable identity document.

Most production AWS deployments in financial services implement the identity half of this model well. Role-based access control is mature. Service control policies at the AWS Organizations level enforce guardrails across accounts. Permission boundaries constrain what an assumed role can do. These controls address the Identity pillar of CISA's Zero Trust Maturity Model v2.0, which grades organizations across five pillars and four stages, from Traditional through Initial and Advanced to Optimal.

Strength in one pillar does not transfer to the others. Encryption of all internal traffic, east-west included, is an Optimal-stage requirement under the ZTMM Networks pillar's Traffic Encryption function, not something available at Advanced. Many financial cloud environments sit at Initial on Networks while sitting at Advanced or better on Identity, and read their overall posture from the pillar they are strongest in.

The specification gap is worth stating precisely, because it is not where most commentary places it. An IAM role assumption proves that the AWS control plane accepted a signed request from a principal holding the right permissions. It does not prove that the process making that call is the workload the role was assigned to, that the workload has not been compromised since the role was last assumed, or that the data-plane path carrying subsequent traffic is the path evaluated when the IAM decision was made. SP 800-207A's second requirement, service authentication through short-lived workload-scoped credentials, is the requirement that closes this. It is also the one AWS-native architectures most often leave open.

## Four places where implicit trust enters the VPC

Four structural patterns recur across AWS reference architectures and public vendor research. Each looks like a zero-trust control. Each authenticates a principal rather than a workload.

### 1. VPC endpoint policies that authorize by principal, not by workload

A VPC endpoint policy for an S3 bucket or a DynamoDB table can restrict access to a specific IAM role.

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"AWS": "arn:aws:iam::123456789012:role/PaymentProcessorRole"},
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::transaction-records/*"
  }]
}
\`\`\`

This policy permits any process that can present credentials for PaymentProcessorRole. In an ECS cluster where several services share a task role, or in a Kubernetes cluster where IRSA binds a role to a service account that multiple pods can request, it grants access to a class of workloads. The endpoint policy looks like a zero-trust control. It is a coarse-grained authorization control that leaves workload identity unverified, and CloudTrail will not separate the callers beyond a session name.

AWS has shipped a partial answer. In March 2023 it introduced the global condition keys \`aws:EC2InstanceSourceVPC\` and \`aws:EC2InstanceSourcePrivateIPv4\`, which let a policy require that EC2 instance role credentials be used only from the VPC and private address they were issued to.

\`\`\`json
{
  "Effect": "Deny",
  "Action": "*",
  "Resource": "*",
  "Condition": {
    "StringNotEquals": {
      "aws:ec2InstanceSourceVPC": "\${aws:SourceVpc}"
    }
  }
}
\`\`\`

The boundary of that control is the instructive part. \`aws:SourceVpc\` is populated only when a request traverses a VPC endpoint, so any service without VPC endpoint support falls outside it, and AWS documents that actions such as mounting an EFS file system will be denied outright. The keys bind a credential to a network location, which is a real improvement over binding it to nothing. They do not bind it to a workload, and they say nothing about which process on that instance is making the call.

Deployment is thin. Datadog's 2025 State of Cloud Security study found that two in five organizations use data perimeters in AWS at all; of those, 32 percent implement them through S3 bucket policies and 13 percent through VPC endpoint policies, while fewer than 1 percent apply them at the organization level through service control policies or resource control policies. The control most often cited as evidence of cloud zero trust is, in the aggregate, both coarse and rarely placed where it would matter.

### 2. mTLS terminated at the load balancer rather than at the workload

Service meshes and application load balancers can enforce mutual TLS between services. AWS added mutual TLS to the Application Load Balancer in November 2023, with two modes: passthrough, which forwards the client certificate chain to the target in an HTTP header, and verify, in which the ALB validates the certificate against a trust store and terminates the connection.

In verify mode the workload receives an assertion it did not check and cannot independently confirm. Traffic between the termination point and the workload process is unencrypted and unauthenticated inside the pod network or the instance. A process that can reach that internal path, through a compromised sidecar, a misconfigured network policy, or a container escape, sits on the trusted side of the mTLS boundary without ever having authenticated. This is precisely the placement problem SP 800-207A addresses by requiring that policy enforcement points be non-bypassable and independent of application code.

### 3. IAM role-assumption chains that extend trust across account boundaries

Cross-account role assumption is standard practice in multi-account AWS architectures. A role in account A trusts a role in account B, which trusts a role in account C. Each link is individually auditable in CloudTrail. The chain as a whole appears in no single account's IAM policies.

AWS IAM Access Analyzer will not close this. Its external access analyzer applies automated reasoning to resource-based policies to identify resources reachable from outside a declared zone of trust, Region by Region, and it must be enabled in every Region in use. It evaluates edges, not paths. A three-account chain in which each hop sits inside somebody's zone of trust produces no finding at all, which is the exact shape of the problem. Transitive analysis requires separate tooling, graph-based IAM analyzers such as PMapper, and it requires the institution to treat the role-assumption graph as an artifact worth maintaining. The FFIEC AIO booklet's guidance on interconnected and third-party systems applies here: the institution is responsible for understanding the full trust graph, not just the local node.

### 4. VPC Lattice auth policies, which repeat the pattern in AWS's newest east-west control

The first three patterns predate 2023, and it would be reasonable to read them as legacy debt. The newest AWS service-to-service control shows otherwise.

VPC Lattice auth policies are IAM resource-based policies attached to a service or service network. When the auth type is \`AWS_IAM\`, requests must carry a valid SigV4 signature, and both the auth policy and the caller's identity-based policy must explicitly allow the action. The authenticated caller is an IAM principal: a user, a role, a federated user, a service, or an account. Lattice also supports anonymous principals, so a caller inside a VPC attached to the service network that does not sign with SigV4 can still be permitted if the policy allows it.

AWS shipped a Layer 7 service-to-service authorization control, positioned for zero-trust architectures, that authenticates an IAM principal rather than a workload and that permits an unauthenticated path by configuration. The gap is structural, not historical.

## One mechanism, fully documented

The abstraction is easier to dismiss than the mechanism, so here is the mechanism.

In a default Amazon EKS configuration, a pod can reach the worker node's Instance Metadata Service and retrieve the node role's credentials with a single HTTP request to 169.254.169.254. No exploit is required beyond whatever gave the attacker execution inside the pod, an SSRF or an RCE in the application. The pod was authenticated as nothing and authorized by nothing. It inherited a role because it was running in the right place.

Datadog's published guidance is that enforcing IMDSv2 alone is not sufficient. The recommended configuration is IMDSv2 required, with \`http_put_response_hop_limit\` set to 1, plus a Kubernetes NetworkPolicy blocking pod access to the metadata endpoint. Both controls are network controls. Neither of them authenticates a workload; they restrict where an ambient credential can be picked up. The same study cited above found that 49 percent of EC2 instances enforce IMDSv2, up from 32 percent the year before, and that only 14 percent of instances two or more years old do.

## What the guidance already says, and what it does not yet ask

The FFIEC has not overlooked system-to-system authentication. Its August 11, 2021 statement on Authentication and Access to Financial Institution Services and Systems, transmitted as OCC Bulletin 2021-36 and SR 21-14, is explicit that authentication scope covers "users accessing financial institution information systems, including employees, board members, third parties, service accounts, applications, and devices," and that "authentication considerations have extended beyond customers and include employees, third parties, and system-to-system communications." The supervisory expectation has existed for five years.

What does not exist is the translation into cloud data-plane terms. The 2021 statement was written in the vocabulary of user sessions, service accounts, and API credentials. It does not say what system-to-system authentication means when the two systems are a sidecar proxy and an application process sharing a network namespace, when the credential is an ambient instance profile that no party issued to a specific workload, or when the trust relationship is a three-account role chain that no single account's policy makes visible.

The AIO booklet, which is where an examiner would look for architectural criteria, was issued on June 30, 2021 and places zero trust at section VII.B, under "Evolving Technologies," alongside cloud computing, microservices, and machine learning. That placement was accurate in 2021. In 2026 it means that the one supervisory document addressing cloud architecture treats zero trust as something an examiner may encounter, rather than as an architecture with examination procedures attached.

Between a principle stated in 2021 and a procedure that would test it in a 2026 cloud environment, there is nothing. Examination frameworks necessarily lag architectural practice, and the CAT sunset was a defensible response to the proliferation of better external frameworks. The lag creates a specific and consequential risk: a financial institution can demonstrate mature IAM, documented segmentation, and a zero-trust policy, and satisfy every question actually asked, while leaving the data-plane trust gap entirely unaddressed.

## What verified workload identity at the data plane requires

Closing the gap means treating workload identity as a cryptographic assertion rather than an inference from IAM role membership. Three changes follow.

Every service-to-service call inside the VPC should carry a short-lived, workload-specific credential that the receiving service verifies before processing the request. SPIFFE and SPIRE, the open standards that underpin most production service mesh implementations and that NIST names in SP 800-207A, issue SVIDs bound to a specific workload identity rather than to a role that many workloads share. AWS has moved partway toward this. EKS Pod Identity replaces IRSA's implicit OIDC trust-policy condition with an explicit, enumerable association between a service account and a role, retrievable through \`ListPodIdentityAssociations\`. That is a genuine auditability improvement. It is not workload authentication: the credential it delivers is a standard AWS session token retrieved from a link-local endpoint by way of the \`eks-auth:AssumeRoleForPodIdentity\` action, not a verifiable identity document bound to the workload. A receiving service still cannot verify who called it. It knows only that AWS accepted a signature.

mTLS should be enforced at the workload process boundary rather than at a network appliance boundary. This is operationally harder, because it requires the application or its sidecar to participate in certificate management, and it is the only configuration consistent with SP 800-207A's requirement that policy enforcement points be non-bypassable and independent of application code.

Role-assumption chains should be treated as a graph and analyzed as one. Since Access Analyzer evaluates edges within a zone of trust rather than transitive paths across zones, this requires deliberate tooling and a decision that the graph is a maintained artifact, reviewed as part of change management for every new cross-account integration.

## Why this reaches beyond the institution

U.S. financial-crime controls depend on the integrity of the data that feeds them. Bank Secrecy Act reporting, OFAC sanctions screening, and the transaction monitoring systems that generate Suspicious Activity Reports all run on data held in cloud environments. An attacker who achieves lateral movement inside a financial institution's VPC and reaches the data stores behind those pipelines can corrupt or exfiltrate the information federal supervisors use to enforce compliance with federal law.

Supervisors have said the integrity of core banking and compliance systems is a priority. The interagency paper on sound practices to strengthen operational resilience, SR 20-24, revised June 2, 2026, applies to institutions with average total consolidated assets of $250 billion or more, or $100 billion or more with at least $75 billion in specified cross-jurisdictional activity, which is to say precisely the institutions running the largest financial cloud estates. The FFIEC's Joint Statement on Security in a Cloud Computing Environment set out cloud risk management principles for the sector in April 2020. The OCC's Cybersecurity and Financial System Resilience Report of June 2026, filed under the Consolidated Appropriations Act, 2021, restates operational resilience and supply chain risk as supervisory priorities.

The data-plane trust gap is a direct path to violating the integrity those documents are written to protect. Treating it as a matter of security hygiene understates what is at stake.

## What should engineers do differently?

Treat IAM authorization and workload authentication as separate problems requiring separate controls. An IAM policy that permits a role is not a substitute for a cryptographic assertion that the calling workload is who it claims to be.

Concretely: verify SPIFFE SVIDs at the receiving workload rather than trusting the mesh to have done it; terminate mTLS at the process boundary rather than at the load balancer; apply the EC2 instance source-VPC condition keys where the service supports VPC endpoints, and document explicitly which services do not; enforce IMDSv2 with a hop limit of 1 and block metadata access at the network layer as well; and build role-assumption chain analysis into security review for every new cross-account integration.

## What supervisors should ask

A revised examination framework for cloud environments does not need a new theory of zero trust. It needs questions specific enough that an institution's answer either produces evidence or exposes the gap. Six would cover most of it.

1. For each service-to-service call path that reaches a system of record feeding BSA reporting, what credential does the receiving service verify, and what does it verify it against?
2. Where is mTLS terminated relative to the workload process, and what traverses the segment between the termination point and that process?
3. Produce the role-assumption graph, including cross-account edges. Identify every path of length two or greater that terminates at an in-scope data store.
4. Which VPC endpoint policies constrain access by workload attribute rather than by IAM principal alone, and which condition keys implement that constraint? For services that do not support VPC endpoints, what compensates?
5. For workloads on EC2 and EKS, is IMDSv2 enforced with a hop limit of 1, and is metadata access additionally blocked at the network layer?
6. What is the maximum credential lifetime for service-to-service authentication, and what component issues and rotates those credentials?

Asking whether an institution has a zero-trust policy is not the same as asking whether its workloads verify each other's identity before exchanging data.

If your institution's zero-trust documentation were handed to an engineer who had just achieved lateral movement inside your VPC, would they find anything in it that would have stopped them?

_The annotated reference architecture for this article, with each boundary mapped to the NIST SP 800-207A requirement it leaves unmet and to the examination question that would surface it, is published in the aws-trust-boundaries repository under CC BY 4.0._

_Written in a personal capacity. All analysis draws on public standards, public vendor documentation, and published research._`,
  date: "2026-08-31",
  readTime: "12 min read",
  category: "Security",
  tags: ["Zero Trust", "AWS", "Cloud Security", "Kubernetes", "SPIFFE", "IAM", "Compliance"],
  mediumUrl: "https://levelup.gitconnected.com/the-trust-your-zero-trust-architecture-still-grants-6e4df5c3695b",
  publication: "Level Up Coding",
},
{
  id: "your-ml-platform-is-serving-itself",
  title: "Your ML Platform Is Serving Itself",
  seoTitle: "Is Your ML Platform a Bottleneck? A 2-Hour Audit to Find Out",
  excerpt: "Internal ML platforms drift toward serving the team that built them. Here's how the inversion happens, why adoption metrics never catch it, and a four-step audit that tells you more than your dashboards ever will.",
  content: `![Your ML Platform Is Serving Itself](https://miro.medium.com/v2/resize:fit:1024/1*pnMcJAvf9bZvs7a6QES0-g.jpeg)

*Is your ML platform becoming a bottleneck instead of an accelerator?*

You set a budget for it, formed a special team to work on it, assigned it a name, created a roadmap, and provided it with a Confluence space containing seventeen pages of onboarding documentation. Yet at some point between the first internal demonstration and the fourth quarterly planning cycle, your ML platform simply ceased to serve the people for whom it had been built and began serving itself instead.

This isn't a skill problem. The teams building internal ML platforms are usually the strongest engineers in the company. The issue is structural in nature and gradually worsens until a senior data scientist decides to resign, a product deadline is delayed by three sprints, or finally someone speaks up and says out loud what all the others have been thinking: "It's quicker just to carry out this task outside the platform."

## The Inversion Nobody Audits

The situation worth looking at is that internal ML platforms are generally tailored to the team that developed them rather than to those who use them. This is not intentional — it's more like a natural tendency. Platform engineers tend to design systems in accordance with their own mental models, operational limitations, and their idea of what is "correct". As a result, the platform ends up reflecting their priorities.

What starts as a well-intentioned abstraction layer — "we'll handle the infrastructure so data scientists can focus on modeling" — gradually accumulates:

- Mandatory approval gates for model registration that require platform team review
- Opinionated SDK wrappers that abstract away just enough to make debugging painful
- Standardized container templates that work perfectly for 80% of use cases and create week-long blockers for the other 20%
- Centralized feature stores with ingestion pipelines that only the platform team fully understands

*The more enterprise-grade the platform becomes, the more it begins to look like the traditional IT ticketing systems that MLOps was meant to replace; you've simply exchanged one form of bureaucracy for a more attractive one.*

The right question isn't "Does our platform have good coverage?" Rather, it is: **Where does cognitive load go when a data scientist encounters a problem?** If the answer is "onto the practitioner, not onto the platform", you have an inversion problem.

## What the Metrics Won't Tell You

Usually platform teams assess adoption (the number of models registered), reliability (uptime and pipeline success rates), and velocity (deployment frequency). Such metrics are reasonable but also dangerously incomplete.

Consider what they miss:

- **Time-to-first-experiment:** How long does it take a new machine learning practitioner to carry out their first meaningful experiment on your platform? If the response requires reading a 40-page onboarding document, setting up three CLI tools, and waiting for the IAM permissions to propagate, then you're measuring the wrong thing.
- **Workaround rate:** The proportion of teams that carry out experiments or serve models outside of the platform since the platform's process is too slow or too inflexible is rarely monitored, and from my experience it is almost always greater than leaders suppose.
- **Escalation frequency:** The number of Slack messages per week that the platform team gets which begin with "quick question" but are in fact blockers is a leading indicator of abstraction failure.

A fintech engineering organization I spoke with found that their data science team was maintaining two parallel environments — the official one, used for anything that had to undergo a compliance review, and a more loosely controlled AWS account for everything else. The platform team had no knowledge of the shadow environment, and the data science team had ceased requesting new features, as they no longer expected them to arrive in time to be relevant.

It is worth being precise about what that story actually is. A shadow environment is a design signal, but it is also an audit finding. If any of that work touched regulated data or fed a model that made decisions about customers, the platform team's lack of visibility was itself the risk, however reasonable the data science team's motives were.

The point to establish before you begin eliminating friction is that part of what practitioners perceive as bureaucracy is actually model risk management, and this has come about because a regulator, an auditor, or a previous incident required it. The approval checkpoints concerning the registration of models in lending or fraud situations do not mean that the platform team is exercising control. A useful way to assess this is to consider whether a given step results in a record that someone outside your organization could request to see; if it does, then your responsibility is to ensure that this record is produced quickly, automatically, and in a clear format, not to make the step optional. If it does not, the step should be considered for removal and treated as such.

## The Cognitive Load Redistribution Trap

A good platform engineering approach helps reduce the cognitive load. What usually takes place, however, is a redistribution — the complexity does not go away; it just shifts.

A self-service feature pipeline might eliminate the need for data scientists to write Spark jobs. But if the pipeline's configuration requires an understanding of a custom YAML schema which has seventeen optional fields, three of which interact in non-obvious ways, you're shifting the complexity from the code over to the configuration. That isn't simplification; it's merely translation.

The same thing happens with model serving. It is reasonable to abstract Kubernetes from the data scientists. However, if your internal serving abstraction forces them to understand your platform's resource quota model, your specific autoscaling annotations, and a deployment manifest format that differs from both the native Kubernetes format and any publicly available documentation — then you have established a proprietary knowledge silo that deepens over time.

\`\`\`yaml
# What your platform team designed:
serving:
  model_ref: "registry://fraud-detection/v3.2"
  scaling_profile: "adaptive-p95"
  resource_tier: "ml-standard-4"
  canary_weight: 10
  rollback_policy: "auto-p99-threshold"

# What the data scientist needed to understand to write this:
# - Your internal registry URI scheme
# - Four scaling profiles and when to use each
# - Six resource tiers and their actual CPU/memory mappings
# - Your canary traffic routing implementation
# - Your custom rollback threshold logic
\`\`\`

Every piece of institutional knowledge your platform requires is a tax on everyone outside the platform team.

## How to Audit Your Own Platform

Before you have your next look at the platform roadmap, carry out this exercise; it will take two hours and will tell you more than your adoption metrics ever will.

**Step 1 — The Stranger Test:** Ask a person who became a member of the organization within the last six months to take a model from a Jupyter notebook to a production endpoint using only the provided platform documentation. Watch them without interfering and record each time they pause, check Slack, or ask a question.

**Step 2 — The Escape Hatch Inventory:** Ask three senior data scientists to provide a list of all the instances in the past quarter when they had to work around the platform rather than using it. Don't make this seem punitive — instead present it as part of a design audit. The answers will be enlightening.

**Step 3 — The Ticket Taxonomy:** Retrieve the support requests from the last 90 days and classify them. Whenever more than 30% of the requests are different versions of "how do I do X even though it should be basic", then your abstraction layer has a comprehension gap.

**Step 4 — The Deprecation Question:** Find out from your platform team what features they would get rid of if they had the chance. Features that nobody uses but everyone has to work around are an example of accumulated debt that does not appear in technical debt reviews.

This audit does not result in any blame being assigned; rather, it sends out a prioritization signal. What friction points are causing the greatest diversion of energy away from real ML work?

## From Gatekeeper Back to Accelerator

It's worthwhile, before the fixes are implemented, explaining why this problem persists. Inversion is seldom a failure of intention; rather, it is the result of the incentives in place. The platform teams are financed and assessed based on delivering their roadmaps: the features being released, the migrations finished, and the workloads being brought on board. Almost none of these criteria take into account how long it takes a practitioner to get their first model into production, and none of them pick up on work that has simply disappeared from the platform. Until a practitioner's experience is reflected in the platform team's performance metrics, the audit I referred to above will show what the issue is but will make no difference. This is a matter of leadership, not of engineering.

Getting back isn't about doing a platform rewrite; it's about having a philosophical reset.

The most effective ML platforms I've seen share a few characteristics that have nothing to do with the technology stack:

- **The company regards data scientists as their main customer** rather than as a secondary stakeholder. The platform roadmaps are based on practitioners' difficulties, not on the platform team's intuitions. This seems obvious but is seldom put into practice.
- **They intentionally include ways of escaping.** Instead of making all workloads go through a single abstraction, they set up a "golden path" for typical cases and ensure it is really easy to move down to lower-level primitives when necessary. The aim is to make the correct approach easy, not to make the incorrect one impossible.
- **They measure time-to-value, not just uptime.** A platform that is 99.9% available but still takes three weeks to onboard a new model type is not high-performing. While reliability is necessary, it by itself is not enough.
- **They have embedded office hours, not just providing documentation.** Although asynchronous documentation is valuable, it is through synchronous feedback sessions — in which platform engineers sit with practitioners and observe them working — that abstraction failures can be detected before they become workarounds.

The aim has always been to get better models to market more quickly while experiencing fewer production incidents. The platform was merely a method of achieving this; if it's starting to become the main objective, that should be discussed during your next leadership meeting.

What I'd like to leave you with is this: when was the last time you sat down with a data scientist and watched them try to use your platform without any assistance? Not a demonstration and not a guided tour — just watch them.

If it has gone past a quarter, then that should be your starting point.

What is the greatest source of annoyance that your ML platform causes for your practitioners at the moment — and how did you work it out?`,
  date: "2026-08-28",
  readTime: "8 min read",
  category: "Engineering",
  tags: ["MLOps", "Platform Engineering", "Machine Learning", "Developer Experience", "Engineering Leadership", "Cognitive Load"],
  mediumUrl: "https://medium.com/the-applied-engineer/your-ml-platform-is-serving-itself-9bdcabd23cdb",
  publication: "The Applied Engineer",
},
{
  id: "thoughtworks-tech-radar-vol-34-what-actually-matters",
  title: "Thoughtworks Tech Radar Vol. 34: What Actually Matters",
  seoTitle: "Thoughtworks Tech Radar Vol. 34: What Actually Matters in 2026",
  excerpt: "The Hold ring is gone, replaced by Caution. Context engineering moved to Adopt, LangGraph moved out, and MCP-by-default is now something to think twice about. Here's what the April 2026 radar says about putting coding agents on a leash.",
  content: `![Thoughtworks Technology Radar Vol. 34](https://miro.medium.com/v2/resize:fit:1024/1*rOiUnD82olgsgvKzET2tuQ.png)

The April 2026 radar just came out. The "Hold" ring is gone, replaced by "Caution." The whole document tackles one question: how do you evaluate technology when AI evolves faster than you can assess it?

## Context Engineering Is Now Foundational

Context engineering moved to Adopt, not just as an optimization trick, but as an architectural concern. Teams are shifting from cramming everything into large context windows to using **progressive context disclosure**: starting with a lightweight index and pulling in only what's relevant.

Three areas are developing quickly: prompt caching for static instructions, dynamic retrieval loading only necessary MCP servers, and **context graphs** modeling institutional reasoning as queryable data. Treating AI context as a static text box leads to hallucinations.

## Putting Agents on a Leash

The idea of a "coding agent harness" runs throughout the document.

**Feedforward controls include:** Agent Skills (modular, just-in-time instructions), spec-driven development frameworks, and curated shared instructions tied to service templates.

**Feedback controls involve:** compilers, linters, and test suites integrated into agent workflows. These trigger auto-correction before human review. Tools like cargo-mutants, WuppieFuzz, and CodeScene fit here.

The **feedback flywheel** connects everything — it's basically retrospectives for your coding agent setup.

## Adopt Now

**Claude Code** — Used daily in production delivery. CLI agent benchmark. Pair it with curated instructions and rigorous review.

**Cursor** — Default choice alongside Claude Code. Many developers prefer supervising agents within an IDE.

**Passkeys** — 15 billion eligible accounts globally. NIST classifies synced passkeys as AAL2-compliant. Avoid SMS OTP fallbacks.

**Zero trust architecture** — Essential for agent deployments. Practice least privilege, continuous monitoring, and use SPIFFE for identity.

**DORA metrics** — If lead times don't decrease, faster code generation doesn't guarantee better results. Keep an eye on rework rate.

**Apache Iceberg** — Fundamental for technology-agnostic lakehouse architectures. Supported by all major providers.

**React Native** — New architecture addressed bridge bottlenecks. It's the main recommendation for cross-platform mobile.

**Svelte** — No longer a niche option. It offers small bundles, strong performance, and a simpler component model. A credible alternative to React/Vue.

## Trial — Worth Pursuing

**Agent Skills** — Modular context loading. One reason teams rethink MCP-by-default.

**Mutation testing** — The most honest sign of test quality. AI generates "perpetually green" tests, and mutation testing can catch these.

**Sandboxed execution for coding agents** — A sensible default. Use Dev Containers for ephemeral setups, and Sprites for persistent state.

**Graphiti** — A temporal knowledge graph for LLM memory. It tracks how facts change over time, showing 18.5% accuracy improvements in benchmarks.

**LangGraph** — Moved OUT of Adopt. The stateful-graph approach isn't always the right fit. Simpler patterns often yield leaner systems.

## Caution — Think Twice

**Agent instruction bloat** — AGENTS.md files can accumulate and conflict. Models may overlook buried content. Be selective.

**Codebase cognitive debt** — The gap between what your system does and what your team understands is widening. AI speeds this up.

**Coding throughput as productivity** — Counting lines of code and pull requests creates floods of poorly aligned code. It's better to focus on first-pass acceptance rates.

**MCP by default** — A good CLI often suffices. Use MCP only when you need protocol-level interoperability.

**Coding agent swarms** — Using many agents dynamically. Successful examples relied on detailed specs and thorough tests, which is not typical in product development.

## Monday Morning Takeaways

**Engineer your context** — use progressive disclosure, not everything at once.

**Harness your agents** — apply feedforward and feedback controls.

**Measure what matters** — focus on DORA metrics and first-pass acceptance, not just lines of code.

**Security is essential** — maintain zero trust, use sandboxed execution, and conduct toxic flow analysis.

**Don't default to MCP** — a good CLI often suffices.

The tools changed again. The principles remain the same.

_Source: [Thoughtworks Technology Radar Vol. 34, April 2026](https://www.thoughtworks.com/en-us/radar)_`,
  date: "2026-04-28",
  readTime: "5 min read",
  category: "AI",
  tags: ["AI", "Tech Radar", "Thoughtworks", "Coding Agents", "Software Engineering", "DevOps", "Context Engineering"],
  mediumUrl: "https://levelup.gitconnected.com/thoughtworks-tech-radar-vol-34-what-actually-matters-a0559f45ec5a",
  publication: "Level Up Coding",
},
{
  id: "notebooklm-turns-documents-into-answers",
  title: "The AI Tool That Actually Makes Your Documents Useful",
  seoTitle: "Why NotebookLM Is About to Change How You Work With Documents",
  excerpt: "NotebookLM only knows what you teach it — your PDFs, your notes, your docs — and it cites every claim. Here's what makes Google's research assistant different, and how to get your first notebook running in ten minutes.",
  date: "2026-01-25",
  readTime: "6 min read",
  category: "AI",
  tags: ["AI", "NotebookLM", "Google", "Gemini", "Productivity", "Documentation", "Research"],
  mediumUrl: "https://zagran.medium.com/the-ai-tool-that-actually-makes-your-documents-useful-why-notebooklm-is-about-to-change-everything-1828c14f4ecc",
  content: `Imagine having a research assistant who never forgets, always cites sources, and can turn your messy pile of documents into actionable insights in minutes. That's not science fiction — it's NotebookLM, and it's free.

![NotebookLM overview](https://miro.medium.com/v2/resize:fit:1024/1*TrJnqYV4lazdxunEbbsnoQ.png)

Remember the last time you needed to find that one crucial detail buried somewhere in dozens of PDFs, meeting notes, and Google Docs? Or when you had to write a report synthesizing information from multiple sources, spending hours jumping between documents?

Those days are ending.

Google's NotebookLM is quietly revolutionizing how we work with information, and the opportunities it's creating are genuinely exciting. This isn't another AI tool that gives you generic answers — it's your personal research assistant that works exclusively with *your* documents and *your* data.

![NotebookLM interface](https://miro.medium.com/v2/resize:fit:1024/1*KA2_7_Zd5P4qgUwdjX-XIw.png)

## What Makes This Different (And Why You Should Care)

Here's the game-changer: NotebookLM only knows what you teach it. Upload your documents, and it becomes an expert on exactly that content — no more, no less. When it answers your questions, it cites specific sources. When it creates summaries, you can verify every claim.

This solves the biggest problem with AI tools: trust. You're not getting hallucinated facts or generic responses. You're getting insights derived specifically from your materials, with receipts.

## The Magic Happens in the Studio

NotebookLM's "Studio" feature is where things get exciting. It can take your boring documents and transform them into:

**Podcast-Style Conversations:** Upload your research papers, and two AI hosts will have a natural discussion about your content. It sounds almost too good to be true until you hear it — they debate key points, ask clarifying questions, and make connections you might have missed.

**Interactive Study Guides:** Perfect for learning new topics or onboarding team members. The AI creates quizzes, flashcards, and Q&A sessions based on your materials.

**Professional Presentations:** Need slides for Monday's meeting? Upload your project documents, and NotebookLM generates a structured presentation with your key points organized logically.

**Data Tables:** The newest feature extracts structured information from messy documents and creates clean tables you can export to Google Sheets. Meeting transcripts become action item lists. Research papers become comparison charts.

## Real People, Real Results

The use cases emerging from early adopters are genuinely inspiring:

**Sarah, a marketing manager,** uploads competitor websites and product docs to NotebookLM. In 10 minutes, she has a comprehensive competitive analysis that used to take her team days to compile.

![Studio features](https://miro.medium.com/v2/resize:fit:1024/1*zTGp13ZYx7oeB3TexsHKJg.png)

**Dr. Martinez, a university professor,** creates course notebooks with all semester readings. Students can ask specific questions about assignments and get answers that cite exact page numbers from their textbooks.

**Jake's startup team** uploads all their pitch decks, market research, and investor feedback. When preparing for the next funding round, they ask NotebookLM to identify gaps in their story and generate talking points that address previous investor concerns.

**A hospital administration team** uploads policy documents and creates audio overviews that staff can listen to during commutes, making compliance training actually engaging.

## The Technology That Makes It Possible

Under the hood, NotebookLM runs on Google's latest Gemini 3 model, which brings dramatically improved reasoning and understanding. But here's what's really exciting: it's getting better fast.

Recent updates include:

- **Deep Research:** The AI can now go out and find additional sources for you, building comprehensive research reports on any topic
- **Gemini Integration:** You can now pull your NotebookLM content directly into Google's main AI assistant for even more powerful analysis
- **Mobile Apps:** Take your knowledge base anywhere with full iOS and Android support

## Why This Matters for Everyone

We're witnessing something bigger than just another productivity tool. NotebookLM represents a new way of thinking about information management:

**For Students:** Instead of highlighting textbooks and hoping you remember, create interactive study systems that quiz you and explain concepts in different ways.

**For Professionals:** Transform scattered project documents into a queryable knowledge base that new team members can learn from instantly.

**For Researchers:** Synthesize findings from dozens of papers in minutes instead of weeks, with full citation tracking.

**For Content Creators:** Turn one piece of long-form content into blog posts, social media content, newsletters, and presentations — all maintaining consistent messaging.

**For Small Businesses:** Create training materials, customer onboarding guides, and internal documentation that actually gets used because it's interactive and accessible.

![Knowledge base in practice](https://miro.medium.com/v2/resize:fit:1024/1*c7lHHAB85vPd1uPDJbLdgQ.png)

## Getting Started: Your First Notebook

The beauty of NotebookLM is how simple it is to begin:

1. Go to [notebooklm.google.com](https://notebooklm.google.com) — it's free with any Google account
2. Create your first notebook and give it a specific focus
3. Upload 5–10 related documents (PDFs, Google Docs, web pages, even YouTube videos)
4. Ask questions about your content and watch the magic happen
5. Try the Studio features — generate an audio overview and prepare to be amazed

Start small. Pick one project, one course, or one area of interest. Upload the relevant materials and just start asking questions. Within minutes, you'll see why people are calling this the most useful AI tool they've ever used.

## The Opportunities Are Everywhere

What excites me most about NotebookLM isn't just what it does today — it's what becomes possible when everyone has access to this kind of intelligence amplification.

**Imagine** customer service teams with instant access to every policy document and FAQ, providing perfect answers in seconds.

**Picture** sales teams with comprehensive competitive intelligence at their fingertips, ready to address any objection with cited facts.

**Think about** students who can have Socratic dialogues with their textbooks, asking "what if" questions and exploring ideas interactively.

**Consider** small businesses creating professional training programs without hiring expensive consultants.

The democratization of advanced research and analysis capabilities is happening right now. The question isn't whether this technology will transform how we work with information — it's whether you'll be an early adopter or play catch-up later.

## Why Now Is the Time to Jump In

NotebookLM is still in its explosive growth phase. New features launch monthly. The integration with Google's ecosystem is deepening. And most importantly, it's free for the core functionality that most people need.

This is one of those rare moments where a genuinely transformative technology is accessible to everyone. Not just big corporations with massive AI budgets. Not just tech companies with engineering teams. Everyone.

The organizations and individuals who master tools like NotebookLM now will have significant advantages as AI becomes more integrated into everyday work. They'll be the ones who know how to ask better questions, create more effective workflows, and generate insights that others miss.

## Your Information Advantage Starts Here

![Turning documents into an advantage](https://miro.medium.com/v2/resize:fit:1024/1*G1a1Tqc_fOcm90DuCMOd9A.png)

In a world where everyone has access to the same base AI models, your competitive advantage comes from how well you curate and work with your specific information. NotebookLM gives you superpowers for exactly that challenge.

Your documents don't have to be passive files anymore. Your research doesn't have to live in isolation. Your expertise doesn't have to be locked in your head.

With NotebookLM, all of that knowledge becomes queryable, shareable, and incredibly more useful. The future of information work is here, it's accessible, and it's waiting for you to explore what becomes possible.

Ready to turn your documents into your competitive advantage? Start with one notebook. Ask one question. See what happens when your information finally works for you instead of against you.

The transformation begins with that first upload.

_Try NotebookLM for yourself at [notebooklm.google.com](https://notebooklm.google.com). What will you build with your first notebook?_`
},
{
  id: "when-one-dns-record-broke-the-internet",
  title: "When One DNS Record Broke the Internet",
  seoTitle: "AWS Outage October 2025: How One DNS Record Caused $500M in Losses",
  excerpt: "A deep dive into the October 2025 AWS outage that generated 17 million outage reports across 60+ countries, exposing critical vulnerabilities in America's digital infrastructure.",
  date: "2026-01-19",
  readTime: "8 min read",
  category: "AWS",
  tags: ["AWS", "DNS", "DynamoDB", "Cloud Resilience", "US-EAST-1", "Outage Analysis", "Infrastructure"],
  mediumUrl: "https://medium.com/the-applied-engineer/when-one-dns-record-broke-the-internet-7f4d64e76dc6",
  publication: "The Applied Engineer",
  content: `The $500 Million Wake-Up Call for Cloud Resilience

## Introduction

At 3 AM Eastern on October 20, 2025, a Ring doorbell in suburban Ohio went dark. Simultaneously, a Robinhood trader in Manhattan watched his Bitcoin position freeze mid-transaction. In London, taxpayers discovered HMRC's Government Gateway, serving 50 million users, had vanished. And across trading floors, boardrooms, and data centers worldwide, a single question crystallized: How did one DNS record take down so much of the internet?

The answer reveals something more structural than situational. At 11:48 PM Pacific on October 19, two automated processes within AWS's internal DNS management system attempted to update the same record simultaneously. The result: a race condition that produced an empty DNS entry for dynamodb.us-east-1.amazonaws.com - the digital equivalent of erasing a phone number from the directory while someone was dialing it. Within minutes, a cascade began that would generate over 17 million outage reports across 60+ countries and expose an uncomfortable truth: America's digital infrastructure has a single point of failure problem.

For approximately fifteen hours, household names went dark. Snapchat. Reddit. Robinhood. Coinbase. Amazon's own retail site. United Airlines passengers couldn't check in. Ring doorbells stopped working. Banking services froze mid-transaction.

## Counting the Costs: What We Know (and Don't Know)

When businesses discuss cloud costs, they focus on compute hours, storage tiers, and data transfer fees. But there's another number that rarely appears in budget spreadsheets: the collective cost of major cloud outages.

### The Visible Costs

Parametrix, a cloud insurance provider monitoring 500+ data centers and 7,000+ cloud services worldwide, estimated direct financial losses to U.S. companies at $500–650 million. For context: Gartner's 2014 study pegged enterprise downtime at $5,600 per minute; Ponemon Institute's recent analyses suggest this now exceeds $9,000 per minute for large organizations.

The actual figure for any given organization depends heavily on industry vertical, organization size, and business model.

### The Hidden Costs

But direct revenue loss understates the damage:

- **Trust erosion compounds.** PwC research shows 32% of customers abandon brands after a single bad experience. The October outage wasn't a single bad experience - it was fifteen hours of them, across every touchpoint.
- **Insurance gaps emerge.** Most cyber policies require 8+ hours of downtime before coverage triggers. CyberCube estimated potential claims between $38 million and $581 million - but many companies discovered their actual exposure far exceeded their coverage.
- **Innovation stalls.** When systems fail, engineering teams abandon roadmaps to fight fires. Technical debt accumulates. Strategic initiatives die in triage.
- **Reputation becomes liability.** In an always-on economy, downtime is a competitive disadvantage. Resilience has shifted from engineering goal to market differentiator.

## Government Systems in the Crosshairs

The October 2025 outage didn't just disrupt commercial platforms - it reached into government operations on both sides of the Atlantic.

In the United Kingdom, HMRC (Her Majesty's Revenue and Customs) and its Government Gateway login system, serving 50 million registered users, went dark. Lloyds Banking Group, Bank of Scotland, and Halifax experienced simultaneous failures. The disruption prompted Dame Meg Hillier, Chair of the UK Treasury Committee, to formally question Parliament about why "seemingly key parts of our IT infrastructure are hosted abroad" when a data center in Virginia can take down British tax services.

Central UK government departments hold 41 active contracts with AWS worth a total of £1.11 billion, according to data from public sector procurement specialist Tussell. This includes a deal with HMRC worth up to £350 million between December 2023 and November 2026.

As Mark Boost, CEO of UK cloud provider Civo, asked: "Why are so many critical UK institutions, from HMRC to major banks, dependent on a data center on the east coast of the US?"

## How One DNS Record Broke the Internet

To understand why this outage cascaded so catastrophically, you need to grasp a fundamental truth about modern cloud architecture: everything depends on something else.

Think of DNS as the Internet's phone book. When you type a URL, DNS translates it into an IP address so your application knows where to send requests. Simple, reliable, foundational. When DNS works, you never think about it. When it fails, everything stops.

Here's what happened:

**11:48 PM PDT:** Two automated processes at AWS attempted to update the same DNS record simultaneously - a race condition. The result: an empty DNS record for dynamodb.us-east-1.amazonaws.com.

**Immediate impact:** Every application trying to connect to DynamoDB received the digital equivalent of a wrong number. Connections failed. Timeouts piled up. Error logs exploded.

**The cascade begins:** EC2's Droplet Workflow Manager (DWFM) requires DynamoDB to maintain server leases. When DynamoDB disappeared, DWFM couldn't complete state checks. Perfectly healthy servers appeared unhealthy. New instances launched without network connectivity. Load balancers failed health checks. CloudWatch couldn't log metrics. Lambda functions hung. Security tokens couldn't be validated.

By 12:38 AM, just 50 minutes later, engineers identified the DNS issue. By 2:25 AM, DynamoDB was recovered. But recovery of all dependent systems took another 11+ hours. Why? Because the outage had corrupted the state across thousands of interconnected systems.

## The US-EAST-1 Problem

If you've followed AWS outages over the past eight years, you've noticed a pattern. The epicenter is almost always the same: US-EAST-1, AWS's Northern Virginia region.

This isn't a coincidence. US-EAST-1 is AWS's oldest and busiest region, handling an estimated 35-40% of AWS's global traffic according to industry analysts. Northern Virginia has become known as "Data Center Alley" - home to the highest concentration of data centers in the world.

The track record of major US-EAST-1 outages is concerning:

February 2017: A human error during S3 debugging caused significant portions of the internet to go down, affecting services such as Netflix, Slack, and Amazon's own retail operations.
November 2020: Kinesis Data Streams errors cascaded to 20+ services, impacting 1Password, Coinbase, Adobe, Roku, and The Washington Post.
December 2021: Network device failures lasting over 8 hours impacted Netflix, Disney+, Slack, Robinhood, and Amazon's delivery operations.
July 2024: A Kinesis architecture flaw caused a 7-hour outage affecting CloudWatch, Lambda, ECS, and dozens of downstream services.
October 2025: The DNS/DynamoDB incident discussed in this article.

Five major outages in eight years, all from the same region. Yet companies continue concentrating workloads there. Why? Legacy decisions, lower latency for East Coast users, feature availability, and the false comfort of "multi-AZ deployments."

Here's the problem: Multi-AZ doesn't protect against regional failures. Availability zones within the same region share foundational infrastructure. When that infrastructure fails - DNS, DynamoDB, Kinesis - your multi-AZ architecture fails together.

The Counterargument: Why Concentration Also Enables Resilience
Before arguing for regulatory intervention, it's worth acknowledging why cloud concentration exists and what benefits it provides.

AWS's scale enables investment in security, redundancy, and expertise that smaller providers cannot match. Amazon spends billions annually on infrastructure, employs thousands of security engineers, and operates at a level of sophistication most enterprises could never afford internally. Despite headline-grabbing outages, AWS maintains a five-year rolling uptime average of 99.95%, exceeding what most organizations achieve with on-premises data centers.

Moreover, fragmentation has costs. Multi-cloud architectures are complex to operate, expensive to maintain, and introduce their own failure modes. Data synchronization across providers creates consistency challenges. Different APIs require different expertise. The operational overhead of managing three cloud providers may exceed the resilience benefits for many organizations.

These are legitimate arguments. The question isn't whether concentration has benefits - it clearly does - but whether the systemic risks now outweigh them, and whether market forces alone can address those risks.

## The Institutional Knowledge Question

One factor that may contribute to increasing outage frequency deserves examination: changes in AWS's engineering workforce.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/64mz7nnrs6q6prgays4e.jpg)

Corey Quinn, a former AWS employee and current industry analyst at The Duckbill Group, has written extensively about this issue in The Register. According to Quinn's analysis, AWS experienced over 27,000 layoffs between 2022 and 2024, with internal documents showing 69-81% "regretted attrition" - employees the company wanted to retain but lost.

I believe this analysis should be considered with the appropriate caveats. Former employees may have incomplete information or personal grievances. AWS doesn't publicly disclose engineering headcount or expertise distribution. Correlation between workforce changes and outage patterns doesn't prove causation.

However, the broader point about institutional knowledge is well-established in reliability engineering literature. As Quinn wrote: "You can hire a bunch of very smart people who will explain how DNS works at a deep technical level, but the one thing you can't hire for is the person who remembers that when DNS starts getting wonky, check that seemingly unrelated system in the corner, because it has historically played a contributing role to some outages of yesteryear."

## Regulators Circle: Is Big Cloud Too Big?

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/mdamdebikz9qnvnjhx5a.png)

The October outage triggered immediate political responses that signal a shifting landscape for cloud providers.

Senator Elizabeth Warren declared on X: "If a company can break the entire internet, they are too big. Period. It's time to break up Big Tech." While politically charged, her statement reflects growing bipartisan recognition that concentration risk in digital infrastructure has national security implications.

In the UK, the response was more concrete. The Competition and Markets Authority (CMA) concluded a multi-year investigation, finding that AWS and Microsoft hold "significant unilateral market power" in the UK cloud market, with each controlling 30-40% of customer spending. The CMA recommended that both companies be designated with "strategic market status" under the Digital Markets, Competition and Consumers Act 2024 - a designation that would allow regulators to impose legally binding conduct requirements.

The CMA's findings were prescient: less than 1% of customers switch cloud providers annually. Technical barriers and egress fees create what regulators called a "lock-in" effect that the October outage made viscerally real.

## The Path Forward: Practical Resilience

Resilience doesn't require an unlimited budget. It requires strategic thinking.

**Start with a tiered approach.** Not every system needs a multi-region active-active architecture. Categorize workloads by criticality. Revenue-generating transaction systems? Absolutely multi-region. Internal dashboards? Probably not.

**Design for observability.** You can't fix what you can't see. Cross-region monitoring, replication lag tracking, and synthetic transactions help detect problems before customers do.

**Test relentlessly. Monthly game days.** Chaos engineering experiments. Unannounced failover tests. Document every discovered issue. Fix them. Test again.

**Build multi-region capabilities incrementally.** Start with active-passive failover for critical systems. Establish clear Recovery Point Objectives (RPO) and Recovery Time Objectives (RTO). Graduate to active-active only when justified by business impact.

## The Bottom Line

The cloud isn't a metaphor. It's fiber optic cables under the Atlantic. It's cooling systems in Northern Virginia. It's two automated processes racing to update the same DNS record at 11:48 PM on a Saturday night.

AWS's 99.95% five-year uptime average sounds impressive - until you realize the October 2025 outage alone consumed years of that SLA budget in fifteen hours. Until you calculate what those fifteen hours cost your business. Until you measure the customer trust you can't invoice your way back to.

Buildings fail. So do the systems we've built inside them. The question isn't whether the next outage will happen - it's whether you'll be ready when it does.

![Image description](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/d88hpsprsp54gk1ha7f5.png)

In October 2025, one empty DNS record reminded us: the cloud isn't a metaphor - it's a building in Virginia, and buildings can fail.

## Key Sources

- **AWS Official Post-Event Summary (October 2025):** aws.amazon.com/message/101925/
- **Parametrix Economic Estimate:** parametrixinsurance.com
- **UK CMA Cloud Investigation Final Decision (July 2025):** gov.uk/cma-cases/cloud-services-market-investigation
- **UK Government AWS Contracts (Tussell data):** Referenced in The Register, October 29, 2025
- **Gartner Downtime Cost Study (2014):** blogs.gartner.com
- **PwC Customer Experience Report:** pwc.com
TeleGeography Analysis (70% claim disputed): cardinalnews.org

_**Disclaimer:** The views expressed in this article are my own and do not represent those of my employer. All AWS outage data is sourced from official AWS post-event summaries, industry reports from Parametrix and CyberCube, CMA investigation findings, and verified news coverage. Economic impact estimates are based on published industry methodologies and should be understood as approximations given the complexity of measuring distributed economic effects._`
},
{
  id: "thoughtworks-tech-radar-vol-33-top-10",
  title: "Top 10 Technologies from Thoughtworks Tech Radar Vol. 33",
  seoTitle: "10 Must-Know Technologies from Thoughtworks Tech Radar 2025 You Should Adopt Now",
  excerpt: "The latest Thoughtworks Technology Radar is here. Discover the 10 technologies that matter most—from Pydantic for AI apps to why you should avoid Text-to-SQL. AI infrastructure is maturing fast, but engineering principles haven't changed.",
  content: `# Top 10 Technologies from Thoughtworks Tech Radar Vol. 33

The latest [Technology Radar](https://www.thoughtworks.com/en-us/radar) is here, and here are the 10 technologies you should actually care about.

## 🟢 Adopt Now

### 1. Pydantic for Python AI Apps

Stop playing roulette with LLM outputs. Pydantic transforms unpredictable text into type-safe Python objects. If you're building production GenAI and not using this, you're doing it wrong.

**Why it matters:** LLMs are probabilistic by nature, but production systems need guarantees. Pydantic provides schema validation, type checking, and automatic parsing of LLM outputs into structured Python objects. This means fewer runtime errors, better testability, and more reliable AI applications.

**Use cases:**
- Validating structured outputs from GPT-4, Claude, or Gemini
- Building robust tool-calling systems for AI agents
- Creating type-safe data pipelines for RAG applications
- Ensuring API consistency in LangChain applications

### 2. Arm in the Cloud

AWS Graviton, Azure Ampere, GCP Tau T2A — the cost and energy savings are real (up to 47% cost savings and 62% reduced carbon footprint). Teams are migrating microservices, databases, and even HPC workloads with minimal changes. Multi-arch Docker images make this nearly painless.

**Why it matters:** The economics are undeniable. Arm-based instances deliver better price-performance ratios than traditional x86 instances, especially for workloads like web servers, containerized microservices, and data processing pipelines.

**Migration path:**
1. Build multi-architecture Docker images (linux/amd64, linux/arm64)
2. Test your workload on Arm instances in a staging environment
3. Gradually migrate services that show performance gains
4. Monitor and optimize

**Gotchas:** Some legacy dependencies may not have ARM64 builds. Check your dependency tree before committing.

### 3. Continuous Compliance

With AI generating larger changesets, manual compliance doesn't scale. Automate checks with Open Policy Agent and SLSA-compliant SBOMs in your CI/CD pipeline — meet regulatory and security standards on an ongoing basis through automation. Non-negotiable.

**Why it matters:** Compliance is no longer a quarterly audit exercise. With rapid deployment cycles and AI-assisted development increasing change velocity, you need automated guardrails.

**Implementation:**
- Integrate policy-as-code tools (Open Policy Agent, Kyverno) into CI/CD
- Generate and verify SBOMs (Software Bill of Materials) automatically
- Implement SLSA supply chain security framework
- Automate security scanning and vulnerability management
- Create compliance dashboards with real-time status

**ROI:** Faster audits, reduced risk exposure, and the ability to move fast without breaking compliance requirements.

## 🟡 Trial Now

### 4. LangGraph

Building stateful multi-agent applications? LangGraph gives you low-level control over agent workflows, memory management, and state persistence. The tool enables you to build robust, production-grade agentic applications.

**Why it matters:** LangChain is great for prototypes, but production agentic systems need deterministic state management, error handling, and observability. LangGraph provides a graph-based framework where you define explicit state transitions.

**Use cases:**
- Multi-agent collaboration systems
- Complex RAG pipelines with routing and fallback logic
- Stateful chatbots with memory persistence
- Autonomous agents that need to track progress over long-running tasks

**Key features:**
- Explicit state graphs with conditional edges
- Built-in persistence for conversation history
- Human-in-the-loop approvals
- Streaming support for real-time responses

### 5. Claude Code

Released less than a year ago, Claude Code has already been widely adopted. Works not just for actual coding but for tech specs, config, infrastructure, and docs. Just maintain quality standards — don't get complacent with AI-generated code.

**Why it matters:** Claude Code represents a new paradigm in developer tools. It's not just autocomplete; it's a collaborative coding partner that understands context across your entire codebase.

**Best practices:**
- Always review AI-generated code for security vulnerabilities
- Use it for boilerplate, tests, and documentation
- Maintain test coverage standards (AI code still needs tests)
- Treat it like a junior developer: guide, review, iterate

**What sets it apart:** Superior reasoning capabilities, ability to understand large codebases, and excellent at explaining complex technical concepts.

### 6. vLLM

State-of-the-art serving throughput, memory-efficient inference engine. Azure uses it as the default. If you're running LLMs at scale, this should be on your radar.

**Why it matters:** Running LLMs in production is expensive. vLLM uses advanced techniques like PagedAttention to dramatically improve throughput and reduce memory usage.

**Performance gains:**
- Up to 24x higher throughput compared to HuggingFace Transformers
- Near-optimal memory utilization through paged memory management
- Support for continuous batching and GPU parallelism

**When to use it:** Self-hosting open-source LLMs (Llama, Mistral, CodeLlama) at scale for cost optimization and data privacy.

## ⚪ Assess Carefully

### 7. Model Context Protocol (MCP)

The integration protocol that ate everything. JetBrains supports it. Apple supports it. Your coding assistant has three MCP servers running. But here's the catch: Don't naively expose your APIs. Build dedicated, secure MCP servers for agentic workflows.

**Why it matters:** MCP standardizes how AI applications connect to data sources and tools. But with great power comes great responsibility.

**Security considerations:**
- Don't expose internal APIs directly through MCP
- Implement authentication and authorization at the MCP layer
- Use rate limiting and audit logging
- Build purpose-specific MCP servers with minimal privilege
- Validate and sanitize all inputs from AI agents

**Architecture pattern:** Create an MCP gateway layer that sits between your AI agents and internal systems, with proper security controls and observability.

### 8. Topology-Aware Scheduling

Running multi-GPU training? Random placement is killing your performance. Start treating GPU topology as a first-class scheduling concern. Tools like Kueue can help.

**Why it matters:** GPU-to-GPU communication bandwidth varies dramatically based on physical topology (NVLink, PCIe, network). Naive scheduling can result in 2-3x slower training times.

**Implementation:**
- Map your GPU topology (nvidia-smi topo -m)
- Use Kubernetes with topology-aware scheduling plugins
- Configure gang scheduling for multi-GPU jobs
- Monitor GPU communication patterns

**Impact:** Significantly faster training times and better GPU utilization, especially for large-scale distributed training.

### 9. Small Language Models (SLMs)

Phi-3, SmolLM2, DeepSeek — they're showing that most agentic tasks don't need frontier models. Lower cost, reduced latency, better efficiency. Consider SLMs as your default for agentic workflows.

**Why it matters:** Not every task needs GPT-4. Many use cases (classification, extraction, routing, simple reasoning) can be handled by smaller models at a fraction of the cost and latency.

**Model selection guide:**
- **Frontier models (GPT-4, Claude 3.5):** Complex reasoning, code generation, creative writing
- **SLMs (Phi-3, Gemma 2):** Classification, extraction, routing, simple Q&A
- **Specialized models:** Domain-specific tasks (medical, legal, code-only)

**Economics:** Running a 7B parameter model can be 10-100x cheaper than GPT-4, with sub-100ms latency on modern GPUs.

## 🔴 Hold (Don't Do This)

### 10. Text to SQL

LLMs that translate natural language into SQL hallucinate too often. Non-deterministic outputs make debugging a nightmare. Use a governed semantic layer (Cube, dbt) or GraphQL/MCP instead.

**Why it's problematic:**
- **Hallucinations:** LLMs will confidently generate syntactically correct but semantically wrong SQL
- **Security risks:** SQL injection vulnerabilities if not properly sandboxed
- **Schema drift:** Changes to your database schema break queries unpredictably
- **No governance:** Bypasses data access controls and compliance requirements

**Better alternatives:**
- **Semantic layers:** Tools like Cube.dev or dbt Semantic Layer provide governed metrics definitions
- **GraphQL:** Strongly-typed APIs with built-in query validation
- **MCP servers:** Purpose-built data access APIs for AI agents with security controls
- **Parameterized queries:** Pre-defined query templates with natural language parameter extraction

**When it might work:** Internal tools for technical users who understand the data model and can validate outputs.

## Key Takeaways

AI infrastructure is maturing fast. Agents need guardrails, not just capabilities. And the fundamentals — TDD, code reviews, security — matter more than ever, not less.

**The engineering principles didn't change:**
- Write tests for AI-generated code
- Review everything before production
- Monitor and observe AI systems in production
- Maintain security standards
- Keep humans in the loop for critical decisions

**The tools changed, but the craft remains:** Building reliable, secure, maintainable systems is still the goal. AI is a powerful tool, but it's not a replacement for engineering discipline.

## What's on Your Radar?

The pace of change in AI and infrastructure tooling is unprecedented. What technologies are you betting on for 2025–2026? What patterns are emerging in your production systems?

The next wave of technology is already forming. Stay curious, stay skeptical, and always validate the hype with real-world experimentation.`,
  date: "2025-11-11",
  readTime: "10 min read",
  category: "AI",
  tags: ["AI", "Cloud Computing", "Software Engineering", "Machine Learning", "DevOps", "Tech Radar"],
  mediumUrl: "https://levelup.gitconnected.com/top-10-technologies-from-thoughtworks-tech-radar-vol-33-cb5738e64499",
  publication: "Level Up Coding",
},
{
  id: "aws-disaster-recovery-strategies",
  title: "AWS Disaster Recovery Strategies: What to Do When Your Region Goes Dark",
  seoTitle: "AWS Disaster Recovery Strategies: What to Do When Your Region Goes Dark",
  excerpt: "When AWS fails, will you panic or stay calm? Learn key DR strategies, RTO/RPO basics, and how automation keeps you resilient.",
  content: `# AWS Disaster Recovery Strategies: What to Do When Your Region Goes Dark

I'll bet you remember exactly where you were during the last major global outage—when the alerts began flooding in and everything came to a standstill. Slack channels lit up, dashboards turned red, and for a solid few hours, a significant chunk of the internet felt… broken. The culprit? Another wobble in the Cloud. It seems to be the epicenter for cloud drama, doesn't it?

What really got me thinking, and actually, prompted me to write this, was the news that the UK's tax authority, HM Revenue & Customs, got hit. Multiple services were disrupted, including their online tax filing systems, during a critical period. If an organization that critical can be knocked offline by a regional AWS issue, it's a massive wake-up call for the rest of us. It's a raw, humbling reminder that "the cloud" isn't some magical, infallible entity. It's still just someone else's computers, and they can fail (and someday they will, again…).

When that happens, the AWS Shared Responsibility Model becomes painfully clear. Amazon is responsible for the resilience *of* the cloud, but we are responsible for our resilience *in* the cloud. So, what's your plan when your primary region goes dark?

## It's All About Time and Data (and Money, Obviously)

Before we delve into the nitty-gritty of failover strategies, we have to talk about two acronyms that get thrown around a lot here: **RTO** and **RPO**. Let's be honest, they sound like boring enterprise jargon, but they are the entire foundation of a rational disaster recovery (DR) plan.

**RTO (Recovery Time Objective):** This is your stopwatch. When disaster strikes, how long can your application be down before the business starts losing serious money or credibility? Is it five minutes? Eight hours? Three days?

**RPO (Recovery Point Objective):** This is your 'undo' button. How much data are you willing to lose forever? Can you afford to lose the last 24 hours of transactions? Or does it need to be down to the last second?

Your answers to these two questions will define your entire strategy and, more importantly, your budget. There's a direct, often painful, correlation: the closer you get to zero RTO and RPO, the more zeros you add to your final AWS bill. It's like car insurance—you can get basic liability that just keeps you legal, or you can get the platinum-plated policy that covers driving through a hurricane during hurricane season and alien abductions. The choice depends on the value of what you're protecting.

> **Compliance Note:** Many industries have regulatory requirements for specific RTO/RPO targets. Financial services often need RPO under 1 hour and RTO under 4 hours, while healthcare systems may have even stricter requirements under HIPAA. Check your compliance obligations before choosing a strategy.

## The DR Menu: From "Fingers Crossed" to "Fort Knox"

Let's walk through the common DR strategies on AWS, from the cheapest and, probably, slowest to the most expensive and instantaneous. Think of it as a spectrum of paranoia.

### The 'Pray It Doesn't Happen' Plan: Backup and Restore

This is the most basic form of DR, and honestly, it's what a lot of people have, even if they don't call it a plan. *Because it is the cheapest way.* You are regularly taking snapshots of your databases (RDS) and volumes (EBS) and copying them to another region. Maybe you have S3 Cross-Region Replication turned on for your object storage.

If your primary region goes down, the plan is to manually—or with some automation—spin up a whole new environment from those backups in your secondary region.

**Analogy:** This is the spare tire in your car's trunk. It's a lifesaver when you get a flat, but you have to pull over, get the jack out, do the manual labor, and it's not meant for driving at full speed. It'll get you to the garage, but it's a slow and bumpy ride.

**RTO/RPO:** Your RTO will be in hours, maybe even a day or two, depending on the complexity of your stack. More specifically, your RPO is determined by your backup frequency—if you back up daily, you could lose up to 24 hours of data.

**Cost:** Minimal. You're just paying for S3 storage for the backups and data transfer costs when copying to your DR region (typically it's $0.02 per GB out of the source region). Expect roughly 5–10% of your primary infrastructure costs.

**Best for:** Dev/Test/PoC environments, internal tools, or any application where a day of downtime is annoying but not a company-killer.

### Getting Warmer: The Pilot Light

Okay, so now we're getting a bit more serious. With a pilot light setup, you have a tiny, minimal, as-much-as-possible version of your core infrastructure already running in your disaster recovery region. You're not just storing backups; you have the "flame" on.

This usually means replicating your data in near real-time using asynchronous replication. For instance, you might have a read replica of your RDS database in the DR region with a typical replication lag of seconds to a few minutes. Your application servers aren't running at full scale, but a small instance might be there, ready with the configuration needed to be scaled out quickly.

Tools like AWS Elastic Disaster Recovery (DRS) are fantastic here, as they continuously replicate your block storage to a low-cost staging area, ready to launch recovery instances in minutes. DRS pricing is straightforward: you pay per server being replicated (around $0.028 per hour per server) plus minimal storage costs for the staging area.

**Analogy:** This is your getaway car. It's parked, gassed up, and ready in the garage. The engine isn't running, but the keys are in the ignition. It'll start up way faster than building a new car from a box of parts.

**RTO/RPO:** RTO drops significantly, down to minutes or a couple of hours. Your RPO is also much better, likely in the seconds to low minutes range, depending on the asynchronous replication lag.

**Cost:** Moderate. Expect to pay 15–25% of your primary region costs. You're paying for constant data replication, cross-region data transfer, and some small, always-on compute resources in your DR region.

**Best for:** Important business applications that can't be down for a full day but can tolerate a short service interruption.

### Ready for Action: The Warm Standby

Now we're talking. A warm standby means you have a scaled-down but fully functional version of your application running 24/7 in the DR region. It's not taking any production traffic, but it's on, it's healthy, and it's ready.

When the primary region fails, the failover process is mostly just a DNS change. You flip the switch—maybe using Amazon Route 53's health checks (which evaluate endpoint health every 30 or 60 seconds) and routing policies—and traffic starts flowing to the standby region. The standby environment might then need to auto-scale to handle the full production load. Factor in typical DNS TTL values (60–300 seconds) and scaling time when calculating your actual RTO.

**Analogy:** This is the backup generator for your house. The moment the main power grid goes down, it kicks in automatically. The lights might flicker for a second, but then everything is back to normal. You can keep watching Netflix without interruption.

**RTO/RPO:** Very low. Your RTO is now measured in minutes (typically 2–10 minutes), dictated mainly by DNS propagation, health check intervals, and scaling time. Your RPO is nearly zero, assuming you have solid asynchronous replication with minimal lag.

**Cost:** Significant. Expect to pay 40–60% of your primary region costs. You're running a scaled-down production environment continuously, plus data replication and cross-region transfer fees.

**Best for:** Mission-critical systems where extended downtime directly impacts revenue and customer trust.

### The Gold Standard: Multi-Region Active-Active

This is the pinnacle of resilience. With an active-active setup, you're not just preparing for a disaster; you're operating in a way that makes a regional failure a non-event. Your application is running at full scale in two or even more AWS regions simultaneously.

Traffic is distributed across these regions using sophisticated routing, like latency-based/geolocation routing or AWS Global Accelerator setup. If one region fails, Route 53 or your global load balancer automatically stops sending traffic there. The remaining region(s) simply absorb the load. There's no "failover" in the traditional sense.

**Analogy:** This isn't a backup generator; this is having your house simultaneously connected to two completely separate national power grids. If one entire grid goes down, you literally wouldn't even know.

**RTO/RPO:** Effectively zero. Or close to it.

**Cost:** You guessed it—very high. Expect to pay at least 100%+ in additional infrastructure costs (essentially doubling your bill). Cross-region data transfer costs can add another 5–10% on top. The architectural complexity of managing data consistency and state across regions is a massive engineering challenge. This isn't for the "faint of heart".

**Best for:** Global, top-tier applications that absolutely cannot fail. Think major streaming services, critical financial platforms, and large-scale e-commerce.

## Quick Decision Matrix

| Strategy | RTO | RPO | Cost | Best For |
|----------|-----|-----|------|----------|
| **Backup & Restore** | Hours to days | Hours | 5–10% | Dev/test, internal tools |
| **Pilot Light** | Minutes to hours | Seconds to minutes | 15–25% | Important business apps |
| **Warm Standby** | Minutes (2–10) | Near zero | 40–60% | Mission-critical systems |
| **Active-Active** | Near zero | Near zero | 100%+ | Cannot-fail applications |

## The Real Work Isn't the Failover; It's the Prep

Here's the thing: no matter which strategy you choose, if your recovery plan involves a human frantically clicking around the AWS console at 3 AM on the weekend, you don't have a plan. You have a big wish.

Your entire DR infrastructure and failover process must be automated. This is where Infrastructure as Code (IaC) tools like Terraform or AWS CloudFormation are non-negotiable. Your recovery should be a single command or a button push, or even fully automated. And more importantly, you have to test it! Regularly! A DR plan that has never been tested is just a theory, and a dangerous one at that.

The October 2025 N. Virginia Region outage (the latest at the time of writing this article) was just another fire drill. For some, it was a minor inconvenience. For others, like HMRC, it was a major incident.

So, take a hard look at your critical systems. If your primary region disappeared tomorrow, would you be in a panic room trying to piece together a server from backups, or would you be sipping coffee while your failover script runs? The choice is entirely yours.
`,
  date: "2025-10-28",
  readTime: "8 min read",
  category: "Cloud",
  tags: ["AWS", "Disaster Recovery", "Cloud Computing", "Cloud Engineering", "Cloud Architecture", "DevOps"],
  mediumUrl: "https://zagran.medium.com/aws-disaster-recovery-strategies-what-to-do-when-your-region-goes-dark-55f6e3d112ab",
},
{
  id: "top-ai-coding-tools-transforming-development-2025",
  title: "The AI Coding Revolution: Top Tools Transforming Development in 2025",
  seoTitle: "10 AI Coding Tools That Will 10x Your Development Speed in 2025",
  excerpt: "Explore the cutting-edge AI tools that are redefining software development - from autonomous coding agents to instant full-stack app generators that turn ideas into production-ready applications.",
  content: `# The AI Coding Revolution: Top Tools Transforming Development in 2025

We're witnessing a fundamental shift in how software is created. AI-powered coding tools have evolved from simple autocomplete suggestions to sophisticated agents capable of building entire applications from natural language descriptions. Whether you're a seasoned developer looking to 10x your productivity or a non-technical founder wanting to bring your vision to life, these tools are reshaping what's possible.

The term "AI-assisted development" barely captures the transformation happening right now. We're entering an era where describing what you want to build is often enough to get a working prototype. This isn't about replacing developers - it's about amplifying human creativity and removing the mundane barriers between ideas and implementation.

Let's explore the tools leading this revolution, each solving different challenges in the development lifecycle.

## 1. Cursor (cursor.com)

The IDE that changed everything. Cursor has become the go-to choice for developers who want AI deeply integrated into their workflow.

**What Makes It Special:** Built as a fork of VS Code, Cursor integrates AI directly into the editing experience. Its Composer feature allows you to describe complex changes in natural language and watch as it modifies multiple files simultaneously. It understands your entire codebase context, can refactor across files, write tests, fix bugs, and even implement entire features from prompts. With support for Claude 3.5 Sonnet, GPT-4, and custom models, it adapts to your coding style and project patterns.

**Best For:** Professional developers who want an AI pair programmer that truly understands their entire codebase and can work autonomously on complex tasks.

## 2. v0 by Vercel (v0.dev)

The UI component generator that actually produces production-ready code.

**What Makes It Special:** v0 generates React components with shadcn/ui and Tailwind CSS from natural language or screenshots. Unlike other generators, v0 produces code that developers actually want to use - clean, accessible, and following best practices. It can iterate on designs, understand complex UI patterns, and even generate full landing pages. The latest version can modify existing components and seamlessly integrates with Next.js projects.

**Best For:** Frontend developers and designers who need to quickly transform ideas or mockups into high-quality React components.

## 3. Bolt (bolt.new)

The browser-based development environment that eliminated setup friction entirely.

**What Makes It Special:** Bolt runs a complete Node.js environment in your browser using WebContainers. You can prompt it to build full-stack applications, and it handles everything - installing packages, running servers, managing databases, and deploying to production. It excels at creating Next.js, React, Vue, and Astro projects with real-time preview. The ability to go from idea to deployed app without leaving your browser is revolutionary.

**Best For:** Rapid prototyping and building full-stack applications without any local environment setup.

## 4. GitHub Copilot + Copilot Workspace

Microsoft's AI pair programmer that keeps getting smarter.

**What Makes It Special:** GitHub Copilot has evolved far beyond code completion. Copilot Chat can explain complex codebases, generate tests, fix bugs, and even plan entire features. The new Copilot Workspace takes this further - it can understand GitHub issues and automatically generate complete pull requests with all necessary changes. With its vast training on public repositories, it often knows the exact library or pattern you need before you do.

**Best For:** Teams already using GitHub who want AI assistance integrated into their existing workflow.

## 5. Claude Artifacts (claude.ai)

Anthropic's Claude with the ability to create and run code directly in the chat interface.

**What Makes It Special:** Claude 3.5 Sonnet has become developers' favorite for its superior coding abilities and reasoning. With Artifacts, Claude can create complete applications, visualizations, and tools that run directly in your browser. It excels at explaining complex concepts, debugging tricky issues, and creating educational content. The ability to iterate on code while discussing requirements makes it incredibly powerful for prototyping.

**Best For:** Developers who want to explore ideas, debug complex problems, or create working prototypes through conversation.

## 6. Windsurf (codeium.com/windsurf)

The AI IDE built for enterprise-scale development.

**What Makes It Special:** Windsurf combines Codeium's powerful AI with a VS Code-based IDE. Its Cascade feature provides deep reasoning about large codebases, making it capable of complex architectural decisions and multi-file refactoring. Unlike other tools, it can run terminal commands, manage git operations, and understands build systems. The AI maintains context across your entire repository, making it feel like a senior engineer on your team.

**Best For:** Enterprise teams working on large, complex codebases that need intelligent assistance with architecture and refactoring.

## 7. Replit Agent (replit.com)

The AI that can build and deploy entire applications while teaching you how.

**What Makes It Special:** Replit's AI Agent doesn't just generate code - it builds complete, deployed applications while explaining every step. It supports 50+ languages and frameworks with zero setup required. The platform includes real-time collaboration, integrated databases, authentication, and instant deployment. What sets it apart is its educational approach - it teaches while it builds, making it perfect for learning new technologies.

**Best For:** Beginners learning to code, educators, and teams who want a collaborative, cloud-based development environment.

## 8. Lovable (lovable.dev)

The full-stack app generator that actually delivers production-ready code.

**What Makes It Special:** Lovable turns ideas into deployed web applications in minutes. Describe your app in plain English, and it generates a complete React + Supabase application with authentication, database, real-time features, and hosting configured. Unlike other generators, Lovable produces clean, maintainable code that you can continue developing. Its AI understands complex business requirements and can iterate based on your feedback.

**Best For:** Entrepreneurs and developers who want to go from idea to deployed MVP in record time.

## 9. Devin by Cognition Labs

The first AI software engineer that can work independently.

**What Makes It Special:** Devin represents a new category - an autonomous AI developer. Give it a task, and it will plan the approach, write code, run tests, fix bugs, and even deploy the solution. It has its own development environment, can use the browser to research documentation, and learns from its mistakes. While still in limited beta, Devin has successfully completed real freelance jobs on Upwork and contributed to open-source projects.

**Best For:** Companies looking to augment their development team with an AI that can work independently on well-defined tasks.

## 10. Codeium (codeium.com)

The free AI code completion that rivals paid alternatives.

**What Makes It Special:** Codeium offers lightning-fast code completion, search, and chat across 70+ languages. What's remarkable is that it's free for individual developers while matching or exceeding the quality of paid alternatives. It works in virtually every IDE, understands context across your entire repository, and can generate everything from boilerplate to complex algorithms. The enterprise version adds security features and self-hosting options.

**Best For:** Individual developers and teams looking for powerful AI assistance without the subscription fees.

## The New Development Paradigm

These tools represent different approaches to AI-assisted development:

- **For IDE Integration:** Cursor and Windsurf offer the deepest integration
- **For UI/Frontend:** v0 produces the highest quality components
- **For Quick Prototypes:** Bolt and Lovable get you from zero to deployed fastest
- **For Learning:** Replit Agent teaches while it builds
- **For Enterprise:** GitHub Copilot and Windsurf scale to large teams
- **For Autonomous Work:** Devin can handle tasks independently

## What This Means for Developers

The landscape has shifted dramatically. Junior developers can now produce senior-level code. Senior developers can work at architect pace. And non-developers can build functional applications. 

This isn't about replacement - it's about amplification. The developers who thrive will be those who learn to orchestrate these AI tools, focusing on creativity, problem-solving, and user experience while letting AI handle the implementation details.

## Getting Started

1. **Pick one tool** that matches your immediate needs
2. **Start with small projects** to understand the tool's strengths and limitations
3. **Learn to prompt effectively** - clear, specific instructions yield better results
4. **Iterate and refine** - AI-generated code is a starting point, not always the finish line
5. **Stay curious** - these tools are evolving rapidly, with new capabilities emerging weekly

The future of development is not about writing every line of code yourself - it's about knowing what to build and how to guide AI to help you build it well. Welcome to the age of AI-amplified development.`,
  date: "2025-10-20",
  readTime: "12 min read",
  category: "AI",
  tags: ["AI", "Development Tools", "Productivity", "Coding", "Future of Tech", "Software Engineering"],
  mediumUrl: "https://zagran.medium.com/the-ai-coding-revolution-top-tools-transforming-development-in-2025-20500a08f794",
},
{
  id: "using-image-search-in-your-app",
  title: "Using Image Search in Your App",
  seoTitle: "How to Add Automatic Image Suggestions Using Google Search API",
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
  mediumUrl: "https://medium.com/swlh/using-image-search-in-your-app-7b4f53e02c2",
  publication: "The Startup",
},
{
  id: "monitoring-email-bounces-aws-ses",
  title: "Monitoring Your Email Bounces and Bounce Rate using Amazon SES, Lambda, SNS, and DynamoDB",
  seoTitle: "How to Build an AWS SES Bounce Monitoring System That Prevents Email Shutdowns",
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
  mediumUrl: "https://medium.com/swlh/monitoring-your-email-bounces-and-bounce-rate-using-amazon-ses-lambda-sns-and-dynamodb-ce74859da18f",
  publication: "The Startup",
}
];
