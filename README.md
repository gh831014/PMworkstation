# PMworkstation - 产品管理工作站

部署在 pmlaogao.com 的所有项目集合。

## 项目结构

```
PMworkstation/
├── pmai/          # 主站 - AI 产品经理学习站 (https://pmlaogao.com/)
├── katools/       # Knowledge Decomposer 知识拆解工具 (https://pmlaogao.com/katools/)
├── qdoctor/       # Qdoctor 问题拆解专家 (https://pmlaogao.com/qdoctor/)
└── skillstore/    # PM Skills 产品经理技能库 (https://pmlaogao.com/skillstore/)
```

## 访问地址

| 项目 | URL | 说明 |
|------|-----|------|
| **主站 (pmai)** | https://pmlaogao.com/ | AI 产品经理学习站 |
| **katools** | https://pmlaogao.com/katools/ | 知识图谱拆解工具 |
| **qdoctor** | https://pmlaogao.com/qdoctor/ | 问题拆解专家 (通义千问) |
| **skillstore** | https://pmlaogao.com/skillstore/ | PM Skills 技能库 |

## 快速开始

### 主站 (pmai)

```bash
cd pmai
npm install
npm run dev
```

### katools

```bash
cd katools
npm install
npm run build
```

### qdoctor

```bash
cd qdoctor
npm install
npm run build
```

### skillstore

skillstore 是静态 HTML 页面，无需构建，直接部署 `index.html` 即可。

## 部署

所有项目构建后部署到 `/usr/share/nginx/html/` 对应子目录。

```bash
# 主站
cp -r pmai/dist/* /usr/share/nginx/html/

# katools
cp -r katools/dist/* /usr/share/nginx/html/katools/

# qdoctor
cp -r qdoctor/dist/* /usr/share/nginx/html/qdoctor/

# skillstore
cp skillstore/index.html /usr/share/nginx/html/skillstore/
```

## 技术栈

- **前端**: React 19, Vite, TailwindCSS
- **AI**: 通义千问 (qwen3.5-plus)
- **部署**: Nginx, Let's Encrypt SSL
- **CI/CD**: Git + 手动部署

## License

MIT
