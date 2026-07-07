import { createId } from "../platform/util.js";

export const publicKnowledgeCategories = {
  interview: "面试题与答案",
  jd: "岗位 JD",
  company: "公司与业务资料",
  project: "项目复盘",
  resume: "简历素材",
  note: "通用笔记"
};

export const publicKnowledgeRoles = {
  all: "全部岗位",
  backend: "后端工程师",
  frontend: "前端工程师",
  fullstack: "全栈工程师",
  data: "数据分析师",
  product: "产品经理",
  algorithm: "算法工程师",
  testing: "测试开发工程师",
  ops: "运维开发工程师"
};

const roles = [
  { key: "backend", label: "后端工程师", skills: ["API 设计", "数据库", "缓存", "消息队列", "可观测性", "稳定性"] },
  { key: "frontend", label: "前端工程师", skills: ["组件化", "状态管理", "性能优化", "可访问性", "工程化", "用户体验"] },
  { key: "fullstack", label: "全栈工程师", skills: ["前后端协作", "接口契约", "产品理解", "部署交付", "数据建模", "质量保障"] },
  { key: "data", label: "数据分析师", skills: ["SQL", "指标体系", "实验分析", "看板", "用户分层", "业务洞察"] },
  { key: "product", label: "产品经理", skills: ["用户研究", "需求拆解", "优先级", "指标增长", "跨团队协作", "上线复盘"] },
  { key: "algorithm", label: "算法工程师", skills: ["特征工程", "模型评估", "训练数据", "上线监控", "效果归因", "推理性能"] },
  { key: "testing", label: "测试开发工程师", skills: ["自动化测试", "质量体系", "接口测试", "性能测试", "缺陷分析", "持续集成"] },
  { key: "ops", label: "运维开发工程师", skills: ["容器化", "监控告警", "容量规划", "故障演练", "发布系统", "成本优化"] }
];

const categoryPlans = [
  {
    category: "interview",
    themes: ["自我介绍", "项目深挖", "系统设计", "行为面试", "技术追问", "反问面试官"],
    makeTitle: (role, theme) => `${role.label}${theme}题库`,
    makeContent: (role, theme) =>
      [
        `${theme}时，${role.label}需要把回答组织成背景、行动、结果、复盘四段。`,
        `重点展示 ${role.skills.slice(0, 3).join("、")} 的真实证据，不要只罗列概念。`,
        "如果被追问，可以补充技术取舍、失败方案、指标变化、团队协作和后续优化。",
        "回答示例：先说明业务问题，再说明个人负责边界，接着给出具体动作，最后用数据或用户反馈证明结果。"
      ].join("\n")
  },
  {
    category: "jd",
    themes: ["初级岗位画像", "中高级岗位画像", "核心能力要求", "加分项", "常见淘汰项", "面试评价表"],
    makeTitle: (role, theme) => `${role.label}${theme}`,
    makeContent: (role, theme) =>
      [
        `${role.label}${theme}通常关注候选人是否能把能力落到业务结果。`,
        `基础要求包括 ${role.skills.slice(0, 4).join("、")}，高阶要求包括方案设计、风险判断、跨角色协作和复盘能力。`,
        "简历中应把岗位关键词放到项目经历和技能证据里，而不是只放在技能列表。",
        "面试准备时建议准备 2 个主项目、1 个失败复盘、1 个协作冲突案例和 1 个量化成果案例。"
      ].join("\n")
  },
  {
    category: "company",
    themes: ["业务理解", "增长指标", "商业模式", "团队协作", "用户价值", "技术风险"],
    makeTitle: (role, theme) => `${role.label}面试中的${theme}资料`,
    makeContent: (role, theme) =>
      [
        "准备公司资料时，不只是背公司介绍，而是把业务、用户、指标和岗位贡献联系起来。",
        `${role.label}可以重点思考：目标用户是谁，核心流程是什么，哪些指标最能代表成功，当前系统或产品可能有什么风险。`,
        "回答时可以用“我理解贵业务的关键指标是 X，因此这个岗位能通过 Y 能力影响 Z 结果”的结构。",
        "如果信息不足，可以提出合理假设，并说明入职后会如何验证。"
      ].join("\n")
  },
  {
    category: "project",
    themes: ["STAR 复盘", "技术难点", "指标结果", "失败经验", "协作冲突", "架构演进"],
    makeTitle: (role, theme) => `${role.label}项目${theme}模板`,
    makeContent: (role, theme) =>
      [
        "项目复盘要避免写成流水账，应突出问题、个人动作和可验证结果。",
        `${role.label}的项目材料可以围绕 ${role.skills.slice(0, 3).join("、")} 展开。`,
        "推荐结构：背景是什么，难点在哪里，我负责什么，采用了什么方案，效果如何，后来还能怎么优化。",
        "如果没有业务数据，也可以使用效率、质量、稳定性、成本、交付周期、用户反馈等替代指标。"
      ].join("\n")
  },
  {
    category: "resume",
    themes: ["个人简介", "经历改写", "技能举证", "亮点提炼", "风险规避", "岗位适配"],
    makeTitle: (role, theme) => `${role.label}简历${theme}素材`,
    makeContent: (role, theme) =>
      [
        "简历素材要服务目标岗位，先写最相关的证据，再写辅助经历。",
        `${role.label}可以在简介中强调 ${role.skills.slice(0, 3).join("、")} 和代表性成果。`,
        "经历 bullet 建议使用“动作动词 + 对象 + 方法 + 结果指标”的句式。",
        "风险项包括时间线断层、技能夸大、项目贡献边界模糊、结果没有数据、描述与目标岗位不匹配。"
      ].join("\n")
  },
  {
    category: "note",
    themes: ["复习计划", "面试节奏", "表达结构", "压力面应对", "作品集准备", "Offer 选择"],
    makeTitle: (role, theme) => `${role.label}${theme}通用笔记`,
    makeContent: (role, theme) =>
      [
        `${theme}适合做成可复用清单。`,
        `${role.label}准备时可以把知识点、项目案例、简历证据和面试题放到同一个资料库中。`,
        "每天复盘一个问题：我说清楚背景了吗，我的动作够具体吗，结果有证据吗，能否回答追问。",
        "最终目标不是背答案，而是让资料库帮助你快速找到证据、组织表达、发现短板。"
      ].join("\n")
  }
];

