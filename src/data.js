export const profile = {
  name: 'Aneek Chatterjee',
  first: 'Aneek',
  last: 'Chatterjee',
  role: 'IT Student & Aspiring Software Developer',
  tagline: 'Curious Mind. Creative Code. Real-World Ideas.',
  email: 'aneekchatterjee4@gmail.com',
  github: 'https://github.com/aneekchatterjee-boop',
  school: 'Vellore Institute of Technology',
  degree: 'Undergraduate, Information Technology',
  grad: '2030',
}

export const highlights = [
  { k: 'Primary language', v: 'Python' },
  { k: 'Key interests', v: 'Backend & AI/ML' },
  { k: 'Creative focus', v: 'Unity & 3D' },
]

export const about = {
  lead:
    'I like building software from first principles — understanding how a system works underneath before stacking features on top of it.',
  body:
    'My work centres on backend engineering: REST API design, relational databases, real-time sync and the unglamorous parts that make software reliable — version control, automated testing and careful debugging. Right now I am pushing into AI/ML and 3D simulation with Unity.',
  values: ['Continuous learning', 'Practical problem-solving', 'Building things that matter'],
}

export const skills = [
  { group: 'Languages', items: ['Python', 'JavaScript (ES6+)', 'TypeScript'] },
  { group: 'Backend & APIs', items: ['Flask REST', 'Node.js', 'WebSockets'] },
  { group: 'Databases', items: ['SQLite', 'Relational modeling', 'Query optimization'] },
  { group: 'Frontend', items: ['React', 'Vite', 'HTML5 & CSS3', 'Tailwind CSS'] },
  { group: 'Tooling', items: ['Git & GitHub', 'VS Code', 'Automated testing', 'Debugging'] },
  { group: 'Exploring', items: ['AI / ML', 'Data analysis', 'Unity 3D', 'C#'] },
]

export const projects = [
  {
    id: 'fraudinate',
    index: '01',
    name: 'Fraudinate',
    kicker: 'Fraud detection · Network analysis',
    description:
      'A multi-signal fraud detection platform that scores financial transactions using rule-based checks, entity-graph analysis and risk fusion, then surfaces suspicious activity on a live React dashboard.',
    pipeline: ['Ingest', 'Rule scoring', 'Graph traversal', 'Risk fusion'],
    stack: ['Python', 'Flask', 'SQLite', 'React', 'TypeScript'],
    repo: 'https://github.com/aneekchatterjee-boop/Fraudinate',
    accent: '#f472b6',
  },
  {
    id: 'syncpad',
    index: '02',
    name: 'SyncPad',
    kicker: 'Real-time collaboration',
    description:
      'A real-time collaborative workspace where multiple users edit together over bidirectional WebSockets, with conflict handling, persistent sessions and automatic reconnect via heartbeats.',
    pipeline: ['Local edit', 'WebSocket', 'Merge', 'Broadcast'],
    stack: ['JavaScript', 'Node.js', 'WebSockets', 'SQLite'],
    repo: 'https://github.com/aneekchatterjee-boop/SyncPad',
    accent: '#22d3ee',
  },
  {
    id: 'ephemera',
    index: '03',
    name: 'Ephemera',
    kicker: 'Zero-trust file sharing',
    description:
      'A zero-trust file-sharing app. Files are end-to-end encrypted in the browser with a passkey-derived key, shared through self-destructing links, and never readable by the server.',
    pipeline: ['Encrypt in browser', 'Upload ciphertext', 'One-time link', 'Self-destruct'],
    stack: ['React 19', 'Vite', 'TypeScript', 'Node.js', 'Cloudflare R2', 'Supabase'],
    repo: 'https://github.com/EpsilonAWS/fileshare',
    team: 'Team project — I built the frontend; backend by Aayush Srivastava.',
    accent: '#a78bfa',
  },
]

export const journey = [
  {
    phase: 'Phase 01',
    title: 'Foundations',
    text: 'Python fundamentals, data structures and algorithms — learning to think in code.',
  },
  {
    phase: 'Phase 02',
    title: 'Systems thinking',
    text: 'APIs, databases and server architecture: how real applications are wired together.',
  },
  {
    phase: 'Phase 03',
    title: 'Applied builds',
    text: 'Shipping full systems — Fraudinate, SyncPad and Ephemera — end to end.',
  },
  {
    phase: 'Now',
    title: 'Intelligence & worlds',
    text: 'AI/ML modelling, and 3D simulation in Unity with C#.',
    current: true,
  },
]

export const interests = [
  {
    title: 'Software Engineering',
    text: 'Clean architecture, reliable backends and systems that hold up under real load.',
    glyph: '{ }',
  },
  {
    title: 'AI & Machine Learning',
    text: 'Models that learn from data — and the pipelines that feed them.',
    glyph: '∇',
  },
  {
    title: 'Unity & 3D',
    text: 'Interactive worlds, simulation and the maths that makes them move.',
    glyph: '◇',
  },
]
