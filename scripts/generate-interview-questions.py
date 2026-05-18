"""
Interview Questions Generator — standalone HTML page.
Generates a curated page of interview questions, YouTube playlists, GitHub repos,
LinkedIn articles, and blog posts for AI Architect / DevOps / Cloud roles.

Usage:
  python scripts/generate-interview-questions.py
  python scripts/generate-interview-questions.py --output docs/ai-architect-interview-prep/interview-questions.html
"""

import argparse
import json
import os
import shutil
import sys
from datetime import datetime, timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_FILE = os.path.join(
    BASE_DIR, "docs", "ai-architect-interview-prep", "interview-questions.html"
)
BACKUP_DIR = os.path.join(BASE_DIR, "docs", "ai-architect-interview-prep", "backups")

CSS = """
:root{--bg:#0b0d14;--bg2:#12141e;--bg3:#1a1d2e;--border:#262a3a;--accent:#6c8cff;--accent2:#e879f9;--text:#e8ecf4;--text2:#9ba1b8;--text3:#6b7280;--cyan:#22d3ee;--green:#22c55e;--red:#ef4444}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,sans-serif;background:var(--bg);color:var(--text);padding:40px 24px;line-height:1.6}
.wrap{max-width:1060px;margin:0 auto}
h1{font-size:28px;margin-bottom:4px}
h2{font-size:20px;margin:28px 0 12px;border-bottom:1px solid var(--border);padding-bottom:6px}
h3{font-size:16px;margin:24px 0 10px;color:var(--text2)}
p{color:var(--text2);font-size:14px;margin-bottom:16px}
hr{border:none;border-top:1px solid var(--border);margin:16px 0}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
.back-link{display:inline-block;margin-bottom:20px;font-size:13px;color:var(--text3)}
.back-link:hover{color:var(--accent)}
table{width:100%;border-collapse:collapse;margin:12px 0 20px;font-size:13px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--border)}
th{color:var(--text3);font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.5px;background:var(--bg2)}
tr:hover{background:var(--bg2)}
.rel-tag{display:inline-block;padding:1px 8px;font-size:10px;border-radius:8px;background:rgba(108,140,255,0.12);color:var(--accent);border:1px solid rgba(108,140,255,0.2);white-space:nowrap}
.collapsible{margin:6px 0;border:1px solid var(--border);border-radius:8px;overflow:hidden}
.coll-header{padding:10px 14px;background:var(--bg2);cursor:pointer;display:flex;align-items:center;gap:8px;user-select:none}
.coll-header:hover{background:var(--bg3)}
.coll-arrow{font-size:10px;color:var(--text3);transition:transform 0.15s}
.coll-header.open .coll-arrow{transform:rotate(90deg)}
.coll-stat{margin-left:auto;font-size:12px;color:var(--text3)}
.coll-body{display:none;padding:4px 14px 14px}
.coll-body.open{display:block}
.q-item{padding:8px 10px;margin:4px 0;background:var(--bg3);border:1px solid var(--border);border-radius:6px;font-size:13px;display:flex;align-items:flex-start;gap:10px}
.q-num{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;background:var(--accent);color:var(--bg);font-size:11px;font-weight:700;border-radius:4px;flex-shrink:0;margin-top:1px}
.info-crd{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0;padding:16px;background:var(--bg2);border:1px solid var(--border);border-radius:12px}
.stat{display:inline-block;margin:8px 12px 8px 0;padding:12px 18px;background:var(--bg3);border:1px solid var(--border);border-radius:10px;min-width:150px}
.stat-val{display:block;font-size:24px;font-weight:700;color:var(--accent)}
.stat-lbl{display:block;font-size:11px;color:var(--text3);margin-top:2px}
"""