let cachedDocs;

export function getPublicKnowledgeDocs() {
  if (cachedDocs) {
    return cachedDocs;
  }

  cachedDocs = categoryPlans.flatMap((plan) =>
    roles.flatMap((role) =>
      plan.themes.map((theme, index) => ({
        id: `public_${plan.category}_${role.key}_${index + 1}`,
        title: plan.makeTitle(role, theme),
        category: plan.category,
        categoryLabel: publicKnowledgeCategories[plan.category],
        roleKey: role.key,
        roleLabel: role.label,
        tags: [role.label, theme, ...role.skills.slice(0, 3)],
        content: plan.makeContent(role, theme),
        sourceType: "public",
        sourceName: "内置公开面试资料库"
      }))
    )
  );

  return cachedDocs;
}

export function getPublicKnowledgeDoc(id) {
  return getPublicKnowledgeDocs().find((doc) => doc.id === id);
}

export function createImportedPublicDoc(publicDoc) {
  return {
    id: createId("doc"),
    title: publicDoc.title,
    category: publicDoc.category,
    categoryLabel: publicDoc.categoryLabel,
    roleKey: publicDoc.roleKey,
    roleLabel: publicDoc.roleLabel,
    tags: publicDoc.tags,
    sourceType: "public-import",
    sourceName: publicDoc.sourceName,
    originalPublicId: publicDoc.id,
    content: publicDoc.content
  };
}

export function getPublicLibraryStats() {
  const docs = getPublicKnowledgeDocs();
  return {
    total: docs.length,
    categories: Object.entries(publicKnowledgeCategories).map(([key, label]) => ({
      key,
      label,
      count: docs.filter((doc) => doc.category === key).length
    })),
    roles: Object.entries(publicKnowledgeRoles).map(([key, label]) => ({
      key,
      label,
      count: key === "all" ? docs.length : docs.filter((doc) => doc.roleKey === key).length
    }))
  };
}
