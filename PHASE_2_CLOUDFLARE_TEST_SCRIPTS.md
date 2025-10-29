# 🧪 PHASE 2: CLOUDFLARE VALIDATION TEST SCRIPTS

Use these scripts to verify your Cloudflare configuration is working correctly.

---

## 🔒 TEST 1: SSL/TLS Verification

### Automated SSL Test
```bash
# Test SSL certificate and configuration
curl -vI https://yourdomain.com 2>&1 | grep -E '(SSL|TLS|certificate)'

# Expected output:
# * TLSv1.3 (OUT), TLS handshake, Client hello (1)
# * TLSv1.3 (IN), TLS handshake, Server hello (2)
# * SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384
```

### Manual SSL Test
1. Visit [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/)
2. Enter your domain: `yourdomain.com`
3. Click **Submit**
4. **Expected Result:** Grade A or A+

### ✅ Success Criteria:
- TLS 1.3 enabled
- No SSL/TLS vulnerabilities
- Certificate valid and trusted
- HSTS enabled (Strict-Transport-Security header present)

---

## 🛡️ TEST 2: Web Application Firewall (WAF) Test

### Test XSS (Cross-Site Scripting) Protection
```bash
# Test 1: Basic XSS attempt
curl -I "https://yourdomain.com/?test=<script>alert('xss')</script>"

# Expected output:
# HTTP/2 403 Forbidden
# CF-RAY: [ray-id] (Cloudflare blocked request)

# Test 2: SQL Injection attempt
curl -I "https://yourdomain.com/?id=1' OR '1'='1"

# Expected output:
# HTTP/2 403 Forbidden

# Test 3: Path traversal attempt
curl -I "https://yourdomain.com/../../etc/passwd"

# Expected output:
# HTTP/2 403 Forbidden
```

### Manual WAF Test
1. Visit your site with this URL: `https://yourdomain.com/?test=<script>alert('xss')</script>`
2. **Expected Result:** Cloudflare 403 error page (blocked)

### ✅ Success Criteria:
- XSS attempts blocked (403 status)
- SQL injection attempts blocked (403 status)
- Path traversal attempts blocked (403 status)
- Events logged in Cloudflare Security Events

---

## 🤖 TEST 3: Bot Protection Verification

### Test Bot Challenge
```bash
# Test 1: Request without user agent (bot-like)
curl -I https://yourdomain.com -H "User-Agent: "

# Expected output (Free tier):
# HTTP/2 403 Forbidden (Bot Fight Mode blocks)

# Expected output (Pro tier):
# HTTP/2 403 or JavaScript challenge

# Test 2: Request with automated bot signature
curl -I https://yourdomain.com -H "User-Agent: curl/7.64.1"

# Expected output:
# HTTP/2 403 or challenge
```

