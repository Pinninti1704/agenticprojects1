"""
LinkedIn Skill Demand Analyzer.
Fetches LinkedIn search pages, extracts jobs, analyzes skill demand
across companies, and injects a "Skill Demand Heatmap" section into
job-intelligence.html without impacting existing content.

Usage: python scripts/fetch-linkedin-skills.py
Requires: pip install requests beautifulsoup4
"""

import argparse, json, os, re, shutil, sys, time
from collections import Counter
from datetime import datetime, timezone
try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("pip install requests beautifulsoup4", file=sys.stderr)
    sys.exit(1)

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(BASE, "docs", "ai-architect-interview-prep", "job-intelligence.html")
BACKUP_DIR = os.path.join(BASE, "docs", "ai-architect-interview-prep", "backups")

SEARCH_URLS = [
    "https://in.linkedin.com/jobs/cloud-architect-jobs",
    "https://in.linkedin.com/jobs/devops-architect-jobs",
    "https://in.linkedin.com/jobs/architect-%E2%80%93-ai-jobs-pune-division",
]

SKILLS = [
    "AWS","Azure","GCP","Google Cloud","kubernetes","docker","terraform",
    "ansible","CI/CD","jenkins","github actions","gitlab ci","argocd",
    "prometheus","grafana","datadog","serverless","lambda","EC2","S3","RDS",
    "VPC","IAM","CloudFormation","CDK","EKS","AKS","GKE","service mesh",
    "helm","gitops","CloudWatch","Direct Connect","PrivateLink",
    "Transit Gateway","Control Tower",
    "microservices","event-driven","distributed systems","system design",
    "CQRS","event sourcing","REST","gRPC","kafka","message queue",
    "caching","API gateway","circuit breaker","FinOps","multi-cloud",
    "machine learning","deep learning","NLP","LLM","large language model",
    "AI agents","MCP","langchain","langgraph","RAG","fine-tuning",
    "prompt engineering","vector database","embedding","transformer",
    "GenAI","generative AI","MLOps","TensorFlow","PyTorch",
    "python","golang","go","java","typescript","rust","react","node.js",
    "fastapi","spring boot","postgresql","redis","snowflake","SQL","NoSQL",
    "bigquery","databricks","mongodb","cassandra",
    "SRE","observability","SLI","SLO","chaos engineering",
    "incident management","on-call","DevSecOps","policy as code","OPA",
    "secret management","zero trust","compliance",
    "agile","scrum","stakeholder management","mentoring",
    "architecture review","cross-functional","pre-sales","solution design",
]

