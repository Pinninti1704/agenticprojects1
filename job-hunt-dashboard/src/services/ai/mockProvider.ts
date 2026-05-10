import type { InterviewQuestion, AnswerScore, StarStory, StarScore, OutreachParams, OutreachVariant, JobMatchResult } from '@/types/agent'
import type { AiProvider } from './types'

function seededRng(seed: number): () => number {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash | 0
  }
  return Math.abs(hash)
}

const QUESTION_POOL: InterviewQuestion[] = [
  { id: '', question: 'Tell me about a time you led a team through a challenging project.', type: 'behavioral', difficulty: 'medium' },
  { id: '', question: 'Describe a situation where you had to convince stakeholders to adopt your technical approach.', type: 'behavioral', difficulty: 'hard' },
  { id: '', question: 'Walk me through how you would design a URL shortening service like TinyURL.', type: 'technical', difficulty: 'medium' },
  { id: '', question: 'How would you implement a rate limiter for a high-traffic API?', type: 'technical', difficulty: 'hard' },
  { id: '', question: 'Given an array of integers, find the two numbers that sum to a target value.', type: 'coding', difficulty: 'easy' },
  { id: '', question: 'Implement a function to detect if a linked list has a cycle.', type: 'coding', difficulty: 'medium' },
  { id: '', question: 'If you joined a team with significant technical debt, how would you prioritize paying it down?', type: 'situational', difficulty: 'medium' },
  { id: '', question: 'Tell me about a time you failed at work and how you handled it.', type: 'behavioral', difficulty: 'easy' },
  { id: '', question: 'Design a real-time chat system that supports millions of users.', type: 'technical', difficulty: 'hard' },
  { id: '', question: 'Write a function to determine if a string is a valid palindrome considering only alphanumeric characters.', type: 'coding', difficulty: 'easy' },
  { id: '', question: 'Describe your approach to mentoring a junior developer who is struggling.', type: 'behavioral', difficulty: 'medium' },
  { id: '', question: 'How would you design a recommendation system for an e-commerce platform?', type: 'technical', difficulty: 'hard' },
  { id: '', question: 'Given a binary tree, implement level-order traversal.', type: 'coding', difficulty: 'medium' },
  { id: '', question: 'A production outage just occurred during your on-call shift. Walk through your response.', type: 'situational', difficulty: 'hard' },
  { id: '', question: 'Tell me about a time you improved a team process or workflow.', type: 'behavioral', difficulty: 'easy' },
  { id: '', question: 'Design a distributed key-value store with strong consistency guarantees.', type: 'technical', difficulty: 'hard' },
  { id: '', question: 'Find the longest substring without repeating characters in a given string.', type: 'coding', difficulty: 'medium' },
  { id: '', question: 'How would you handle a situation where your manager asks you to cut corners on quality?', type: 'situational', difficulty: 'medium' },
  { id: '', question: 'Describe a project where you had to learn a new technology stack quickly.', type: 'behavioral', difficulty: 'easy' },
  { id: '', question: 'Design a payment processing system that handles millions of transactions per day.', type: 'technical', difficulty: 'hard' },
  { id: '', question: 'Implement a function to merge two sorted arrays.', type: 'coding', difficulty: 'easy' },
  { id: '', question: 'Your team is behind schedule on a critical deliverable. What do you do?', type: 'situational', difficulty: 'medium' },
  { id: '', question: 'Tell me about a time you went above and beyond for a customer or user.', type: 'behavioral', difficulty: 'medium' },
  { id: '', question: 'How would you design a content delivery network (CDN)?', type: 'technical', difficulty: 'medium' },
  { id: '', question: 'Write a function to check if two strings are anagrams of each other.', type: 'coding', difficulty: 'easy' },
  { id: '', question: 'How do you approach giving constructive feedback to a peer?', type: 'behavioral', difficulty: 'medium' },
  { id: '', question: 'Design a system for tracking user activity and generating analytics reports.', type: 'technical', difficulty: 'medium' },
  { id: '', question: 'Given an array of stock prices, find the maximum profit from a single buy and sell.', type: 'coding', difficulty: 'medium' },
  { id: '', question: 'Your team is resistant to adopting a new tool or framework you recommended. How do you proceed?', type: 'situational', difficulty: 'hard' },
  { id: '', question: 'Describe a time you had to make a decision with incomplete information.', type: 'behavioral', difficulty: 'easy' },
  { id: '', question: 'Implement a basic cache with TTL (time-to-live) eviction.', type: 'coding', difficulty: 'hard' },
  { id: '', question: 'How would you design a notification system that supports email, SMS, and push across multiple channels?', type: 'technical', difficulty: 'medium' },
  { id: '', question: 'Walk through how you would debug a memory leak in a production application.', type: 'situational', difficulty: 'hard' },
  { id: '', question: 'Tell me about a project where you collaborated across multiple teams.', type: 'behavioral', difficulty: 'easy' },
  { id: '', question: 'How would you design a system for real-time collaborative document editing?', type: 'technical', difficulty: 'hard' },
]

