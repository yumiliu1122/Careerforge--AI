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
  {
    key: "backend",
    label: "后端工程师",
    skills: ["API 设计", "数据库", "缓存", "消息队列", "并发控制", "可观测性"],
    scenarios: ["高并发下单", "用户登录鉴权", "任务异步处理", "服务降级与限流"]
  },
  {
    key: "frontend",
    label: "前端工程师",
    skills: ["组件化", "状态管理", "性能优化", "可访问性", "工程化", "用户体验"],
    scenarios: ["复杂表单", "首屏性能优化", "权限菜单", "跨端适配"]
  },
  {
    key: "fullstack",
    label: "全栈工程师",
    skills: ["前后端协作", "接口契约", "产品理解", "部署交付", "数据建模", "质量保障"],
    scenarios: ["从 0 到 1 交付功能", "接口联调", "灰度发布", "用户反馈闭环"]
  },
  {
    key: "data",
    label: "数据分析师",
    skills: ["SQL", "指标体系", "实验分析", "看板", "用户分层", "业务洞察"],
    scenarios: ["留存下降分析", "转化漏斗诊断", "A/B 实验复盘", "经营指标看板"]
  },
  {
    key: "product",
    label: "产品经理",
    skills: ["用户研究", "需求拆解", "优先级", "指标增长", "跨团队协作", "上线复盘"],
    scenarios: ["需求评审", "竞品分析", "功能冷启动", "增长策略设计"]
  },
  {
    key: "algorithm",
    label: "算法工程师",
    skills: ["特征工程", "模型评估", "训练数据", "线上监控", "效果归因", "推理性能"],
    scenarios: ["推荐排序", "文本分类", "召回粗排精排", "模型线上漂移"]
  },
  {
    key: "testing",
    label: "测试开发工程师",
    skills: ["自动化测试", "质量体系", "接口测试", "性能测试", "缺陷分析", "持续集成"],
    scenarios: ["接口回归", "压测瓶颈定位", "线上缺陷复盘", "测试平台建设"]
  },
  {
    key: "ops",
    label: "运维开发工程师",
    skills: ["容器化", "监控告警", "容量规划", "故障演练", "发布系统", "成本优化"],
    scenarios: ["服务故障恢复", "Kubernetes 发布", "日志链路追踪", "资源成本治理"]
  }
];