def backup(fp):
    if not os.path.exists(fp): return None
    os.makedirs(BACKUP_DIR, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    b = os.path.join(BACKUP_DIR, f"{ts}_{os.path.basename(fp)}")
    shutil.copy2(fp, b)
    print(f"Backup: {b}", file=sys.stderr)
    return b

def fetch(url):
    h = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    for i in range(2):
        try:
            r = requests.get(url, headers=h, timeout=15)
            if r.status_code == 200: return r.text
        except: pass
        time.sleep(2)
    return None

def parse_jobs(html):
    """Extract job listings from LinkedIn search page HTML."""
    jobs, seen = [], set()
    # Extract from href URLs like: /jobs/view/aws-architect-at-infosys-4402367284?position=1
    pat = re.compile(r'href="(https?://[^"]*?/jobs/view/[^"\?]+?)-(\d+)\?')
    for m in pat.finditer(html):
        url_base, jid = m.group(1), m.group(2)
        if jid in seen:
            continue
        seen.add(jid)
        # Derive title from URL slug
        slug = url_base.split("/")[-1]
        # Remove 'at-companyname' suffix, then turn dashes to spaces
        if "-at-" in slug:
            title_slug = slug.split("-at-")[0]
        else:
            title_slug = slug
        title = title_slug.replace("-", " ").title()
        # Fix common abbreviations
        for abbr, fixed in [("Aws", "AWS"), ("Ci Cd", "CI/CD"), ("Ai", "AI"), ("Ml", "ML"), ("K8S", "K8s"), ("M F D", "(m/f/d)"), ("Eks", "EKS"), ("Aks", "AKS"), ("Gke", "GKE"), ("%E2%80%93", "–"), ("%2B", "+")]:
            title = title.replace(abbr, fixed)
        # Remove location suffixes like "Hyderabad Bengaluru Pune Chennai"
        loc_suffixes = ["Hyderabad Bengaluru Pune Chennai", "Bengaluru East Karnataka", "Bangalore Urban", "Hyderabad Bengaluru Pune Chenna"]
        for suf in loc_suffixes:
            if title.endswith(suf):
                title = title[:-len(suf)].strip()
                if title.endswith(","):
                    title = title[:-1].strip()
        # Extract company from URL slug (e.g., "cloud-architect-at-infosys-4402367284")
        company = ""
        slug = url_base.split("/")[-1]
        if "-at-" in slug:
            company = slug.split("-at-")[-1].replace("-", " ").title()
        jobs.append({"id": jid, "title": title.strip(), "company": company, "url": url_base + "-" + jid + "/"})
    # Extract company names from inline data: "CompanyName"...jobPosting:ID
    if jobs:
        co_pat = re.compile(r'"([A-Z][a-zA-Z0-9 .,&()/-]{2,60}?)"[^}]*?jobPosting\s*[:=]\s*(\d+)')
        co_map = {}
        for m in co_pat.finditer(html):
            co_map[m.group(2)] = m.group(1)
        for j in jobs:
            if j["id"] in co_map:
                j["company"] = co_map[j["id"]]
    return jobs

def fetch_details(job):
    jid = job["id"]
    url = job.get("url") or f"https://www.linkedin.com/jobs/view/{jid}/"
    html = fetch(url)
    if not html: return job
    soup = BeautifulSoup(html, "html.parser")
    for s in soup.find_all("script", type="application/ld+json"):
        try:
            d = json.loads(s.string)
            if isinstance(d,dict) and d.get("@type") == "JobPosting":
                desc = d.get("description","")
                co = d.get("hiringOrganization",{}).get("name","")
                if desc: job["description"] = desc
                if co and not job.get("company"): job["company"] = co
        except: pass
    if not job.get("description"):
        m = soup.find("meta", attrs={"name":"description"})
        if m: job["description"] = m.get("content","")
    return job

def extract_skills(text):
    tl = text.lower()
    return {s for s in SKILLS if s.lower() in tl}

def bar_color(pct):
    if pct >= 70: return "#22c55e"
    if pct >= 40: return "#6c8cff"
    if pct >= 20: return "#e879f9"
    return "#ef4444"

def build_tabs_and_content(company_skills, skill_counter, max_count):
    nc = len(company_skills)
    top = skill_counter.most_common(50)
    # All skills table
    all_rows = ""
    for skill, count in top:
        p = count / max_count * 100
        cs = sorted(set(company_skills.get(skill,[])))
        cstr = ", ".join(cs[:8])
        if len(cs) > 8: cstr += f" +{len(cs)-8} more"
        all_rows += f"<tr><td><strong>{skill}</strong></td><td>{count}/{nc}</td><td><div class='bar-bg'><div class='bar-fill' style='width:{p:.0f}%;background:{bar_color(p)}'></div></div></td><td style='font-size:12px;color:var(--text2);max-width:280px'>{cstr}</td></tr>\n"

    cats = {
        "Cloud & Infra": ["AWS","Azure","GCP","Google Cloud","kubernetes","docker","terraform","CI/CD","helm","gitops","CloudFormation","CDK","EKS","AKS","VPC","IAM","serverless","lambda","prometheus","grafana","CloudWatch","ansible","jenkins","argocd"],
        "Architecture": ["microservices","event-driven","distributed systems","kafka","API gateway","REST","gRPC","FinOps","multi-cloud","edge computing","message queue","caching","system design"],
        "AI & ML": ["machine learning","deep learning","LLM","GenAI","RAG","AI agents","MCP","langchain","prompt engineering","vector database","MLOps","TensorFlow","PyTorch","NLP","fine-tuning"],
        "Programming": ["python","java","golang","go","typescript","rust","react","node.js","postgresql","redis","snowflake","SQL","fastapi","spring boot","mongodb","bigquery","databricks"],
        "DevOps & SRE": ["SRE","observability","DevSecOps","incident management","chaos engineering","policy as code","zero trust","gitops","on-call","secret management","compliance"],
        "Leadership": ["agile","scrum","stakeholder management","mentoring","architecture review","cross-functional","pre-sales"],
    }

    tab_list = [("All Skills", "dt-all", all_rows)]
    for cn, sk_list in cats.items():
        tid = "dt-" + cn.lower().replace(" & ","-").replace(" ","-")
        rows = ""
        for s in sk_list:
            if s in skill_counter:
                c = skill_counter[s]; p = c / max_count * 100
                badge = '<span class="demand-badge demand-high">High</span>' if p >= 70 else '<span class="demand-badge demand-med">Med</span>' if p >= 40 else '<span class="demand-badge demand-low">Low</span>'
                cs2 = ", ".join(sorted(set(company_skills.get(s,[])))[:6])
                rows += f"<tr><td><strong>{s}</strong></td><td>{badge}</td><td>{c}/{nc}</td><td><div class='bar-bg'><div class='bar-fill' style='width:{p:.0f}%;background:{bar_color(p)}'></div></div></td><td style='font-size:11px;color:var(--text3);max-width:200px'>{cs2}</td></tr>\n"
        tab_list.append((cn, tid, rows))

    tab_btns, tab_divs, first = "", "", True
    for label, tid, rows in tab_list:
        ac = " dt-active" if first else ""
        tab_btns += f'<a href="#" class="demand-tab{ac}" onclick="event.preventDefault();document.querySelectorAll(\'.demand-tab\').forEach(t=>t.classList.remove(\'dt-active\'));this.classList.add(\'dt-active\');document.querySelectorAll(\'.demand-tab-content\').forEach(c=>c.classList.remove(\'dt-active\'));document.getElementById(\'{tid}\').classList.add(\'dt-active\')">{label}</a>\n'
        if not rows.strip():
            tab_divs += f'<div class="demand-tab-content{ac}" id="{tid}"><p style="color:var(--text3);font-size:13px">No skills found in this category.</p></div>\n'
        else:
            tab_divs += f'<div class="demand-tab-content{ac}" id="{tid}"><table><tr><th>Skill</th><th>Level</th><th>Demand</th><th>Bar</th><th>Companies</th></tr>\n{rows}</table></div>\n'
        first = False
    return tab_btns, tab_divs

def build_section(company_skills, skill_counter, job_count, ts):
    nc = len(company_skills)
    top = skill_counter.most_common(50)
    mx = top[0][1] if top else 1
    hd = sum(1 for _,c in top if c >= mx*0.7)
    md = sum(1 for _,c in top if 0.4 <= c/mx < 0.7)
    ld = sum(1 for _,c in top if c < mx*0.4)
    tab_btns, tab_divs = build_tabs_and_content(company_skills, skill_counter, mx)

    return f"""
<style>
.demand-tabs{{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 20px;padding:12px 16px;background:var(--bg2);border:1px solid var(--border);border-radius:10px}}
.demand-tab{{display:inline-block;padding:6px 16px;font-size:12px;color:var(--text2);background:var(--bg3);border:1px solid var(--border);border-radius:8px;cursor:pointer;transition:all .12s;text-decoration:none}}
.demand-tab:hover{{color:var(--text);border-color:var(--accent);background:rgba(108,140,255,0.08)}}
.demand-tab.dt-active{{color:var(--accent);border-color:var(--accent);background:rgba(108,140,255,0.12);font-weight:600}}
.demand-tab-content{{display:none}}
.demand-tab-content.dt-active{{display:block}}
.demand-badge{{display:inline-block;padding:2px 10px;border-radius:10px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px}}
.demand-high{{background:rgba(34,197,94,0.12);color:#22c55e;border:1px solid rgba(34,197,94,0.2)}}
.demand-med{{background:rgba(108,140,255,0.12);color:#6c8cff;border:1px solid rgba(108,140,255,0.2)}}
.demand-low{{background:rgba(232,121,249,0.12);color:#e879f9;border:1px solid rgba(232,121,249,0.2)}}
</style>

<h2 id="skill-demand" style="margin-top:44px">Skill Demand Heatmap</h2>
<p>Skills ranked by number of companies demanding them from <strong>LinkedIn job listings</strong>. Last refreshed: {ts}. <strong>{len(skill_counter)}</strong> distinct skills across <strong>{job_count}</strong> listings from <strong>{nc}</strong> companies.</p>

<div class="info-crd" style="margin:12px 0 20px">
  <div class="stat"><span class="stat-val" style="color:var(--green)">{hd}</span><span class="stat-lbl">High Demand</span></div>
  <div class="stat"><span class="stat-val" style="color:var(--accent)">{md}</span><span class="stat-lbl">Medium Demand</span></div>
  <div class="stat"><span class="stat-val" style="color:#e879f9">{ld}</span><span class="stat-lbl">Low Demand</span></div>
  <div class="stat"><span class="stat-val" style="color:var(--cyan)">{job_count}</span><span class="stat-lbl">Jobs Analyzed</span></div>
</div>

<div class="demand-tabs">
{tab_btns}</div>
{tab_divs}
"""

def inject_section(page_path, section):
    if not os.path.exists(page_path):
        print(f"Page not found: {page_path}", file=sys.stderr)
        return False
    html = open(page_path, "r", encoding="utf-8").read()
    backup(page_path)

    # Remove existing section if present
    if '<h2 id="skill-demand"' in html and '<h2 id="skill-gaps"' in html:
        start = html.index('<h2 id="skill-demand"')
        end = html.index('<h2 id="skill-gaps"')
        html = html[:start] + html[end:]
        print("Replaced existing skill-demand section", file=sys.stderr)

    # Inject before skill-gaps
    if '<h2 id="skill-gaps"' in html:
        html = html.replace('<h2 id="skill-gaps"', section + '\n<h2 id="skill-gaps"', 1)
    else:
        close = html.rfind("</body>")
        if close > 0:
            html = html[:close] + section + "\n" + html[close:]

    open(page_path, "w", encoding="utf-8").write(html)
    return True

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--output", default=PAGE)
    args = ap.parse_args()

    print("Fetching LinkedIn search pages...", file=sys.stderr)
    all_jobs = {}
    for url in SEARCH_URLS:
        html = fetch(url)
        if not html:
            print(f"  FAILED: {url}", file=sys.stderr)
            continue
        found = parse_jobs(html)
        for j in found:
            all_jobs[j["id"]] = j
        label = url.rstrip("/").split("/")[-1][:40]
        print(f"  {label}: {len(found)} jobs", file=sys.stderr)

    print(f"Total: {len(all_jobs)} unique jobs. Fetching details...", file=sys.stderr)
    company_skills, job_count = {}, 0
    for jid, job in all_jobs.items():
        job = fetch_details(job)
        co = job.get("company","") or "Unknown"
        desc = job.get("description","") + " " + job.get("title","")
        skills = extract_skills(desc)
        if co not in company_skills:
            company_skills[co] = set()
        company_skills[co].update(skills)
        job_count += 1
        print(f"  [{job_count}] {job.get('title','?')[:45]} @ {co[:20]} -> {len(skills)} skills", file=sys.stderr)

    if not company_skills:
        print("No data collected. Skipping.", file=sys.stderr)
        return

    sc = Counter()
    for co, skills in company_skills.items():
        for s in skills:
            sc[s] += 1

    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    section = build_section(company_skills, sc, job_count, ts)
    ok = inject_section(args.output, section)
    if ok:
        print(f"Done! Skills: {len(sc)}, Companies: {len(company_skills)}", file=sys.stderr)

if __name__ == "__main__":
    main()
