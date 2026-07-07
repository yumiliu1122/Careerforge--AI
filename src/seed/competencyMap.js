export const roleProfiles = {
  backend: {
    label: "Backend Engineer",
    keywords: [
      "api",
      "database",
      "sql",
      "cache",
      "redis",
      "message",
      "queue",
      "microservice",
      "security",
      "observability",
      "docker",
      "kubernetes",
      "java",
      "spring",
      "node"
    ],
    competencies: [
      { key: "api_design", label: "API design", terms: ["api", "rest", "grpc", "contract", "versioning"] },
      { key: "data", label: "Data modeling", terms: ["database", "sql", "index", "transaction", "schema"] },
      { key: "reliability", label: "Reliability", terms: ["cache", "queue", "retry", "timeout", "observability"] },
      { key: "delivery", label: "Delivery", terms: ["test", "ci", "docker", "deploy", "monitor"] }
    ]
  },
  frontend: {
    label: "Frontend Engineer",
    keywords: [
      "react",
      "vue",
      "typescript",
      "javascript",
      "css",
      "accessibility",
      "performance",
      "state",
      "component",
      "testing",
      "vite",
      "webpack"
    ],
    competencies: [
      { key: "ui", label: "UI engineering", terms: ["component", "css", "layout", "responsive", "accessibility"] },
      { key: "state", label: "State and data", terms: ["state", "query", "cache", "form", "routing"] },
      { key: "quality", label: "Quality", terms: ["test", "typescript", "lint", "storybook", "e2e"] },
      { key: "performance", label: "Performance", terms: ["performance", "bundle", "memo", "lazy", "web-vitals"] }
    ]
  },
  fullstack: {
    label: "Full-stack Engineer",
    keywords: [
      "react",
      "node",
      "api",
      "database",
      "typescript",
      "auth",
      "docker",
      "testing",
      "cloud",
      "system",
      "product"
    ],
    competencies: [
      { key: "frontend", label: "Frontend", terms: ["react", "component", "state", "css", "typescript"] },
      { key: "backend", label: "Backend", terms: ["node", "api", "database", "auth", "queue"] },
      { key: "product", label: "Product sense", terms: ["metric", "user", "experiment", "iteration", "roadmap"] },
      { key: "ops", label: "Operations", terms: ["docker", "cloud", "monitor", "ci", "deploy"] }
    ]
  },
  data: {
    label: "Data Analyst",
    keywords: [
      "sql",
      "python",
      "dashboard",
      "metric",
      "experiment",
      "statistics",
      "etl",
      "warehouse",
      "tableau",
      "powerbi",
      "pandas"
    ],
    competencies: [
      { key: "analytics", label: "Analytics", terms: ["metric", "funnel", "cohort", "retention", "dashboard"] },
      { key: "sql", label: "SQL", terms: ["sql", "join", "window", "partition", "warehouse"] },
      { key: "statistics", label: "Statistics", terms: ["experiment", "ab", "statistics", "confidence", "sample"] },
      { key: "story", label: "Business story", terms: ["insight", "recommendation", "stakeholder", "decision", "impact"] }
    ]
  },
  product: {
    label: "Product Manager",
    keywords: [
      "roadmap",
      "user",
      "metric",
      "research",
      "experiment",
      "priority",
      "requirement",
      "strategy",
      "stakeholder",
      "launch",
      "growth"
    ],
    competencies: [
      { key: "discovery", label: "Discovery", terms: ["research", "interview", "persona", "problem", "journey"] },
      { key: "strategy", label: "Strategy", terms: ["roadmap", "priority", "okr", "tradeoff", "strategy"] },
      { key: "execution", label: "Execution", terms: ["requirement", "launch", "stakeholder", "delivery", "risk"] },
      { key: "growth", label: "Growth", terms: ["metric", "experiment", "retention", "conversion", "growth"] }
    ]
  }
};

export const commonSignals = {
  impact: ["improved", "reduced", "increased", "launched", "saved", "grew", "优化", "提升", "降低", "上线"],
  leadership: ["led", "owned", "mentored", "coordinated", "stakeholder", "负责", "主导", "协作"],
  clarity: ["metric", "result", "because", "therefore", "数据", "指标", "结果"],
  risk: ["security", "privacy", "compliance", "fallback", "monitoring", "安全", "隐私", "监控"]
};

export function getRoleProfile(role = "fullstack") {
  const key = String(role || "").toLowerCase().replace(/\s+/g, "");
  if (roleProfiles[key]) {
    return { key, ...roleProfiles[key] };
  }

  if (key.includes("front")) {
    return { key: "frontend", ...roleProfiles.frontend };
  }
  if (key.includes("data") || key.includes("analyst")) {
    return { key: "data", ...roleProfiles.data };
  }
  if (key.includes("product") || key.includes("pm")) {
    return { key: "product", ...roleProfiles.product };
  }
  if (key.includes("back") || key.includes("java") || key.includes("server")) {
    return { key: "backend", ...roleProfiles.backend };
  }
  return { key: "fullstack", ...roleProfiles.fullstack };
}