DEFAULT_RESOURCES = {
    "youtube_playlists": [
        {"title": "System Design Interview — ByteByteGo", "url": "https://www.youtube.com/playlist?list=PLCRpJF4DOnDl7bMwm2wFJ2lKdRwjVhJ7g", "description": "Deep dives into system design concepts by Alex Xu", "relevance": "System Design"},
        {"title": "AWS Solutions Architect — freeCodeCamp", "url": "https://www.youtube.com/watch?v=Ia-UEYYR44s", "description": "Full AWS Solutions Architect course (10 hours)", "relevance": "Cloud"},
        {"title": "Kubernetes Tutorial — TechWorldWithNana", "url": "https://www.youtube.com/watch?v=X48VuDVv0do", "description": "Complete Kubernetes crash course", "relevance": "Cloud / DevOps"},
        {"title": "Microservices Architecture — Programming with Mosh", "url": "https://www.youtube.com/watch?v=8BPDvOo0Lr4", "description": "Microservices design patterns and architecture", "relevance": "Architecture"},
        {"title": "AI Agents Full Course 2026", "url": "https://www.youtube.com/watch?v=EsTrWCV0Ph4", "description": "Master Agentic AI in 2 hours", "relevance": "AI / ML"},
        {"title": "System Design Concepts — freeCodeCamp", "url": "https://www.youtube.com/watch?v=F2FmTdLtb_4", "description": "System design fundamentals interview prep", "relevance": "System Design"},
    ],
    "github_repos": [
        {"title": "system-design-primer", "url": "https://github.com/donnemartin/system-design-primer", "description": "Learn to design large-scale systems (280k+ stars)", "relevance": "System Design"},
        {"title": "awesome-aws", "url": "https://github.com/donnemartin/awesome-aws", "description": "Curated AWS tools and best practices", "relevance": "Cloud"},
        {"title": "Devinterview-io/api-design-interview-questions", "url": "https://github.com/Devinterview-io/api-design-interview-questions", "description": "API design interview Q&A (245 stars)", "relevance": "Architecture"},
        {"title": "Devinterview-io/kubernetes-interview-questions", "url": "https://github.com/Devinterview-io/kubernetes-interview-questions", "description": "K8s interview questions and answers", "relevance": "DevOps"},
        {"title": "Devinterview-io/agile-and-scrum-interview-questions", "url": "https://github.com/Devinterview-io/agile-and-scrum-interview-questions", "description": "Agile and Scrum interview questions", "relevance": "Leadership"},
        {"title": "girijesh-ai/ai-interview-codex", "url": "https://github.com/girijesh-ai/ai-interview-codex", "description": "Comprehensive ML/AI interview preparation", "relevance": "AI / ML"},
        {"title": "kapilbtech/argocd-in-one-shot", "url": "https://github.com/kapilbtech/argocd-in-one-shot", "description": "ArgoCD with interview questions and use cases", "relevance": "DevOps"},
    ],
    "articles": [
        {"title": "The Complete Agentic AI System Design Interview Guide 2026", "url": "https://atul4u.medium.com/the-complete-agentic-ai-system-design-interview-guide-2026-f95d0cfeb7cf", "source": "Medium", "relevance": "AI / ML"},
        {"title": "System Design: How to Architect an API Gateway", "url": "https://designgurus.substack.com/p/complete-api-gateway-guide-for-system", "source": "Substack (DesignGurus)", "relevance": "Architecture"},
        {"title": "Top 50 Agile Interview Questions 2026", "url": "https://intellipaat.com/blog/interview-question/agile-interview-questions/", "source": "Intellipaat", "relevance": "Leadership"},
        {"title": "Ultimate System Design Interview Guide 2026", "url": "https://medium.com/@fahimulhaq/ultimate-system-design-interview-guide-for-2025-c5dfa0ca6557", "source": "Medium (Educative)", "relevance": "System Design"},
        {"title": "Top 33 Amazon API Gateway Interview Questions 2026", "url": "https://www.projectpractical.com/amazon-api-gateway-interview-questions-and-answers/", "source": "ProjectPractical", "relevance": "Cloud"},
        {"title": "From Prompt Engineer to Agentic Architect (2026)", "url": "https://www.msn.com/en-us/news/other/from-prompt-engineer-to-agentic-architect-how-to-ace-2026s-new-ai-cloud-interviews/gm-GM3A89581D", "source": "MSN", "relevance": "AI / ML"},
        {"title": "ArgoCD Questions You Must Know", "url": "https://stackinsight.substack.com/p/argocd-questions-you-must-know", "source": "Substack", "relevance": "DevOps"},
        {"title": "CI/CD Interview Questions 2026", "url": "https://www.interviewdrill.io/blog/cicd-interview-questions-2026", "source": "InterviewDrill", "relevance": "DevOps"},
    ],
    "linkedin_articles": [
        {"title": "Argo CD DevOps Interview Questions", "url": "https://www.linkedin.com/posts/abhishek-kumar-singh-02208a153_argocd-devops-gitops-activity-7457638620569530368-ZNHP", "description": "GitOps and ArgoCD interview Q&A", "relevance": "DevOps"},
    ],
}