const SKILL_LEXICON = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Java', 'Go', 'Rust',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'GitHub Actions',
  'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'GraphQL', 'REST API', 'gRPC',
  'Microservices', 'System Design', 'Distributed Systems', 'Event-Driven Architecture',
  'Kafka', 'RabbitMQ', 'NGINX', 'Linux', 'Shell Scripting', 'SQL', 'NoSQL',
  'HTML', 'CSS', 'Tailwind CSS', 'SASS', 'Webpack', 'Vite', 'Jest', 'Cypress',
  'Playwright', 'Testing Library', 'React Native', 'Next.js', 'Vue.js', 'Angular',
  'Django', 'Flask', 'Spring Boot', 'Express.js', 'FastAPI',
  'Machine Learning', 'Deep Learning', 'NLP', 'LLMs', 'TensorFlow', 'PyTorch',
  'Data Engineering', 'Spark', 'Airflow', 'dbt', 'Snowflake', 'BigQuery',
  'Observability', 'Prometheus', 'Grafana', 'Datadog', 'OpenTelemetry',
  'Security', 'OAuth', 'JWT', 'API Gateway', 'Load Balancing', 'CDN',
]

const TECHNICAL_GLOSSARY: Record<string, string[]> = {
  React: ['Built reusable component library reducing UI development time by 40%', 'Migrated legacy class components to functional hooks pattern', 'Implemented custom hooks for shared state logic across 20+ components'],
  TypeScript: ['Introduced strict TypeScript config catching 50+ type bugs pre-commit', 'Migrated 30k+ line JS codebase to TypeScript with zero runtime regressions', 'Designed generic type utilities used across the entire frontend monorepo'],
  AWS: ['Designed multi-region architecture on AWS achieving 99.99% uptime', 'Reduced monthly AWS costs by 35% through reserved instances and right-sizing', 'Automated infrastructure provisioning using CloudFormation and CDK'],
  Docker: ['Containerized 12 microservices reducing deployment time from 30min to 2min', 'Optimized Docker images reducing size by 60% through multi-stage builds', 'Built CI pipeline with Docker layer caching cutting build time by 70%'],
  Kubernetes: ['Managed 50+ pod Kubernetes cluster serving 100k+ requests per minute', 'Implemented horizontal pod autoscaling reducing resource costs by 25%', 'Designed Helm charts for reproducible multi-environment deployments'],
  PostgreSQL: ['Optimized slow queries reducing p99 latency from 2s to 50ms', 'Designed sharding strategy handling 10M+ rows per table', 'Implemented materialized views for 100x faster dashboard queries'],
}

