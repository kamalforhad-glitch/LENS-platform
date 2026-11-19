import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const qaOutDir = path.resolve("qa-screenshots", "step6-responsive");
const tempUserData = path.resolve("qa-screenshots", "chrome-profile-step6");

if (!fs.existsSync(qaOutDir)) {
  fs.mkdirSync(qaOutDir, { recursive: true });
}
if (!fs.existsSync(tempUserData)) {
  fs.mkdirSync(tempUserData, { recursive: true });
}

const VIEWPORTS = [
  { name: "Desktop", width: 1440, height: 900, mobile: false, dsf: 1 },
  { name: "Laptop", width: 1280, height: 800, mobile: false, dsf: 1 },
  { name: "Tablet", width: 768, height: 1024, mobile: true, dsf: 2 },
  { name: "Mobile", width: 390, height: 844, mobile: true, dsf: 3 },
  { name: "Small Mobile", width: 375, height: 812, mobile: true, dsf: 3 },
  { name: "Narrow Mobile", width: 320, height: 700, mobile: true, dsf: 2 },
];

const REQUIRED_ROUTES = [
  "/",
  "/about",
  "/about/team",
  "/about/vision",
  "/about/partnerships",
  "/theme",
  "/theme/research",
  "/theme/literature",
  "/courses",
  "/courses/photography",
  "/courses/mojo",
  "/courses/fact-check",
  "/resources",
  "/resources/election",
  "/resources/publications",
  "/resources/media",
  "/contact",
];