CATEGORY_QUESTIONS = {
    "System Design": [
        "Design a URL shortener (like bit.ly) -- discuss trade-offs between hashing strategies",
        "Design WhatsApp / real-time chat -- WebSockets vs polling, message ordering, persistence",
        "Design Netflix / YouTube -- video transcoding pipeline, CDN strategy, recommendation serving",
        "Design Uber -- geo-spatial indexing, ride matching, real-time tracking",
        "Design a distributed key-value store -- consistent hashing, replication, CAP trade-offs",
        "Design a rate limiter -- token bucket vs sliding window, distributed counters",
        "Design Dropbox / Google Drive -- file sync, conflict resolution, chunking",
        "Design Twitter feed -- push vs pull model, fanout strategy, timeline generation",
        "Design a payment system -- idempotency, dual-write problem, Exactly-Once delivery",
        "Design a notification system -- push/SMS/email, templating, delivery guarantees",
    ],
    "Cloud Architecture": [
        "Design a multi-region active-active architecture on AWS",
        "How would you migrate a monolith to microservices on EKS?",
        "Design a cost-optimized data lake on AWS (S3 + Glue + Athena vs Redshift)",
        "How do you handle secrets management across environments?",
        "Design a serverless event-driven pipeline for real-time analytics",
        "How would you implement disaster recovery with RPO under 1 minute?",
        "Design a VPC architecture with private subnets, NAT gateways, Transit Gateway",
        "How do you handle blue-green and canary deployments on EKS?",
        "Design a CI/CD pipeline with GitHub Actions, ArgoCD, EKS",
        "How would you implement observability across 50+ microservices?",
    ],
    "AI / ML Architecture": [
        "Design a RAG pipeline for enterprise document Q&A",
        "How would you architect a multi-agent system for customer support?",
        "Design a model serving infrastructure with A/B testing capability",
        "How do you handle LLM prompt injection and guardrails in production?",
        "Design a feature store for ML models serving 100k QPS",
        "How would you implement fine-tuning pipeline for domain-specific LLMs?",
        "Design a vector search system for semantic similarity at scale",
        "How do you evaluate and monitor LLM outputs in production?",
        "Design a data pipeline for continuous model retraining",
        "How would you architect MCP (Model Context Protocol) servers for tool use?",
    ],
    "DevOps & SRE": [
        "How do you design a Kubernetes cluster for high availability?",
        "Design a GitOps workflow with ArgoCD across 10+ clusters",
        "How do you handle incident management and on-call rotation at scale?",
        "Design a monitoring and alerting system using Prometheus + Grafana",
        "How do you implement policy-as-a-service with OPA / Kyverno?",
        "Design a secrets rotation strategy without downtime",
        "How do you debug a Pod that is CrashLoopBackOff in production?",
        "Design a multi-tenant Kubernetes cluster with RBAC and network policies",
        "How would you implement canary releases with traffic splitting?",
        "Design a disaster recovery drill process for Kubernetes workloads",
    ],
    "Leadership & Process": [
        "How do you drive technical strategy across multiple teams?",
        "How do you handle a team that consistently misses sprint commitments?",
        "Design a hiring process for senior engineering roles",
        "How do you manage technical debt while delivering features?",
        "How do you foster a culture of incident post-mortems without blame?",
        "How do you prioritize between platform work and product features?",
        "Design an architecture review process for a 50-engineer org",
        "How do you handle disagreements with PMs on technical direction?",
        "How do you mentor senior engineers to become architects?",
        "How do you measure engineering team health and productivity?",
    ],
}


