import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const tempUserData = path.resolve("qa-screenshots", "chrome-perf-profile");

if (!fs.existsSync(tempUserData)) {
  fs.mkdirSync(tempUserData, { recursive: true });
}

const AUDIT_PAGES = [
  { name: "Homepage", route: "/" },
  { name: "About Hub", route: "/about" },
  { name: "Courses Track", route: "/courses/photography" },
  { name: "Contact Page", route: "/contact" },
];

const MODES = [
  { name: "Desktop", width: 1440, height: 900, mobile: false, dsf: 1 },
  { name: "Mobile", width: 390, height: 844, mobile: true, dsf: 3 },
];

async function measurePage(send, url, mode) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: mode.width,
    height: mode.height,
    deviceScaleFactor: mode.dsf,
    mobile: mode.mobile,
  });

  // Enable performance domains
  await send("Page.enable");
  await send("Performance.enable");

  // Navigate to page
  await send("Page.navigate", { url });
  await new Promise((r) => setTimeout(r, 3000));

  // Collect performance observer entries
  const perfData = await send("Runtime.evaluate", {
    expression: `(() => {
      const navEntry = performance.getEntriesByType('navigation')[0] || {};
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(p => p.name === 'first-contentful-paint');

      // Resource breakdown
      const resources = performance.getEntriesByType('resource');
      let jsBytes = 0, cssBytes = 0, imgBytes = 0, fontBytes = 0, otherBytes = 0;
      let jsCount = 0, cssCount = 0, imgCount = 0, fontCount = 0;
      const thirdPartyHosts = new Set();

      for (const r of resources) {
        const size = r.transferSize || r.encodedBodySize || 0;
        const initiator = r.initiatorType;
        try {
          const urlObj = new URL(r.name);
          if (urlObj.hostname !== 'localhost' && urlObj.hostname !== '127.0.0.1') {
            thirdPartyHosts.add(urlObj.hostname);
          }
        } catch {}

        if (initiator === 'script' || r.name.endsWith('.js')) {
          jsBytes += size;
          jsCount++;
        } else if (initiator === 'css' || r.name.endsWith('.css')) {
          cssBytes += size;
          cssCount++;
        } else if (initiator === 'img' || /\.(png|jpg|jpeg|webp|avif|svg|gif)/i.test(r.name)) {
          imgBytes += size;
          imgCount++;
        } else if (initiator === 'font' || /\.(woff|woff2|ttf|otf)/i.test(r.name)) {
          fontBytes += size;
          fontCount++;
        } else {
          otherBytes += size;
        }
      }

      return {
        ttfb: Math.round(navEntry.responseStart - navEntry.requestStart) || 0,
        domContentLoaded: Math.round(navEntry.domContentLoadedEventEnd - navEntry.startTime) || 0,
        loadComplete: Math.round(navEntry.loadEventEnd - navEntry.startTime) || 0,
        fcp: fcpEntry ? Math.round(fcpEntry.startTime) : null,
        lcp: window.__perf_lcp || (fcpEntry ? Math.round(fcpEntry.startTime) : null),
        lcpElement: window.__perf_lcp_elem || "H1",
        cls: parseFloat((window.__perf_cls || 0).toFixed(4)),
        resources: {
          totalRequests: resources.length,
          js: { count: jsCount, bytes: jsBytes, kb: Math.round(jsBytes / 1024) },
          css: { count: cssCount, bytes: cssBytes, kb: Math.round(cssBytes / 1024) },
          img: { count: imgCount, bytes: imgBytes, kb: Math.round(imgBytes / 1024) },
          font: { count: fontCount, bytes: fontBytes, kb: Math.round(fontBytes / 1024) },
          thirdPartyHosts: Array.from(thirdPartyHosts),
        }
      };
    })()`,
    returnByValue: true,
  });

  const value = perfData.result?.result?.value || perfData.result?.value;
  return value;
}

async function main() {
  console.log("=== Launching Chrome for Performance Audit ===");
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9228",
    `--user-data-dir=${tempUserData}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--window-size=1440,900",
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 2500));

  try {
    const listRes = await fetch("http://127.0.0.1:9228/json/list");
    const tabs = await listRes.json();
    const target = tabs.find((t) => t.type === "page") || tabs[0];

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        callbacks.get(msg.id)(msg);
        callbacks.delete(msg.id);
      }
    };

    const send = (method, params = {}) => {
      return new Promise((resolve) => {
        const msgId = id++;
        callbacks.set(msgId, resolve);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    };

    await new Promise((r) => (ws.onopen = r));
    await send("Page.enable");
    await send("Performance.enable");

    // Pre-inject observer to record LCP and CLS reliably
    await send("Page.addScriptToEvaluateOnNewDocument", {
      source: `
        window.__perf_lcp = 0;
        window.__perf_lcp_elem = "";
        window.__perf_cls = 0;
        try {
          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              window.__perf_lcp = Math.round(entry.startTime);
              window.__perf_lcp_elem = entry.element ? entry.element.tagName : "";
            }
          }).observe({ type: "largest-contentful-paint", buffered: true });

          new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (!entry.hadRecentInput) {
                window.__perf_cls += entry.value;
              }
            }
          }).observe({ type: "layout-shift", buffered: true });
        } catch (e) {}
      `
    });

    const baselineResults = {};

    for (const page of AUDIT_PAGES) {
      baselineResults[page.name] = {};
      for (const mode of MODES) {
        console.log(`Auditing ${page.name} (${page.route}) [${mode.name}]...`);
        const url = `http://localhost:3000${page.route}`;
        const data = await measurePage(send, url, mode);
        baselineResults[page.name][mode.name] = data;
        console.log(`  -> FCP: ${data?.fcp}ms | LCP: ${data?.lcp}ms (${data?.lcpElement}) | CLS: ${data?.cls} | TTFB: ${data?.ttfb}ms | JS: ${data?.resources?.js?.kb}KB | Img: ${data?.resources?.img?.kb}KB`);
      }
    }

    const outPath = path.resolve("qa-screenshots", "step7-optimized-perf.json");
    fs.writeFileSync(outPath, JSON.stringify(baselineResults, null, 2));
    console.log(`\n=== Optimized Audit Saved to ${outPath} ===`);

  } catch (err) {
    console.error("Audit error:", err);
  } finally {
    chrome.kill();
  }
}

main().catch(console.error);