const publicSources = [
  {
    key: "java-guide",
    name: "JavaGuide 开源知识库",
    url: "https://github.com/Snailclimb/JavaGuide",
    licenseNote: "公开开源资料，知识点已重新整理为面试准备卡片。",
    roles: ["backend", "fullstack"],
    categories: ["interview", "jd", "resume"],
    tags: ["Java", "JVM", "并发", "集合", "Spring"],
    focus: "适合准备 Java 基础、JVM、并发、集合、Spring、数据库和分布式相关追问。"
  },
  {
    key: "spring-docs",
    name: "Spring 官方参考文档",
    url: "https://docs.spring.io/spring-framework/reference/",
    licenseNote: "官方公开文档，仅抽象整理概念和面试要点。",
    roles: ["backend", "fullstack"],
    categories: ["interview", "project", "resume"],
    tags: ["Spring", "IoC", "AOP", "事务", "Web"],
    focus: "适合准备 Spring Bean 生命周期、依赖注入、AOP、事务边界和 Web 请求链路。"
  },
  {
    key: "mdn-web",
    name: "MDN Web Docs",
    url: "https://developer.mozilla.org/",
    licenseNote: "公开 Web 文档，内容已改写为前端面试知识卡。",
    roles: ["frontend", "fullstack"],
    categories: ["interview", "project", "resume"],
    tags: ["JavaScript", "HTML", "CSS", "Web API", "浏览器"],
    focus: "适合准备 JavaScript 运行机制、DOM、事件、CSS 布局、浏览器网络和可访问性。"
  },
  {
    key: "react-docs",
    name: "React 官方文档",
    url: "https://react.dev/",
    licenseNote: "官方公开文档，按面试场景重新组织。",
    roles: ["frontend", "fullstack"],
    categories: ["interview", "project", "jd"],
    tags: ["React", "Hooks", "组件", "状态", "渲染性能"],
    focus: "适合准备组件设计、Hooks、状态提升、渲染性能、表单和工程化实践。"
  },
  {
    key: "node-docs",
    name: "Node.js 官方文档",
    url: "https://nodejs.org/docs/latest/api/",
    licenseNote: "官方公开文档，整理为服务端 JavaScript 面试卡。",
    roles: ["backend", "fullstack"],
    categories: ["interview", "project", "jd"],
    tags: ["Node.js", "Event Loop", "Stream", "HTTP", "异步"],
    focus: "适合准备事件循环、异步 I/O、流处理、错误处理和 Node 服务稳定性。"
  },
  {
    key: "postgres-docs",
    name: "PostgreSQL 官方文档",
    url: "https://www.postgresql.org/docs/",
    licenseNote: "官方公开文档，按 SQL 与数据库面试重新整理。",
    roles: ["backend", "fullstack", "data"],
    categories: ["interview", "project", "resume"],
    tags: ["SQL", "索引", "事务", "查询优化", "PostgreSQL"],
    focus: "适合准备事务隔离、索引选择、慢查询定位、Explain 分析和数据建模。"
  },
  {
    key: "redis-docs",
    name: "Redis 官方文档",
    url: "https://redis.io/docs/latest/",
    licenseNote: "官方公开文档，转为缓存与高并发面试要点。",
    roles: ["backend", "fullstack", "ops"],
    categories: ["interview", "project", "resume"],
    tags: ["Redis", "缓存", "分布式锁", "限流", "队列"],
    focus: "适合准备缓存穿透、缓存击穿、缓存雪崩、分布式锁、限流和队列实践。"
  },
  {
    key: "docker-docs",
    name: "Docker 官方文档",
    url: "https://docs.docker.com/",
    licenseNote: "官方公开文档，整理为部署和工程化面试卡。",
    roles: ["backend", "fullstack", "testing", "ops"],
    categories: ["interview", "project", "jd"],
    tags: ["Docker", "镜像", "容器", "部署", "CI/CD"],
    focus: "适合准备镜像构建、容器隔离、环境一致性、日志和发布回滚。"
  },
  {
    key: "k8s-docs",
    name: "Kubernetes 官方文档",
    url: "https://kubernetes.io/docs/concepts/",
    licenseNote: "官方公开文档，按云原生岗位整理要点。",
    roles: ["backend", "fullstack", "ops", "testing"],
    categories: ["interview", "project", "jd"],
    tags: ["Kubernetes", "Pod", "Service", "Deployment", "弹性伸缩"],
    focus: "适合准备 Pod、Service、Deployment、滚动发布、健康检查和容量规划。"
  },
  {
    key: "testing-library",
    name: "Testing Library 文档",
    url: "https://testing-library.com/docs/",
    licenseNote: "公开文档，抽象为前端测试和质量保障面试卡。",
    roles: ["frontend", "fullstack", "testing"],
    categories: ["interview", "project", "resume"],
    tags: ["测试", "自动化", "用户行为", "回归", "质量"],
    focus: "适合准备以用户行为为中心的测试、回归策略、边界用例和质量度量。"
  },
  {
    key: "google-sre",
    name: "Google SRE Book",
    url: "https://sre.google/sre-book/table-of-contents/",
    licenseNote: "公开在线书籍，按可靠性面试重新整理。",
    roles: ["backend", "ops", "testing", "fullstack"],
    categories: ["interview", "company", "project"],
    tags: ["SRE", "可靠性", "监控", "SLO", "故障复盘"],
    focus: "适合准备 SLO、错误预算、告警设计、故障复盘、容量规划和稳定性治理。"
  },
  {
    key: "system-design-primer",
    name: "System Design Primer",
    url: "https://github.com/donnemartin/system-design-primer",
    licenseNote: "开源系统设计资料，按项目和面试答题卡重新组织。",
    roles: ["backend", "fullstack", "ops"],
    categories: ["interview", "project", "jd"],
    tags: ["系统设计", "可扩展性", "缓存", "数据库", "负载均衡"],
    focus: "适合准备系统设计题、容量估算、缓存、分片、限流、异步化和故障隔离。"
  },
  {
    key: "product-growth",
    name: "公开产品增长方法资料",
    url: "https://www.reforge.com/blog",
    licenseNote: "公开产品文章与方法论，仅整理通用框架，不复制原文。",
    roles: ["product", "data"],
    categories: ["company", "interview", "project", "resume"],
    tags: ["增长", "用户研究", "转化", "留存", "实验"],
    focus: "适合准备产品增长、用户分层、实验设计、指标拆解和业务复盘。"
  },
  {
    key: "google-ml-crash-course",
    name: "Google Machine Learning Crash Course",
    url: "https://developers.google.com/machine-learning/crash-course",
    licenseNote: "公开机器学习课程，整理为算法岗位面试知识卡。",
    roles: ["algorithm", "data"],
    categories: ["interview", "project", "resume"],
    tags: ["机器学习", "特征", "评估", "训练", "泛化"],
    focus: "适合准备特征工程、训练验证、过拟合、模型指标、线上效果和错误分析。"
  }
];

