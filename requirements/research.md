# Basket Ledger 调研记录

调研日期：2026-07-20（Pacific/Auckland）

## 本次复核（2026-07-20）

- Commerce Commission 于 2026-06-02 发布的年度 grocery report 仍说明 major supermarkets 持有全国零售市场 80% 以上份额、零售价格上升；这支撑“家庭想看清购物支出”的问题背景，但**不**证明他们会持续上传小票。
- PAK'nSAVE/Foodstuffs 的线上条款（2026-06-15 生效）仍明确限制复制、镜像、重新发布、展示或分发线上服务内容。因此本项目仍以用户自有小票为唯一 MVP 输入，不以零售商网站抓取补足数据。
- MPI 对 Health Star Rating 的说明仍强调：它用于同类包装食品间比较，不能跨食物类型比较。小票缺少完整 Nutrition Information Panel，故“饮食健康评分”继续排除在 MVP 外。

本次复核未改变推荐、评分或 MVP 范围；具体链接和设计影响保留在下方来源表中。

## 用户原始方向与判断

方向（迭代后）：家庭每次购物后上传小票；AI 读取小票、建议商品/品类，家庭确认后查看商品、类别和年度花费，并希望自动评估饮食健康。

判断：receipt-first 支出账本值得做，且比公开比价更适合作品集。**“抓取 + 公开聚合 + 原价/折扣声明”不应在未确认授权时进入 MVP；“自动饮食健康评估”也不应进入 MVP。** 原因不是技术难，而是来源条款、数据变化、OCR 误识别、营养资料缺失、个人化健康风险和已有竞争者会同时抬高风险。

## 来源