### Manual Bot Test
1. Visit [BotCheck.me](https://botcheck.me/)
2. Enter your domain
3. **Expected Result:** Cloudflare should challenge or block automated requests

### ✅ Success Criteria:
- Headless browsers challenged or blocked
- Suspicious user agents blocked
- Legitimate bots (Google, Bing) allowed
- Bot score visible in Cloudflare analytics

---

## 🚦 TEST 4: Rate Limiting Verification (Pro Tier Only)

### Test API Rate Limit
```bash
# Send 105 requests in 1 minute to trigger rate limit
for i in {1..105}; do
  curl -s -o /dev/null -w "Request $i: %{http_code}\n" \
    https://yourdomain.com/functions/v1/test-endpoint
  sleep 0.5
done

# Expected output:
# Request 1-100: 200 (or 404 if endpoint doesn't exist)
# Request 101-105: 429 (Too Many Requests)
```

### Test Login Rate Limit
```bash
# Simulate brute force login attempt
for i in {1..10}; do
  curl -s -X POST https://yourdomain.com/auth/v1/token \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' \
    -w "Attempt $i: %{http_code}\n" \
    -o /dev/null
  sleep 1
done

# Expected output:
# Attempt 1-5: 401 or 400 (unauthorized/bad request)
# Attempt 6-10: 429 (rate limited)
```

### ✅ Success Criteria:
- After 100 API requests per minute: 429 status
- After 5 login attempts per minute: 429 status
- Rate limit resets after configured duration
- Legitimate users not affected

---

## ⚡ TEST 5: Performance & Caching Verification

### Test Cache Headers
```bash
# Test if static assets are cached
curl -I https://yourdomain.com/assets/index.js

# Expected headers:
# cf-cache-status: HIT (cached)
# cache-control: public, max-age=...
# cf-ray: [ray-id]
```

### Test Image Optimization (Pro Tier)
```bash
# Test image optimization
curl -I https://yourdomain.com/assets/hero-image.jpg \
  -H "Accept: image/webp"

# Expected headers:
# content-type: image/webp (optimized)
# cf-cache-status: HIT
# cf-polished: origSize=... (image optimized)
```

### Speed Test
```bash
# Measure total page load time
curl -w "\nTotal Time: %{time_total}s\n" -o /dev/null -s https://yourdomain.com

# Expected output:
# Total Time: < 2.0s
```

### Manual Performance Test
1. Visit [GTMetrix](https://gtmetrix.com)
2. Enter your domain
3. **Expected Results:**
   - Largest Contentful Paint (LCP): < 2.5s
   - First Input Delay (FID): < 100ms
   - Cumulative Layout Shift (CLS): < 0.1
   - Performance Score: > 90%

### ✅ Success Criteria:
- Static assets cached (cf-cache-status: HIT)
- Images optimized to WebP (Pro tier)
- Total load time < 2 seconds
- Cache hit rate > 80%

---

## 🌍 TEST 6: DDoS Protection Verification

### Simulate HTTP Flood Attack (Use with Caution)
```bash
# ⚠️ WARNING: Only test on YOUR OWN domain!
# This simulates a small-scale HTTP flood

# Install Apache Bench (if not installed)
# macOS: brew install httpd
# Ubuntu: sudo apt-get install apache2-utils

# Send 1000 requests with 50 concurrent connections
ab -n 1000 -c 50 https://yourdomain.com/

# Expected result:
# - Cloudflare should start rate limiting or challenging requests
# - Some requests may return 503 (Service Temporarily Unavailable)
# - Your origin server (Lovable) should remain stable
```

### Check DDoS Events in Cloudflare
1. Go to Cloudflare Dashboard
2. Navigate to **Security** > **Events**
3. Filter by **Action Taken: Challenge / Block**
4. **Expected Result:** You should see increased activity during the test

### ✅ Success Criteria:
- Cloudflare absorbs attack traffic
- Origin server (Lovable) remains stable
- Legitimate traffic not affected
- Attack logged in Security Events

---

## 🔍 TEST 7: Geo-Blocking Verification (Pro Tier Only)

### Test Geo-Restriction
```bash
# If you've configured geo-blocking to allow only US traffic:
# Use a VPN to connect from a blocked country

# Test from blocked country
curl -I https://yourdomain.com

# Expected output:
# HTTP/2 403 Forbidden
# CF-RAY: [ray-id]
```

### Manual Geo Test
1. Use a VPN service (e.g., NordVPN, ExpressVPN)
2. Connect to a country you've blocked (e.g., Russia, China)
3. Visit your domain
4. **Expected Result:** Cloudflare 403 error page

### ✅ Success Criteria:
- Requests from blocked countries return 403
- Requests from allowed countries work normally
- Geo-blocking logged in Security Events

---

## 📊 TEST 8: Analytics & Monitoring Verification

### Check Cloudflare Analytics
1. Go to Cloudflare Dashboard
2. Navigate to **Analytics & Logs** > **Traffic**
3. Verify you see:
   - Total requests
   - Bandwidth usage
   - Cached vs. uncached requests
   - Top countries
   - Top content types

### Check Security Events
1. Go to **Security** > **Events**
2. Verify you see:
   - Security events (WAF blocks)
   - Bot scores
   - Rate limit triggers
   - Challenge/block actions

### ✅ Success Criteria:
- Analytics showing traffic data
- Security events logging properly
- Email alerts configured and working
- Dashboard accessible and responsive

---

## 🧪 COMPREHENSIVE TEST SCRIPT

Run all tests at once:

```bash
#!/bin/bash

echo "==================================="
echo "CLOUDFLARE SECURITY TEST SUITE"
echo "==================================="
echo ""

DOMAIN="yourdomain.com"  # CHANGE THIS!

# Test 1: SSL/TLS
echo "Test 1: SSL/TLS Verification"
SSL_STATUS=$(curl -vI https://$DOMAIN 2>&1 | grep -c "TLSv1.3")
if [ $SSL_STATUS -gt 0 ]; then
  echo "✅ SSL/TLS: PASS (TLS 1.3 enabled)"
else
  echo "❌ SSL/TLS: FAIL"
fi
echo ""

# Test 2: WAF - XSS Protection
echo "Test 2: WAF XSS Protection"
XSS_STATUS=$(curl -I "https://$DOMAIN/?test=<script>alert('xss')</script>" 2>/dev/null | grep -c "403")
if [ $XSS_STATUS -gt 0 ]; then
  echo "✅ WAF XSS: PASS (blocked with 403)"
else
  echo "❌ WAF XSS: FAIL (not blocked)"
fi
echo ""

# Test 3: WAF - SQL Injection Protection
echo "Test 3: WAF SQL Injection Protection"
SQL_STATUS=$(curl -I "https://$DOMAIN/?id=1' OR '1'='1" 2>/dev/null | grep -c "403")
if [ $SQL_STATUS -gt 0 ]; then
  echo "✅ WAF SQL: PASS (blocked with 403)"
else
  echo "❌ WAF SQL: FAIL (not blocked)"
fi
echo ""

# Test 4: Bot Protection
echo "Test 4: Bot Protection"
BOT_STATUS=$(curl -I https://$DOMAIN -H "User-Agent: " 2>/dev/null | grep -c "403")
if [ $BOT_STATUS -gt 0 ]; then
  echo "✅ Bot Protection: PASS (blocked)"
else
  echo "⚠️ Bot Protection: May need review"
fi
echo ""

# Test 5: Cache Headers
echo "Test 5: Cache Headers"
CACHE_STATUS=$(curl -I https://$DOMAIN 2>/dev/null | grep -i "cf-cache-status")
if [ -n "$CACHE_STATUS" ]; then
  echo "✅ Caching: PASS ($CACHE_STATUS)"
else
  echo "⚠️ Caching: No CF headers found"
fi
echo ""

# Test 6: HTTPS Redirect
echo "Test 6: HTTPS Redirect"
HTTP_REDIRECT=$(curl -I http://$DOMAIN 2>/dev/null | grep -c "301\|302")
if [ $HTTP_REDIRECT -gt 0 ]; then
  echo "✅ HTTPS Redirect: PASS"
else
  echo "❌ HTTPS Redirect: FAIL (not redirecting)"
fi
echo ""

# Test 7: Response Time
echo "Test 7: Response Time"
RESPONSE_TIME=$(curl -w "%{time_total}" -o /dev/null -s https://$DOMAIN)
echo "⏱️ Response Time: ${RESPONSE_TIME}s"
if (( $(echo "$RESPONSE_TIME < 2.0" | bc -l) )); then
  echo "✅ Performance: PASS (< 2s)"
else
  echo "⚠️ Performance: SLOW (> 2s)"
fi
echo ""

echo "==================================="
echo "TEST SUITE COMPLETE"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Review any failed tests"
echo "2. Check Cloudflare Security > Events"
echo "3. Run SSL Labs test: https://www.ssllabs.com/ssltest/"
echo "4. Run GTMetrix test: https://gtmetrix.com"
```

**To use:**
1. Save as `cloudflare-test.sh`
2. Replace `yourdomain.com` with your actual domain
3. Make executable: `chmod +x cloudflare-test.sh`
4. Run: `./cloudflare-test.sh`

---

## 📋 TEST RESULTS TEMPLATE

Copy this template and fill in your results:

```
CLOUDFLARE SECURITY VALIDATION REPORT
Date: [DATE]
Domain: [YOUR DOMAIN]
Cloudflare Tier: [Free / Pro / Business]

TEST RESULTS:
✅/❌ SSL/TLS: [PASS/FAIL] - Grade: [A/A+/B]
✅/❌ WAF XSS Protection: [PASS/FAIL]
✅/❌ WAF SQL Injection: [PASS/FAIL]
✅/❌ Bot Protection: [PASS/FAIL]
✅/❌ Rate Limiting: [PASS/FAIL] (Pro only)
✅/❌ Cache Headers: [PASS/FAIL] - Hit Rate: [X%]
✅/❌ HTTPS Redirect: [PASS/FAIL]
✅/❌ Performance: [PASS/FAIL] - Load Time: [Xs]
✅/❌ DDoS Protection: [ACTIVE/INACTIVE]
✅/❌ Analytics Working: [YES/NO]

SUMMARY:
Total Tests: 10
Passed: [X]
Failed: [X]
Warnings: [X]

NOTES:
[Any additional observations]

NEXT STEPS:
[Actions needed to fix failures]
```

---

## 🎉 SUCCESS CRITERIA SUMMARY

Your Cloudflare setup is complete when:

- ✅ SSL Labs grade: A or A+
- ✅ XSS attacks blocked (403 status)
- ✅ SQL injection blocked (403 status)
- ✅ Bot requests challenged or blocked
- ✅ Rate limits triggering correctly (Pro tier)
- ✅ Cache hit rate > 80%
- ✅ HTTP → HTTPS redirect working
- ✅ Page load time < 2 seconds
- ✅ Security events logging in dashboard
- ✅ Email alerts configured and working

Once all tests pass, you're ready for **Phase 3: Datadog Security Monitoring**!