const categoryPlans = [
  {
    category: "interview",
    themes: ["自我介绍", "项目深挖", "系统设计", "行为面试", "技术追问", "反问面试官"],
    title: (role, theme, source) => `${role.label}${theme}题库：${source.name}`,
    content: (role, theme, source) => [
      sourceHeader(source),
      `${theme}面试中，${role.label}需要把回答组织成“背景、行动、结果、复盘”四段，避免只背概念。`,
      `建议优先展示 ${role.skills.slice(0, 4).join("、")} 的真实证据，并把证据落到 ${role.scenarios.slice(0, 2).join("、")} 等场景。`,
      `可准备的完整回答结构：先说明业务问题，再说明个人负责边界，接着给出关键动作，最后用数据、稳定性、效率、用户反馈或交付周期证明结果。`,
      `追问准备：如果面试官继续追问，可以补充技术取舍、失败方案、风险控制、协作过程和下一步优化。`,
      `参考来源：${source.url}`
    ].join("\n\n")
  },
  {
    category: "jd",
    themes: ["初级岗位画像", "中高级岗位画像", "核心能力要求", "加分项", "常见淘汰项", "面试评价表"],
    title: (role, theme, source) => `${role.label}${theme}：${source.name}`,
    content: (role, theme, source) => [
      sourceHeader(source),
      `${role.label}${theme}通常关注候选人是否能把能力落到业务结果，而不是只罗列工具名。`,
      `基础要求通常包括 ${role.skills.slice(0, 4).join("、")}；进阶要求通常包括方案设计、风险判断、跨角色协作和复盘能力。`,
      `简历适配建议：把岗位关键词放进项目经历和结果证据里，例如“通过 ${role.skills[0]} 解决了 ${role.scenarios[0]} 中的具体问题”。`,
      `面试准备建议：准备 2 个主项目、1 个失败复盘、1 个协作冲突案例和 1 个量化成果案例。`,
      `参考来源：${source.url}`
    ].join("\n\n")
  },
  {
    category: "company",
    themes: ["业务理解", "增长指标", "商业模式", "团队协作", "用户价值", "技术风险"],
    title: (role, theme, source) => `${role.label}面试中的${theme}资料：${source.name}`,
    content: (role, theme, source) => [
      sourceHeader(source),
      `准备公司资料时，不只是背公司介绍，而是把业务、用户、指标和岗位贡献联系起来。`,
      `${role.label}可以重点思考：目标用户是谁，核心流程是什么，哪些指标最能代表成功，当前系统或产品可能有什么风险。`,
      `回答模板：我理解贵业务的关键指标是 X，因此这个岗位可以通过 ${role.skills.slice(0, 2).join("、")} 影响 Y 结果；如果入职，我会先验证 Z 假设。`,
      `反问问题：这个岗位当前最需要解决的业务瓶颈是什么？团队如何衡量该岗位 3 个月内的成功？`,
      `参考来源：${source.url}`
    ].join("\n\n")
  },
  {
    category: "project",
    themes: ["STAR 复盘", "技术难点", "指标结果", "失败经验", "协作冲突", "架构演进"],
    title: (role, theme, source) => `${role.label}项目${theme}模板：${source.name}`,
    content: (role, theme, source) => [
      sourceHeader(source),
      `项目复盘要避免写成流水账，应突出问题、个人动作和可验证结果。`,
      `${role.label}的项目材料可以围绕 ${role.skills.slice(0, 4).join("、")} 展开，结合 ${role.scenarios.slice(0, 2).join("、")} 说明真实场景。`,
      `推荐结构：背景是什么，难点在哪里，我负责什么，采用了什么方案，效果如何，后来还能怎么优化。`,
      `没有业务数据时，也可以使用效率、质量、稳定性、成本、交付周期、用户反馈等替代指标。`,
      `参考来源：${source.url}`
    ].join("\n\n")
  },
  {
    category: "resume",
    themes: ["个人简介", "经历改写", "技能举证", "亮点提炼", "风险规避", "岗位适配"],
    title: (role, theme, source) => `${role.label}简历${theme}素材：${source.name}`,
    content: (role, theme, source) => [
      sourceHeader(source),
      `简历素材要服务目标岗位，先写最相关的证据，再写辅助经历。`,
      `${role.label}可以在简介中强调 ${role.skills.slice(0, 3).join("、")} 和代表性成果。`,
      `经历 bullet 推荐句式：“使用/主导/优化 + 对象 + 方法 + 结果指标”。例如：主导 ${role.scenarios[0]} 的方案设计，通过 ${role.skills[0]} 将关键流程耗时降低 X%。`,
      `风险项包括时间线断层、技能夸大、项目贡献边界模糊、结果没有数据、描述与目标岗位不匹配。`,
      `参考来源：${source.url}`
    ].join("\n\n")
  },
  {
    category: "note",
    themes: ["复习计划", "面试节奏", "表达结构", "压力面应对", "作品集准备", "Offer 选择"],
    title: (role, theme, source) => `${role.label}${theme}通用笔记：${source.name}`,
    content: (role, theme, source) => [
      sourceHeader(source),
      `${theme}适合做成可复用清单，帮助你把资料转成可直接开口表达的答案。`,
      `${role.label}准备时可以把知识点、项目案例、简历证据和面试题放到同一个知识库里。`,
      `每天复盘一个问题：我说清楚背景了吗？我的动作足够具体吗？结果有证据吗？能否回答追问？`,
      `最终目标不是背答案，而是让资料库帮助你快速找到证据、组织表达、发现短板。`,
      `参考来源：${source.url}`
    ].join("\n\n")
  }
];

