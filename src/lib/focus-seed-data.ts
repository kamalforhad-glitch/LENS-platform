import type { FocusAreaDto } from "./focus-types";

// Pure, client-safe fallback content. The homepage and build must keep working
// even before the database/table exists; seeding writes the same values to DB.
export const FOCUS_SEED_AREAS: readonly FocusAreaDto[] = [
  {
    id: 1,
    slug: "research-insights",
    title: "Research & Insights",
    description:
      "Evidence-driven studies that explain how Bangladesh's media and civic ecosystem really works.",
    icon: "BarChart3",
    order: 1,
    imageUrl: null,
    content: `Research is the foundation of every LENS programme. We combine rigorous methodology with the lived realities of journalists, editors, regulators and ordinary citizens—so decisions are guided by evidence, not assumption.

## What we study

Our research agenda follows the questions that matter most to a young democracy:

- Media ownership, independence and editorial autonomy
- Information deserts, local news gaps and access to reliable public-interest journalism
- Disinformation networks and the platforms that amplify them
- The safety, economics and career pathways of journalists
- How young people find, judge and share civic information

## How we work

We use mixed methods: representative surveys, in-depth interviews, content analysis, platform data and participatory workshops. Every study is reviewed for methodological integrity and published with a plain-language summary so findings can travel beyond academia.

> Evidence does not speak for itself. We translate it into tools that newsrooms, educators and policymakers can actually use.

## From evidence to action

Findings feed directly into our training, policy submissions, indexing work and public resources. Where a gap is identified, we design a practical response—then measure whether it works.

Read the latest [research and publications](/research), or [work with our research team](/contact).`,
  },
  {
    id: 2,
    slug: "media-literacy-training",
    title: "Media Literacy & Training",
    description:
      "Practical skills for young people and journalists to navigate, verify and create trustworthy information.",
    icon: "Users",
    order: 2,
    imageUrl: null,
    content: `A resilient information ecosystem depends on people who can ask better questions. Our media literacy and training programmes turn passive audiences into confident, critical participants.

## Learning by doing

We design workshops around real stories, real posts and real dilemmas. Participants practise:

- Verifying claims with open-source tools and source triangulation
- Recognising manipulated images, videos and synthetic audio
- Understanding algorithms, recommendation systems and echo chambers
- Reporting responsibly on conflict, gender and public health
- Producing accurate, engaging and ethical digital content

## For journalists and newsrooms

Our newsroom training strengthens the habits that protect credibility: rigorous sourcing, careful language, correction routines and audience-aware storytelling. Sessions are adapted for local languages and the constraints of small teams.

## For young people

Through school, university and community programmes, we help young citizens recognise manipulation without becoming cynical. The goal is not to tell people what to think—it is to give them the tools to think for themselves.

Browse [resources and courses](/courses) or [invite a training session](/contact).`,
  },
  {
    id: 3,
    slug: "strategic-communication",
    title: "Strategic Communication",
    description:
      "Clear, audience-first communication strategies for organisations working in the public interest.",
    icon: "Megaphone",
    order: 3,
    imageUrl: null,
    content: `Good causes lose momentum when their message never reaches the people who can act on it. We help civic organisations, coalitions and public institutions communicate with clarity and purpose.

## What we build

We work with teams to define the audience, the evidence and the action they want to inspire. From there we shape a message architecture that stays consistent across press, social, community and policy channels.

- Narrative and messaging frameworks
- Media relations and spokesperson coaching
- Campaign planning and rapid-response protocols
- Content systems for small, busy communications teams
- Crisis communication and rumour response

## Why it matters

Strategic communication is not spin. It is the disciplined practice of connecting verified facts to the decisions people make every day. We prioritise accuracy, transparency and respect for the audience.

## Our approach

We start by listening—to communities, reporters and stakeholders. Then we test messages, measure response and refine. Every engagement ends with a practical playbook the team can own and reuse.

See our [programmes](/programs) or [start a conversation](/contact).`,
  },
  {
    id: 4,
    slug: "policy-advocacy",
    title: "Policy Advocacy",
    description:
      "Research-backed recommendations for a freer, safer and more accountable media environment.",
    icon: "FileText",
    order: 4,
    imageUrl: null,
    content: `LENS works at the point where evidence meets public policy. We bring research, field experience and stakeholder dialogue into recommendations that protect civic space and strengthen public-interest media.

## Our priorities

- Press freedom and the legal protection of journalists
- Transparent, fair and plural media regulation
- Data protection, privacy and online safety
- Public access to information and open government data
- Platform accountability and transparency in content moderation

## How we advocate

We prepare policy briefs, convene multi-stakeholder roundtables, submit formal consultations and support coalitions led by affected communities. Our positions are grounded in documented evidence and international standards.

> A recommendation is only useful if the people it affects helped shape it.

## Accountability

We publish our submissions and track how issues move. When a policy changes, we explain what changed, what did not, and where the remaining gaps are.

Read our [policy work](/about/partnerships) or [engage with our team](/contact).`,
  },
  {
    id: 5,
    slug: "media-indexing",
    title: "Media Indexing",
    description:
      "Independent indices and transparent methodologies that map the health of Bangladesh's media landscape.",
    icon: "Database",
    order: 5,
    imageUrl: null,
    content: `What gets measured can be improved. Our indexing work turns complex media conditions into transparent, comparable evidence—without flattening the context behind the numbers.

## Current work

Our press-freedom and media-development indices examine legal frameworks, safety conditions, editorial independence, economic viability and public trust. Each indicator is defined openly and scored against documented sources.

## A transparent method

We publish methodology notes, scoring rubrics and source lists alongside every index. Readers can see how a score was produced, where uncertainty remains, and how results changed over time.

- No opaque scoring or undisclosed weights
- Clear separation between evidence and interpretation
- Regular review with journalists, academics and civil society
- Corrections handled openly with a visible changelog

## Using the data

Researchers, journalists, educators and advocates use our indices to identify trends, compare regions and track progress. We also offer walkthroughs so the data is not limited to specialists.

Explore the [media indexes](/indexing) or [request a briefing](/contact).`,
  },
  {
    id: 6,
    slug: "freedom-press",
    title: "Freedom of Press",
    description:
      "Monitoring and defending the conditions journalists need to report without fear or favour.",
    icon: "Shield",
    order: 6,
    imageUrl: null,
    content: `A free press is not a privilege for journalists—it is a public good. LENS monitors the legal, political and physical conditions that determine whether reporting can serve the public.

## What we monitor

We track legal changes, harassment, detention, censorship, ownership pressure and impunity. We record patterns as well as individual cases, because trends reveal where protections are failing.

## Support that follows the evidence

When journalists face threats, we work with partners to document incidents, connect them with legal and safety support, and keep the public record accurate. We avoid sensationalism and centre the safety and consent of those affected.

> Protecting a source, a reporter or a newsroom protects every citizen who depends on their work.

## Building long-term resilience

Beyond immediate response, we advocate for legal reform, safety protocols, independent institutions and a culture that values public-interest journalism. Our [press freedom index](/indexing/press-freedom-index) makes these conditions visible over time.

Read our updates or [contact the team](/contact) for confidential support.`,
  },
  {
    id: 7,
    slug: "journalists-protection-shield",
    title: "Journalists Protection Shield",
    description:
      "Practical safety, legal and digital-security support for journalists facing risk.",
    icon: "Newspaper",
    order: 7,
    imageUrl: null,
    content: `Journalists working on public-interest stories often face legal pressure, online harassment and physical danger. The Journalists Protection Shield brings practical support to the people and stories that need it most.

## What the shield provides

- Rapid risk assessment and safety planning
- Legal referral and documentation support
- Digital security audits for devices and accounts
- Secure communication and source-protection guidance
- Psychosocial referral pathways and trusted peer support

## Principles

Support begins with consent. We never publish personal information, we do not pressure anyone to take risks, and we tailor every recommendation to the journalist's actual context. Sensitive cases are handled through restricted channels.

## Why a shield is needed

Legal threats and online abuse can silence a story long before a court decides anything. Protection means helping journalists keep working safely—and ensuring that attacks on them are recorded, understood and challenged.

Request confidential assistance through our [contact page](/contact).`,
  },
  {
    id: 8,
    slug: "cybersecurity-virtual-safety",
    title: "Cybersecurity and Virtual Safety",
    description:
      "Digital security habits, tools and training for newsrooms and civic organisations.",
    icon: "Lock",
    order: 8,
    imageUrl: null,
    content: `Digital safety is a daily practice, not a one-time setup. We help newsrooms, activists and civic teams protect their work, their sources and the people who trust them.

## Core areas

- Account hardening and phishing resistance
- Password managers, multi-factor authentication and access control
- Device hygiene, encrypted backups and secure file sharing
- Safe research, source protection and metadata awareness
- Incident response when an account or device is compromised

## Training that fits real teams

Our sessions avoid jargon and fear-based messaging. We work with the tools participants already use, identify the highest-risk workflows first, and build simple checklists that survive busy news cycles.

## Incident support

When something goes wrong, we help teams assess the scope, preserve evidence, contain the incident and communicate responsibly. We coordinate with specialist partners for cases that need deeper forensic support.

Explore [resources](/resources) or [request a security assessment](/contact).`,
  },
];

export const FOCUS_SEED_BY_SLUG: Readonly<Record<string, FocusAreaDto>> =
  Object.fromEntries(FOCUS_SEED_AREAS.map((area) => [area.slug, area]));