| 来源（访问 / 发布信息） | 事实 | 对设计的影响 |
| --- | --- | --- |
| [Foodstuffs Online Shopping Terms](https://www.paknsave.co.nz/shop/terms-and-conditions), effective 15 June 2026，访问 2026-07-20 | 条款只授予个人、非排他、不可转让、可撤销的访问使用权；禁止复制、修改、衍生、镜像、重新发布、展示、传输或分发其线上服务内容，除非明确许可 | 不能把 Foodstuffs 网店页面/商品/促销资料当作可自由抓取、储存、公开重发的数据源。未核实其他零售商条款不等于它们允许。 |
| [Commerce Commission: Pricing](https://www.comcom.govt.nz/consumers/dealing-with-typical-situations/buying-goods-and-services/pricing/)，访问 2026-07-20 | sale、price comparison、markdown 的声明必须清晰、准确、无歧义；“usual” price 不应只是为比较编造 | App 不可将“上次观测到的价格”写成零售商的“原价”；应展示来源、日期、样本与限制。 |
| [ComCom: Unit pricing](https://www.comcom.govt.nz/regulated-industries/grocery/information-for-retailers-unit-pricing/)，访问 2026-07-20 | 符合条件的线下零售商须在 2024-08-31 前、线上零售商须在 2025-08-31 前满足 unit price 要求 | 单位价格是合法、可解释的消费者比较概念；产品仍不得假设可复制线上数据。 |
| [ComCom: third Annual Grocery Report release](https://www.comcom.govt.nz/news-and-media/news-and-events/2026/comcom-releases-state-of-grocery-competition-report/)，published June 2026 | 2025 财年中 major supermarkets 保有 80% 以上全国零售市场份额，零售价格上升 | 说明家庭关注价格有真实背景；不等于对某 App 有需求或付费意愿。 |
| [Grocer](https://grocer.nz/) / [Grocer Pro](https://grocer.nz/pro)，访问 2026-07-20 | Grocer 自称 Kiwi grocery price comparison App；Pro 提供跨店、购物清单和多年份价格历史（取决于数据可用性） | 直接做跨店历史价格搜索是已有产品赛道；项目须用数据来源/可信度与家庭工作流差异化。 |
| [ComCom: Information for consumers](https://www.comcom.govt.nz/regulated-industries/grocery/information-for-consumers/)，访问 2026-07-20 | Grocery Industry Competition Act 改革旨在提高竞争；unit pricing 帮助消费者比较价格/单位 | 可以作为问题背景，而不能当作使用官方数据或政府背书。 |
| [MPI: How Health Star Ratings work](https://www.mpi.govt.nz/food-business/labelling-composition-food-drinks/health-star-ratings-food-labelling/how-health-star-ratings-work)，last reviewed 11 June 2025，访问 2026-07-20 | HSR 只应用于相似包装食品的比较；为自愿显示，且不应跨食品种类比较 | 不能从小票品名直接推导“健康分数”；如日后显示 HSR，必须取得用户提供的包装资料/可靠数据并保留适用范围。 |
| [MPI: How to read food labels](https://www.mpi.govt.nz/food-safety-home/how-read-food-labels)，访问 2026-07-20 | 营养成分表可显示能量、饱和脂肪、糖、钠等；这些不等同于一般小票内容 | 小票 OCR 只用于购买项目和金额；营养分析需要独立、可验证的营养资料，首版不做。 |
| [Privacy Commissioner: Health Information Privacy Code](https://www.privacy.org.nz/privacy-principles/codes-of-practice/hipc2020/)，in force 1 May 2026，访问 2026-07-20 | HIPC 规管 health agencies 收集、使用、持有和披露可识别个人的 health information | 一般家庭账本不应自称 health service；但一旦保存病史、过敏、孕期或用药资料，风险大幅增加。首版不收集。 |

## 关键不确定性

- 本次只核实 Foodstuffs 线上条款；Woolworths、Costco、The Warehouse、独立店及宣传目录均应逐一查看当前条款与数据许可。不能把“网站可在浏览器看见”理解成“可自动抽取再发布”。
- 同一商品可能随门店、地区、时间、会员资格、multi-buy、优惠券和可选配送模式而异；一个全局“原价”很可能错误。
- 收据 OCR 对品名缩写、包装规格、折扣行与退货会出错。MVP 的结论只能来自用户确认的数据，并需要样本不足/不可比状态。
- 小票不含完整营养面板；“自动评估健康”会错误地把购买记录当成实际食用记录，也可能遗漏外食、学校餐食和其他家庭成员消费。
- 若未来公开展示用户上传的促销海报/截图，还须处理版权、商标、隐私、虚假提交和审核；因此不进入 MVP。

## 评分笔记

评分使用 `nz-personal-project-ideas/references/evaluation-rubric.md`。更新后的 Basket Ledger 得分 91/100，不是市场预测，而是对一个“可安全交付并展示工程判断”的个人作品的评分。其 NZ 证据为 4/5，是因为价格透明度有证据，但 receipt-first 行为尚未证实；可建性为 4/5，是因为手动路径与“AI 候选 + 人工确认”在范围内，完整 OCR、商品匹配和营养分析不在范围内。

## 验证访谈问题

1. 一年后你最想知道的是按商品、按类别、按商店还是按家庭成员的哪种花费？
2. 你是否保留小票？愿意花多久确认 AI 读出的三行项目？
3. AI 把“COKE ZS 1.5L”分为饮料时，你希望如何改正和记住这个规则？
4. 如果页面写“仅根据已确认购买记录，不能代表实际饮食或健康”，你能理解并信任这个边界吗？
5. 哪些收据信息不希望被保存？你愿意上传一张已遮蔽、只用于一周测试的样本吗？
6. 你希望“购买结构提示”显示哪些中性信息，而哪些健康判断会让你反感或担心？

## 最小合规行动清单

1. MVP 不使用 scraper、headless browser、绕过反爬、未公开 API 或零售商网页再发布。
2. 不使用“原价”“虚假折扣”“全网最低”这类无法用一手证据支撑的文案。
3. 所有界面使用合成示例小票；试点小票由用户自愿提供、遮蔽会员/支付识别信息并私有保存。
4. 若寻求官方数据，先写一页数据请求：用途、刷新频率、存储、展示、删除、纠错和商业模式；拿到书面许可后再开发 adapter。
5. AI 输出必须标为候选、可逐行修改；未确认项目不计入金额、类别或任何提示。不得将用户收据或消费资料用作模型训练或广告受众。
6. MVP 不收集过敏、疾病、孕期、药物、体重或目标等信息；健康功能只在拿到专业营养审查、独立营养资料和明确合规范围后再探索。