const curatedCards = [
  {
    title: "Java 后端高频面试地图",
    category: "interview",
    roleKey: "backend",
    tags: ["Java", "JVM", "并发", "Spring", "MySQL", "Redis"],
    source: "java-guide",
    content: [
      "【公开资料】该卡片基于 JavaGuide 等公开资料重新整理，不复制原文。",
      "准备顺序建议：Java 基础语法与集合、JVM 内存与 GC、并发与线程池、Spring 生命周期与事务、MySQL 索引与事务、Redis 缓存与分布式锁。",
      "回答时不要只说概念。每个知识点至少准备一个项目落点，例如“线程池参数如何根据任务类型设置”“缓存穿透如何用布隆过滤器或空值缓存解决”。",
      "高价值追问：为什么这样设计？如果流量扩大 10 倍怎么改？如何监控和回滚？你在项目里实际踩过什么坑？"
    ]
  },
  {
    title: "前端工程师面试准备地图",
    category: "interview",
    roleKey: "frontend",
    tags: ["JavaScript", "React", "浏览器", "性能优化", "工程化"],
    source: "mdn-web",
    content: [
      "【公开资料】该卡片基于 MDN、React 官方文档等公开资料重新整理。",
      "核心准备模块：JavaScript 作用域与异步、浏览器渲染与网络、React 组件和 Hooks、状态管理、性能优化、前端工程化、可访问性。",
      "项目表达建议：把“我会 React”改成“我把复杂页面拆成可复用组件，并通过懒加载、缓存和渲染优化降低首屏耗时”。",
      "代码题准备：数组、字符串、树、Promise、事件委托、防抖节流、虚拟列表、表单校验。"
    ]
  },
  {
    title: "数据分析岗位 SQL 与业务分析地图",
    category: "interview",
    roleKey: "data",
    tags: ["SQL", "指标体系", "A/B 实验", "漏斗", "留存"],
    source: "postgres-docs",
    content: [
      "【公开资料】该卡片基于 PostgreSQL 官方文档和公开业务分析方法重新整理。",
      "SQL 高频能力：分组聚合、窗口函数、多表关联、去重、留存计算、漏斗转化、异常值处理和查询性能优化。",
      "业务题回答结构：先定义指标口径，再拆维度，接着定位异常环节，最后给出可验证的行动建议。",
      "案例准备：至少准备一个增长分析、一个留存分析、一个 A/B 实验复盘和一个看板建设案例。"
    ]
  },
  {
    title: "产品经理面试项目复盘框架",
    category: "project",
    roleKey: "product",
    tags: ["需求拆解", "用户研究", "优先级", "增长", "复盘"],
    source: "product-growth",
    content: [
      "【公开资料】该卡片基于公开产品增长和用户研究资料重新整理。",
      "产品项目复盘建议按“用户问题、目标指标、方案选择、上线结果、复盘迭代”展开。",
      "不要只说“负责需求”。要说明你如何确定用户痛点、如何排优先级、如何推动设计研发测试上线、如何用数据判断结果。",
      "可准备参考表达：通过用户访谈和行为数据发现新手路径断点，将任务拆成三步引导，上线后首周激活率提升 X%。"
    ]
  },
  {
    title: "系统设计题通用答题骨架",
    category: "interview",
    roleKey: "backend",
    tags: ["系统设计", "容量估算", "缓存", "分库分表", "限流"],
    source: "system-design-primer",
    content: [
      "【公开资料】该卡片基于 System Design Primer 等开源资料重新整理。",
      "答题顺序：澄清需求、估算规模、定义核心接口、画数据模型、说明核心链路、讨论扩展性、讨论故障和监控。",
      "高频组件：负载均衡、缓存、消息队列、数据库索引、读写分离、分片、限流、降级、幂等、可观测性。",
      "面试中要主动说明取舍：一致性与可用性、同步与异步、成本与性能、复杂度与交付速度。"
    ]
  },
  {
    title: "SRE 与稳定性面试地图",
    category: "interview",
    roleKey: "ops",
    tags: ["SRE", "SLO", "监控", "告警", "故障复盘"],
    source: "google-sre",
    content: [
      "【公开资料】该卡片基于 Google SRE Book 等公开资料重新整理。",
      "稳定性面试核心：服务等级目标、错误预算、告警有效性、容量规划、故障演练、应急响应、复盘改进。",
      "回答故障题时按时间线讲清楚：发现信号、判断影响面、临时止血、定位根因、长期修复、复盘制度。",
      "不要只说“加监控”。要说明监控哪些指标、阈值怎么定、谁响应、如何避免告警疲劳。"
    ]
  },
  {
    title: "算法工程师模型项目复盘框架",
    category: "project",
    roleKey: "algorithm",
    tags: ["机器学习", "特征工程", "模型评估", "线上效果", "错误分析"],
    source: "google-ml-crash-course",
    content: [
      "【公开资料】该卡片基于 Google Machine Learning Crash Course 等公开资料重新整理。",
      "模型项目复盘建议说明：业务目标、数据来源、特征设计、训练验证、离线指标、线上实验、错误分析和后续迭代。",
      "常见追问包括：样本偏差怎么处理？为什么选这个指标？如何防止过拟合？线上效果和离线效果不一致怎么办？",
      "简历表达要把模型效果和业务价值同时写出来，例如准确率、召回率、点击率、转化率、推理耗时或成本变化。"
    ]
  },
  {
    title: "测试开发质量保障面试地图",
    category: "interview",
    roleKey: "testing",
    tags: ["自动化测试", "接口测试", "性能测试", "CI", "质量体系"],
    source: "testing-library",
    content: [
      "【公开资料】该卡片基于 Testing Library、Docker、Kubernetes 等公开资料重新整理。",
      "测试开发应准备自动化框架、接口测试、性能测试、缺陷定位、持续集成、测试数据管理和质量度量。",
      "回答质量体系题时，建议从需求评审、用例设计、自动化回归、缺陷闭环、上线监控和复盘改进六个阶段说明。",
      "可举例：把核心接口接入 CI 回归，覆盖登录、下单、支付等链路，失败时自动输出日志和请求快照。"
    ]
  }
];