def backup_file(file_path):
    if not os.path.exists(file_path):
        return None
    os.makedirs(BACKUP_DIR, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    fname = os.path.basename(file_path)
    backup_path = os.path.join(BACKUP_DIR, f"{ts}_{fname}")
    shutil.copy2(file_path, backup_path)
    print(f"Backup saved: {backup_path}", file=sys.stderr)
    return backup_path


def build_question_sections():
    sections = ""
    for cat, questions in CATEGORY_QUESTIONS.items():
        q_list = ""
        for i, q in enumerate(questions, 1):
            q_list += f'<div class="q-item"><span class="q-num">{i:02d}</span><span>{q}</span></div>\n'
        sections += f"""
<div class="collapsible">
  <div class="coll-header" onclick="this.nextElementSibling.classList.toggle('open');this.classList.toggle('open')">
    <span class="coll-arrow">&#9654;</span>
    <strong>{cat}</strong>
    <span class="coll-stat">{len(questions)} questions</span>
  </div>
  <div class="coll-body">{q_list}</div>
</div>"""
    return sections


def build_table(items, name_key, desc_key):
    rows = ""
    for item in items:
        title = item.get(name_key, item.get("title", ""))
        url = item.get("url", "")
        desc = item.get(desc_key, item.get("description", ""))
        source = item.get("source", item.get("relevance", ""))
        rows += f"""<tr><td><a href="{url}" target="_blank" rel="noopener" style="color:var(--accent)">{title}</a></td><td><span class="rel-tag">{item.get("relevance", "")}</span></td><td style="color:var(--text2);font-size:12px">{desc or source}</td></tr>\n"""
    return rows


def build_page(resources=None):
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    r = resources or DEFAULT_RESOURCES

    yt_rows = build_table(r.get("youtube_playlists", []), "title", "description")
    gh_rows = build_table(r.get("github_repos", []), "title", "description")
    art_rows = build_table(r.get("articles", []), "title", "source")
    li_rows = build_table(r.get("linkedin_articles", []), "title", "description")

    total_q = sum(len(q) for q in CATEGORY_QUESTIONS.values())
    total_yt = len(r.get("youtube_playlists", []))
    total_gh = len(r.get("github_repos", []))
    total_art = len(r.get("articles", [])) + len(r.get("linkedin_articles", []))

    q_sections = build_question_sections()

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Interview Questions — AI Architect &amp; Cloud Roles</title>
<style>{CSS}</style>
</head>
<body>
<div class="wrap">
<a class="back-link" href="claude-code-website_test1.html">&larr; Back to Interview Prep</a>
<h1>Interview Questions &amp; Resources</h1>
<p><strong>Last updated:</strong> {ts} | Curated interview questions and learning resources for AI Architect, DevOps Architect, Cloud Architect, and Senior Engineering Manager roles.</p>
<hr>

<div class="info-crd">
  <div class="stat"><span class="stat-val">{total_q}</span><span class="stat-lbl">Curated Questions</span></div>
  <div class="stat"><span class="stat-val">{total_yt}</span><span class="stat-lbl">YouTube Playlists</span></div>
  <div class="stat"><span class="stat-val">{total_gh}</span><span class="stat-lbl">GitHub Repos</span></div>
  <div class="stat"><span class="stat-val">{total_art}</span><span class="stat-lbl">Articles &amp; Posts</span></div>
</div>

<h2 id="questions">Interview Questions by Category</h2>
<p>Click each category to expand. These are common architectural interview questions for senior and architect-level roles.</p>
{q_sections}

<h2 id="youtube">YouTube Playlists &amp; Tutorials</h2>
<table>
<tr><th>Title</th><th>Area</th><th>Description</th></tr>
{yt_rows}</table>

<h2 id="github">GitHub Repositories</h2>
<table>
<tr><th>Repository</th><th>Area</th><th>Description</th></tr>
{gh_rows}</table>

<h2 id="articles">Articles &amp; Blog Posts</h2>
<table>
<tr><th>Title</th><th>Area</th><th>Source</th></tr>
{art_rows}</table>

<h2 id="linkedin">LinkedIn Articles</h2>
<table>
<tr><th>Title</th><th>Area</th><th>Description</th></tr>
{li_rows}</table>

</div>
</body>
</html>"""


def main():
    parser = argparse.ArgumentParser(description="Generate Interview Questions page")
    parser.add_argument("--output", type=str, default=OUTPUT_FILE, help="Output HTML file path")
    parser.add_argument("--resources", type=str, default=None, help="JSON file with custom resources")
    args = parser.parse_args()

    resources = None
    if args.resources:
        if not os.path.exists(args.resources):
            print(f"Error: resources file not found: {args.resources}", file=sys.stderr)
            sys.exit(1)
        with open(args.resources, "r", encoding="utf-8") as f:
            resources = json.load(f)

    html = build_page(resources)
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    backup_file(args.output)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Saved to {args.output}", file=sys.stderr)

    yt = len((resources or DEFAULT_RESOURCES).get("youtube_playlists", []))
    gh = len((resources or DEFAULT_RESOURCES).get("github_repos", []))
    art = len((resources or DEFAULT_RESOURCES).get("articles", [])) + len((resources or DEFAULT_RESOURCES).get("linkedin_articles", []))
    total_q = sum(len(q) for q in CATEGORY_QUESTIONS.values())
    print(f"  - Questions: {total_q}, YouTube: {yt}, GitHub: {gh}, Articles: {art}", file=sys.stderr)
    print("Done!", file=sys.stderr)


if __name__ == "__main__":
    main()