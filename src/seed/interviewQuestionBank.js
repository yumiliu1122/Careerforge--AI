export const questionBank = [
  {
    id: "backend_api_1",
    role: "backend",
    competency: "api_design",
    difficulty: "medium",
    prompt: "Design a public API for uploading and analyzing resumes. What contracts, limits, and failure states would you define?",
    expects: ["api", "contract", "validation", "error", "rate", "security"]
  },
  {
    id: "backend_data_1",
    role: "backend",
    competency: "data",
    difficulty: "medium",
    prompt: "A query became slow after the interview history table reached ten million rows. How would you diagnose and fix it?",
    expects: ["index", "explain", "partition", "cache", "schema", "monitor"]
  },
  {
    id: "backend_reliability_1",
    role: "backend",
    competency: "reliability",
    difficulty: "hard",
    prompt: "An AI scoring provider times out during peak traffic. How should the service continue to work?",
    expects: ["timeout", "retry", "fallback", "queue", "circuit", "observability"]
  },
  {
    id: "frontend_ui_1",
    role: "frontend",
    competency: "ui",
    difficulty: "easy",
    prompt: "How would you build a resume analysis page that remains usable on both mobile and desktop?",
    expects: ["responsive", "layout", "component", "accessibility", "state"]
  },
  {
    id: "frontend_state_1",
    role: "frontend",
    competency: "state",
    difficulty: "medium",
    prompt: "A mock interview page streams questions, answers, and feedback. How would you model its client state?",
    expects: ["state", "cache", "loading", "error", "optimistic", "routing"]
  },
  {
    id: "frontend_perf_1",
    role: "frontend",
    competency: "performance",
    difficulty: "hard",
    prompt: "The knowledge-base page freezes when many documents are loaded. What would you measure and change?",
    expects: ["performance", "virtual", "memo", "worker", "bundle", "profiling"]
  },
  {
    id: "fullstack_system_1",
    role: "fullstack",
    competency: "backend",
    difficulty: "medium",
    prompt: "Design a local-first interview preparation app that can later sync to the cloud. What boundaries would you create?",
    expects: ["api", "storage", "sync", "conflict", "auth", "offline"]
  },
  {
    id: "fullstack_product_1",
    role: "fullstack",
    competency: "product",
    difficulty: "medium",
    prompt: "Which metrics would prove that an interview practice product is improving outcomes?",
    expects: ["metric", "activation", "retention", "conversion", "success", "experiment"]
  },
  {
    id: "data_sql_1",
    role: "data",
    competency: "sql",
    difficulty: "medium",
    prompt: "Write the approach for finding weekly interview pass-rate trends by role from event tables.",
    expects: ["sql", "join", "window", "group", "date", "metric"]
  },
  {
    id: "data_story_1",
    role: "data",
    competency: "story",
    difficulty: "medium",
    prompt: "Your analysis shows practice time rose but pass rate fell. How would you explain the result to the team?",
    expects: ["insight", "segment", "cohort", "hypothesis", "recommendation"]
  },
  {
    id: "product_discovery_1",
    role: "product",
    competency: "discovery",
    difficulty: "medium",
    prompt: "How would you discover whether candidates need resume feedback, mock interviews, or knowledge review most urgently?",
    expects: ["research", "persona", "problem", "survey", "interview", "prioritize"]
  },
  {
    id: "product_strategy_1",
    role: "product",
    competency: "strategy",
    difficulty: "hard",
    prompt: "A team can build voice interviews, job matching, or team analytics next. How would you decide?",
    expects: ["roadmap", "impact", "effort", "risk", "metric", "tradeoff"]
  },
  {
    id: "behavioral_1",
    role: "common",
    competency: "communication",
    difficulty: "easy",
    prompt: "Tell me about a project where you changed your plan after receiving feedback.",
    expects: ["context", "action", "feedback", "result", "learning"]
  },
  {
    id: "behavioral_2",
    role: "common",
    competency: "leadership",
    difficulty: "medium",
    prompt: "Describe a time you handled disagreement with another teammate or stakeholder.",
    expects: ["stakeholder", "tradeoff", "communication", "decision", "result"]
  },
  {
    id: "behavioral_3",
    role: "common",
    competency: "impact",
    difficulty: "medium",
    prompt: "Pick one resume project and explain the measurable impact you created.",
    expects: ["metric", "baseline", "action", "impact", "result"]
  }
];