let cachedDocs;

export function getPublicKnowledgeDocs() {
  if (cachedDocs) {
    return cachedDocs;
  }

  const generated = categoryPlans.flatMap((plan) =>
    publicSources.flatMap((source) => {
      const supportedCategories = uniqueTags([...source.categories, "note"]);
      if (!supportedCategories.includes(plan.category)) {
        return [];
      }

      return source.roles.flatMap((roleKey) => {
        const role = roles.find((item) => item.key === roleKey);
        return plan.themes.map((theme, themeIndex) =>
          buildPublicDoc({
            id: `public_${source.key}_${plan.category}_${role.key}_${themeIndex + 1}`,
            title: plan.title(role, theme, source),
            category: plan.category,
            role,
            tags: uniqueTags([role.label, theme, ...source.tags, ...role.skills.slice(0, 3)]),
            content: plan.content(role, theme, source),
            source
          })
        );
      });
    })
  );

  const curated = curatedCards.map((card, index) => {
    const source = publicSources.find((item) => item.key === card.source) || publicSources[0];
    const role = roles.find((item) => item.key === card.roleKey) || roles[0];
    return buildPublicDoc({
      id: `public_curated_${card.roleKey}_${index + 1}`,
      title: card.title,
      category: card.category,
      role,
      tags: uniqueTags([role.label, ...card.tags]),
      content: `${card.content.join("\n\n")}\n\n参考来源：${source.url}`,
      source
    });
  });

  cachedDocs = [...curated, ...generated].sort((a, b) => `${a.roleKey}_${a.category}_${a.title}`.localeCompare(`${b.roleKey}_${b.category}_${b.title}`));
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
    sourceUrl: publicDoc.sourceUrl,
    originalPublicId: publicDoc.id,
    content: publicDoc.content
  };
}

export function getPublicLibraryStats() {
  const docs = getPublicKnowledgeDocs();
  return {
    total: docs.length,
    sources: publicSources.length,
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

function buildPublicDoc({ id, title, category, role, tags, content, source }) {
  return {
    id,
    title,
    category,
    categoryLabel: publicKnowledgeCategories[category],
    roleKey: role.key,
    roleLabel: role.label,
    tags,
    content,
    sourceType: "public",
    sourceName: source.name,
    sourceUrl: source.url,
    sourceLicenseNote: source.licenseNote
  };
}

function sourceHeader(source) {
  return [
    "【公开资料】",
    `来源：${source.name}`,
    `整理说明：${source.licenseNote}`,
    `重点：${source.focus}`
  ].join("\n");
}

function uniqueTags(tags) {
  return [...new Set(tags.filter(Boolean))].slice(0, 10);
}