const STAR_ARCHETYPES: Record<string, { situation: string; task: string; action: string; result: string; reflection: string }> = {
  leadership: {
    situation: 'While leading a cross-functional initiative, the team faced unclear requirements and competing priorities from three different stakeholders.',
    task: 'I was responsible for aligning the team around a shared vision and delivering the project on time without burning out team members.',
    action: 'I facilitated a prioritization workshop, established clear ownership for each workstream, and implemented daily 15-minute standups to track progress and surface blockers early.',
    result: 'The project shipped two weeks ahead of schedule with all critical features included. Team satisfaction scores improved by 30% in the following quarter.',
    reflection: 'Clear ownership and frequent alignment beats perfect planning.',
  },
  'conflict-resolution': {
    situation: 'Two senior engineers had a fundamental disagreement about the architecture for a new service, blocking progress for over a week.',
    task: 'I needed to mediate the disagreement and help the team reach a decision without alienating either engineer.',
    action: 'I scheduled a structured discussion where each engineer presented their proposal with written trade-offs. We created an evaluation matrix ranking both approaches against the same criteria.',
    result: 'The team converged on a hybrid approach combining the best elements of both proposals. Both engineers felt heard and committed fully to the chosen direction.',
    reflection: 'Architecture disagreements are rarely about technical merit alone.',
  },
  delivery: {
    situation: 'A critical client deliverable was at risk due to an unexpected dependency failure three weeks before the deadline.',
    task: 'I had to find a path to deliver on time while maintaining quality standards.',
    action: 'I quickly prototyped three alternative approaches, identified the most viable one, and re-scoped the remaining work into must-have vs nice-to-have categories.',
    result: 'The core feature set delivered on the original deadline. The client expanded the contract for phase two.',
    reflection: 'Transparency about risks builds trust with stakeholders.',
  },
  mentorship: {
    situation: 'Three junior developers were struggling to ramp up, with productivity significantly below expectations after two months.',
    task: 'I needed to accelerate their growth without sacrificing team velocity.',
    action: 'I established a structured mentorship program with weekly pair programming sessions and a progressive ownership model.',
    result: 'All three junior developers were independently shipping features within four months. Two were promoted within 18 months.',
    reflection: 'Investing in junior engineers compounds over time.',
  },
  incident: {
    situation: 'A critical production incident caused a complete service outage affecting all customers during peak business hours.',
    task: 'As the on-call engineer, I needed to restore service immediately.',
    action: 'I initiated the incident response protocol, assembled a war room, and identified the root cause as database connection pool exhaustion within 8 minutes.',
    result: 'Service was fully restored in under 30 minutes. We added monitoring alerts to prevent recurrence.',
    reflection: 'The speed of recovery depends more on team coordination than individual heroics.',
  },
  architecture: {
    situation: 'The existing monolithic application was struggling to scale, with deployment times exceeding two hours.',
    task: 'I needed to design the migration strategy from monolith to microservices without disrupting ongoing feature delivery.',
    action: 'I identified bounded contexts using domain-driven design workshops and carved out the first service as a proof of concept.',
    result: 'Within six months, we migrated five core domains to independent services. Deployment time dropped from 2 hours to 15 minutes.',
    reflection: 'Incremental migration beats big-bang rewrites every time.',
  },
  'customer-success': {
    situation: 'An enterprise customer was considering leaving the platform due to performance issues.',
    task: 'I needed to restore the customer\'s confidence and address the technical issues.',
    action: 'I visited the customer to understand their pain points, led a technical deep-dive identifying root causes, and communicated progress weekly with specific metrics.',
    result: 'The customer renewed their contract for two more years. Page load time improved by 60% for all customers.',
    reflection: 'Listening first and acting with transparency turns at-risk accounts into advocates.',
  },
  optimization: {
    situation: 'A core data pipeline was taking over 6 hours to process nightly batches.',
    task: 'I needed to reduce pipeline latency without rewriting the entire system.',
    action: 'I profiled the pipeline, identified three bottlenecks, parallelized the main processing step, and rewrote the slow query using window functions.',
    result: 'Processing time dropped from 6 hours to 22 minutes. The data team reclaimed 15 hours per week.',
    reflection: 'Profile first, then fix the real bottlenecks rather than guessing.',
  },
}

const CORE_REQUIREMENT_SKILLS = new Set([
  'React', 'TypeScript', 'JavaScript', 'Python', 'Java', 'Go',
  'AWS', 'Docker', 'Kubernetes', 'PostgreSQL', 'System Design',
  'Microservices', 'CI/CD', 'REST API', 'Node.js',
])

export class MockAiProvider implements AiProvider {
  private rng: () => number

  constructor(seed?: number) {
    this.rng = seededRng(seed ?? 42)
  }