async function main() {
  console.log("=== Launching Chrome for Step 6 Responsive QA ===");
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9227",
    `--user-data-dir=${tempUserData}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--window-size=1440,900",
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 2500));

  const report = {
    startedAt: new Date().toISOString(),
    viewportsTested: VIEWPORTS.map(v => `${v.name} (${v.width}x${v.height})`),
    routesTested: REQUIRED_ROUTES,
    results: {},
    consoleErrors: [],
    failedRequests: [],
  };

  try {
    const listRes = await fetch("http://127.0.0.1:9227/json/list");
    const tabs = await listRes.json();
    const target = tabs.find((t) => t.type === "page") || tabs[0];

    const ws = new WebSocket(target.webSocketDebuggerUrl);
    let id = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === "Runtime.consoleAPICalled") {
        const text = msg.params.args.map((a) => a.value || a.description || "").join(" ");
        if (msg.params.type === "error") {
          report.consoleErrors.push({ text, timestamp: new Date().toISOString() });
        }
      }
      if (msg.method === "Runtime.exceptionThrown") {
        report.consoleErrors.push({
          text: msg.params.exceptionDetails.text,
          exception: msg.params.exceptionDetails.exception?.description,
          timestamp: new Date().toISOString(),
        });
      }
      if (msg.method === "Network.responseReceived") {
        const { response } = msg.params;
        if (response.status >= 400 && !response.url.includes("favicon")) {
          report.failedRequests.push({
            url: response.url,
            status: response.status,
            statusText: response.statusText,
          });
        }
      }
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
    await send("DOM.enable");
    await send("Runtime.enable");
    await send("Network.enable");

    for (const vp of VIEWPORTS) {
      console.log(`\n==========================================`);
      console.log(`TESTING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
      console.log(`==========================================`);

      report.results[vp.name] = [];

      await send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.dsf,
        mobile: vp.mobile,
      });

      for (const route of REQUIRED_ROUTES) {
        const url = `http://localhost:3000${route}`;
        await send("Page.navigate", { url });
        await new Promise((r) => setTimeout(r, 1200));

        const evalRes = await send("Runtime.evaluate", {
          expression: `(() => {
            const docW = document.documentElement.scrollWidth;
            const winW = window.innerWidth;
            const hasHOverflow = docW > winW;
            const header = !!document.querySelector("header");
            const footer = !!document.querySelector("footer");
            const heroTitle = document.querySelector("h1")?.textContent?.trim() || "";
            const breadcrumbs = !!document.querySelector("nav[aria-label='Breadcrumb']");
            const subnavEl = document.querySelector("nav[aria-label*='section navigation'] div.overflow-x-auto");
            const subnavExists = !!subnavEl;
            const subnavScrollable = subnavEl ? subnavEl.scrollWidth > subnavEl.clientWidth : false;
            const cardsCount = document.querySelectorAll("div.grid a, div.grid div.rounded-3xl, div.grid div.rounded-2xl").length;
            const mobileMenuBtn = !!document.querySelector("header button[aria-label*='menu' i], header button[aria-controls='sitenav-mobile-menu']");
            const desktopNavLinks = document.querySelectorAll("header nav ul a").length;
            const brokenImages = Array.from(document.images)
              .filter(img => img.naturalWidth === 0 && !img.src.includes('data:'))
              .map(img => img.src);

            // Contact form check if on /contact
            const isContact = window.location.pathname === "/contact";
            const contactForm = isContact ? {
              hasName: !!document.querySelector("input#name"),
              hasEmail: !!document.querySelector("input#email"),
              hasSubject: !!document.querySelector("input#subject"),
              hasMessage: !!document.querySelector("textarea#message"),
              hasSubmitBtn: !!document.querySelector("button[type='submit']"),
            } : null;

            return {
              docW,
              winW,
              hasHOverflow,
              header,
              footer,
              heroTitle: heroTitle.slice(0, 40),
              breadcrumbs,
              subnavExists,
              subnavScrollable,
              cardsCount,
              mobileMenuBtn,
              desktopNavLinks,
              brokenImagesCount: brokenImages.length,
              contactForm,
            };
          })()`,
          returnByValue: true,
        });

        const metrics = evalRes.result?.result?.value || evalRes.result?.value || {};
        const status = metrics.hasHOverflow ? "OVERFLOW_ERROR" : "PASS";

        report.results[vp.name].push({
          route,
          status,
          metrics,
        });

        const tag = status === "PASS" ? "✓" : "✗";
        console.log(`  ${tag} [${status}] ${route} | docW: ${metrics.docW} winW: ${metrics.winW} | Cards: ${metrics.cardsCount} | Subnav: ${metrics.subnavExists ? (metrics.subnavScrollable ? "Scrollable" : "Fits") : "N/A"}`);
      }
    }

    // ==========================================
    // INTERACTIVE TESTS: Mobile Drawer Toggle & Escape Key
    // ==========================================
    console.log(`\n==========================================`);
    console.log(`TESTING INTERACTIVE: Mobile Drawer & Escape Key`);
    console.log(`==========================================`);

    await send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      mobile: true,
    });

    await send("Page.navigate", { url: "http://localhost:3000/" });
    await new Promise((r) => setTimeout(r, 1500));

    // Check opening mobile menu
    const openRes = await send("Runtime.evaluate", {
      expression: `(() => {
        const toggle = document.querySelector("header button[aria-controls='sitenav-mobile-menu']");
        if (!toggle) return { error: "Toggle button not found" };
        toggle.click();
        return { clicked: true };
      })()`,
      returnByValue: true,
    });

    await new Promise((r) => setTimeout(r, 500));

    const drawerCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const drawer = document.querySelector("#sitenav-mobile-menu");
        const links = drawer ? drawer.querySelectorAll("a").length : 0;
        const bodyOverflow = document.body.style.overflow;
        return {
          drawerVisible: !!drawer,
          linksCount: links,
          bodyOverflow,
        };
      })()`,
      returnByValue: true,
    });

    console.log("  Mobile drawer open test:", drawerCheck.result?.value);
    report.mobileDrawerOpen = drawerCheck.result?.value;

    // Dispatch Escape key
    await send("Input.dispatchKeyEvent", {
      type: "keyDown",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    });
    await send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    });

    await new Promise((r) => setTimeout(r, 500));

    const drawerCloseCheck = await send("Runtime.evaluate", {
      expression: `(() => {
        const drawer = document.querySelector("#sitenav-mobile-menu");
        const bodyOverflow = document.body.style.overflow;
        return {
          drawerVisible: !!drawer,
          bodyOverflow,
        };
      })()`,
      returnByValue: true,
    });

    console.log("  Mobile drawer close via Escape test:", drawerCloseCheck.result?.value);
    report.mobileDrawerCloseEscape = drawerCloseCheck.result?.value;

    // Save report
    const reportPath = path.resolve(qaOutDir, "step6-qa-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n=== QA Complete! Report saved to ${reportPath} ===`);

  } catch (err) {
    console.error("QA Test Error:", err);
  } finally {
    chrome.kill();
  }
}

main().catch(console.error);