  private shuffle<T>(arr: T[]): T[] {
    const result = [...arr]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  generateInterviewQuestions(jdTitle: string, count: number): InterviewQuestion[] {
    const seed = hashString(jdTitle)
    const localRng = seededRng(seed)
    const shuffled = [...QUESTION_POOL]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(localRng() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, Math.min(count, shuffled.length)).map((q, i) => ({
      ...q,
      id: `q-${i}`,
      question: q.question.replace(/a project/i, jdTitle || 'a project'),
    }))
  }

  generateFeedback(_question: string, answer: string): AnswerScore {
    const len = answer.length
    const hasStructure = /\b(first|second|then|finally|initially|subsequently)\b/i.test(answer)
    const hasDepth = /\b(because|since|therefore|led to|resulted in|as a result)\b/i.test(answer)
    const hasQuantifiable = /\b(\d+%|\d+x|\d+ percent|\$?\d+|\d+ people|\d+ users)\b/i.test(answer)

    const suggestions: string[] = []

    let structure = 40
    if (hasStructure) { structure = 75; if (len > 200) structure = 90 }
    else suggestions.push('Use signposting words (first, then, finally) to structure your response.')

    let depth = 30
    if (hasDepth && hasQuantifiable) depth = 90
    else if (hasDepth) depth = 70
    else if (len > 150) depth = 50
    else suggestions.push('Explain the reasoning behind your decisions — why you chose a particular approach.')

    let quantifiable = 20
    if (hasQuantifiable) { quantifiable = 80; if (len > 200) quantifiable = 90 }
    else suggestions.push('Include specific metrics or outcomes to strengthen credibility.')

    const overall = Math.round((structure + depth + quantifiable) / 3)

    if (len < 50) suggestions.push('Your answer is quite brief. Try expanding with a specific example.')
    if (suggestions.length === 0) suggestions.push('Strong response across all dimensions. Continue this pattern.')

    return { structure, depth, quantifiable, overall, suggestions }
  }

  generateStarStory(prompt: string): Omit<StarStory, 'id' | 'createdAt'> {
    const keywords = prompt.toLowerCase()
    let archetype = 'leadership'
    if (/conflict|disagree|argument|dispute/.test(keywords)) archetype = 'conflict-resolution'
    else if (/deadline|ship|deliver|time.*crunch|urgent/.test(keywords)) archetype = 'delivery'
    else if (/mentor|teach|train|guide|junior|coach/.test(keywords)) archetype = 'mentorship'
    else if (/bug|error|outage|incident|crash|down|fail/.test(keywords)) archetype = 'incident'
    else if (/design|architect|migrate|refactor|restructure/.test(keywords)) archetype = 'architecture'
    else if (/customer|client|user.*feedback/.test(keywords)) archetype = 'customer-success'
    else if (/optimize|speed|perf|fast|slow|efficient/.test(keywords)) archetype = 'optimization'

    const story = STAR_ARCHETYPES[archetype]

    return {
      situation: story.situation,
      task: story.task,
      action: story.action,
      result: story.result,
      reflection: story.reflection,
      tags: [archetype],
    }
  }

  scoreStarStory(story: Omit<StarStory, 'id' | 'createdAt'>): StarScore {
    const scoreByLength = (text: string) => {
      const len = text.length
      if (len > 200) return 90
      if (len > 100) return 70
      if (len > 50) return 50
      return 30
    }

    const hasNumbers = (text: string) => /\d+/.test(text) ? 20 : 0
    const hasConcrete = (text: string) => /\b(specific|implemented|built|created|designed|delivered|led|reduced|improved)\b/i.test(text) ? 10 : 0

    const situation = Math.min(100, scoreByLength(story.situation) + hasNumbers(story.situation))
    const task = Math.min(100, scoreByLength(story.task) + hasConcrete(story.task))
    const action = Math.min(100, scoreByLength(story.action) + hasNumbers(story.action) + hasConcrete(story.action))
    const result = Math.min(100, scoreByLength(story.result) + hasNumbers(story.result) + 10)
    const overall = Math.round((situation + task + action + result) / 4)

    return { situation, task, action, result, overall }
  }

  generateOutreachMessage(params: OutreachParams): OutreachVariant[] {
    const { type, recipient, company, role, mutualConnection, sharedInterest, tone } = params

    const tonePrefixes: Record<string, string> = {
      professional: 'I hope this message finds you well.',
      warm: 'Hope you\'re having a great week!',
      direct: 'I\'ll get straight to the point.',
    }

    const typeOpeners: Record<string, string[]> = {
      connection: [
        `I came across your profile and was impressed by your work in ${role || 'the industry'}.`,
        `Your experience with ${company || 'your recent projects'} caught my attention.`,
        `I've been following ${company || 'your work'} and would love to connect.`,
      ],
      followup: [
        `I really appreciated our recent conversation about ${role || 'opportunities in the field'}.`,
        `Following up on our chat — I've been thinking about your insights on ${role || 'career growth'}.`,
      ],
      thankyou: [
        `Thank you so much for taking the time to ${mutualConnection ? `connect me with ${mutualConnection}` : 'speak with me'}.`,
      ],
      referral: [
        `I'm reaching out because I'm exploring ${role ? `${role} opportunities` : 'new roles'} and would appreciate your guidance.`,
      ],
    }

    const closings: Record<string, string> = {
      professional: '\n\nBest regards,\n[Your Name]',
      warm: '\n\nCheers,\n[Your Name]',
      direct: '\n\nThanks,\n[Your Name]',
    }

    const variants: OutreachVariant[] = [
      {
        id: `v1-${Date.now()}`,
        hook: 'Direct approach',
        message: `${tonePrefixes[tone || 'professional']}\n\n${typeOpeners[type]?.[0] || ''}${sharedInterest ? ` I noticed we share an interest in ${sharedInterest}.` : ''}${company ? ` I'm particularly interested in ${company} because of their work in this space.` : ''}${closings[tone || 'professional']}`,
      },
      {
        id: `v2-${Date.now()}`,
        hook: 'Common ground',
        message: `${tonePrefixes[tone || 'professional']}\n\n${typeOpeners[type]?.[1] || typeOpeners[type]?.[0] || ''}${sharedInterest ? ` Our shared interest in ${sharedInterest} inspired me to reach out.` : ''}${mutualConnection ? ` ${mutualConnection} suggested I connect with you.` : ''}${closings[tone || 'professional']}`,
      },
      {
        id: `v3-${Date.now()}`,
        hook: `${type === 'referral' ? 'Value proposition' : 'Curiosity driven'}`,
        message: `${tonePrefixes[tone || 'professional']}\n\n${typeOpeners[type]?.[2] || typeOpeners[type]?.[0] || ''} I'd love to learn more about your journey${company ? ` at ${company}` : ''} and hear your perspective on ${role || 'the industry'} trends.${closings[tone || 'professional']}`,
      },
    ]

    return variants
  }

  analyzeJobMatch(jdText: string, skills: string[]): JobMatchResult {
    const jdLower = jdText.toLowerCase()
    const matched: string[] = []
    const missing: string[] = []
    const criticalMissing: string[] = []
    const niceToHaveMissing: string[] = []

    for (const skill of skills) {
      if (jdLower.includes(skill.toLowerCase())) {
        matched.push(skill)
      } else {
        missing.push(skill)
        if (CORE_REQUIREMENT_SKILLS.has(skill)) {
          criticalMissing.push(skill)
        } else {
          niceToHaveMissing.push(skill)
        }
      }
    }

    const matchPercent = skills.length > 0 ? Math.round((matched.length / skills.length) * 100) : 0
    const suggestions: string[] = []

    if (matched.length === 0) {
      suggestions.push('Try adding more specific technical skills to your profile.')
    }
    if (criticalMissing.length > 0) {
      suggestions.push(`Critical gaps: ${criticalMissing.slice(0, 3).join(', ')}. These are core requirements for this role.`)
    }
    if (jdLower.includes('senior') || jdLower.includes('lead')) {
      suggestions.push('This role targets senior-level candidates. Highlight leadership and architectural experience.')
    }
    if (jdLower.includes('aws') || jdLower.includes('cloud') || jdLower.includes('gcp')) {
      suggestions.push('Cloud expertise is valued here. Emphasize your infrastructure experience.')
    }

    return {
      matchPercent,
      matchedSkills: matched,
      missingSkills: missing,
      criticalMissingSkills: criticalMissing,
      niceToHaveMissingSkills: niceToHaveMissing,
      suggestions,
    }
  }

  generateResumeBullets(missingSkill: string): string[] {
    const glossary = TECHNICAL_GLOSSARY[missingSkill]
    if (glossary) return glossary

    const skillLower = missingSkill.toLowerCase()

    if (/leader|manage|lead/.test(skillLower)) {
      return [
        `Led a team of engineers delivering ${skillLower}-related initiatives on schedule`,
        `Mentored 3 junior engineers in ${missingSkill} best practices, improving team velocity by 25%`,
        `Established ${missingSkill} processes that reduced incident response time by 40%`,
      ]
    }

    if (/test|qa|quality/.test(skillLower)) {
      return [
        `Implemented ${missingSkill} framework achieving 90% code coverage`,
        `Reduced production bugs by 60% through comprehensive ${missingSkill} practices`,
        `Designed automated ${missingSkill} pipeline that saved 20 engineer-hours per week`,
      ]
    }

    if (/data|analytics|analytics/.test(skillLower)) {
      return [
        `Built ${missingSkill} pipeline processing 10M+ records daily`,
        `Designed ${missingSkill} dashboards used by 50+ stakeholders for decision-making`,
        `Reduced ${missingSkill} processing latency by 70% through query optimization`,
      ]
    }

    return [
      `Applied ${missingSkill} to solve complex business problems, delivering measurable improvements`,
      `Gained practical experience with ${missingSkill} through hands-on project work`,
      `Quickly ramped up on ${missingSkill} and applied it to production systems within 2 weeks`,
    ]
  }
}