import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const qaOutDir = path.resolve("qa-screenshots", "phase2b");
const tempUserData = path.resolve("qa-screenshots", "chrome-profile-phase2b");

if (!fs.existsSync(qaOutDir)) {
  fs.mkdirSync(qaOutDir, { recursive: true });
}
if (!fs.existsSync(tempUserData)) {
  fs.mkdirSync(tempUserData, { recursive: true });
}

const DESKTOP_ROUTES = [
  "/",
  "/about",
  "/about/team",
  "/about/vision",
  "/about/governance",
  "/about/partnerships",
  "/theme",
  "/theme/research",
  "/theme/literature",
  "/courses",
  "/courses/photography",
  "/courses/mojo",
  "/courses/fact-check",
  "/courses/data-journalism",
  "/courses/new-media",
  "/resources",
  "/resources/election",
  "/resources/publications",
  "/resources/media",
  "/resources/other",
  "/contact",
];

const MOBILE_ROUTES = [
  "/",
  "/about",
  "/about/team",
  "/theme",
  "/theme/research",
  "/courses",
  "/courses/photography",
  "/resources",
  "/resources/election",
  "/contact",
];

async function main() {
  console.log("=== Launching Chrome for Browser Visual QA ===");
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9226",
    `--user-data-dir=${tempUserData}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--window-size=1280,800",
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  const report = {
    startedAt: new Date().toISOString(),
    desktopResults: [],
    mobileResults: [],
    navigationCheck: {},
    nestedCmsCheck: {},
    cmsRenderingCheck: {},
    socialCheck: {},
    allConsoleErrors: [],
    allFailedRequests: [],
  };

  try {
    const listRes = await fetch("http://127.0.0.1:9226/json/list");
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
          report.allConsoleErrors.push({ text, timestamp: new Date().toISOString() });
        }
      }
      if (msg.method === "Runtime.exceptionThrown") {
        report.allConsoleErrors.push({
          text: msg.params.exceptionDetails.text,
          exception: msg.params.exceptionDetails.exception?.description,
          timestamp: new Date().toISOString(),
        });
      }
      if (msg.method === "Network.responseReceived") {
        const { response } = msg.params;
        if (response.status >= 400) {
          report.allFailedRequests.push({
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

    // ==========================================
    // 1. DESKTOP VISUAL QA (1280x800)
    // ==========================================
    console.log("\n==========================================");
    console.log("RUNNING DESKTOP QA (1280x800)");
    console.log("==========================================");

    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });

    for (const route of DESKTOP_ROUTES) {
      const url = `http://localhost:3000${route}`;
      console.log(`Testing Desktop: ${route}`);
      await send("Page.navigate", { url });
      await new Promise((r) => setTimeout(r, 2000));

      const evalRes = await send("Runtime.evaluate", {
        expression: `(() => {
          const docW = document.documentElement.scrollWidth;
          const winW = window.innerWidth;
          const hasHOverflow = docW > winW;
          const header = !!document.querySelector("header");
          const footer = !!document.querySelector("footer");
          const hero = !!document.querySelector("section.bg-navy-950, section.relative.overflow-hidden");
          const heroTitle = document.querySelector("h1")?.textContent?.trim() || "";
          const heroEyebrow = document.querySelector("section p.uppercase, section span.uppercase")?.textContent?.trim() || "";
          const breadcrumbs = !!document.querySelector("nav[aria-label='Breadcrumb']");
          const crumbCount = document.querySelectorAll("nav[aria-label='Breadcrumb'] li, nav[aria-label='Breadcrumb'] span").length;
          const subnav = !!document.querySelector("nav[aria-label*='section navigation']");
          const cards = document.querySelectorAll("div.grid a, div.grid div.rounded-3xl, div.grid div.rounded-2xl").length;
          const cta = !!document.querySelector("section a[href='/contact'], section a[href='/donate'], section a[href='/library'], section a[href='/courses']");
          const brokenImages = Array.from(document.images)
            .filter(img => img.naturalWidth === 0 && !img.src.includes('data:'))
            .map(img => img.src);

          return {
            docW,
            winW,
            hasHOverflow,
            header,
            footer,
            hero,
            heroTitle,
            heroEyebrow,
            breadcrumbs,
            crumbCount,
            subnav,
            cards,
            cta,
            brokenImages,
          };
        })()`,
        returnByValue: true,
      });

      const metrics = evalRes.result?.result?.value || evalRes.result?.value || {};
      const slugName = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "_");
      const screenshotFilename = `desktop_${slugName}.png`;
      const screenshotPath = path.join(qaOutDir, screenshotFilename);

      const shot = await send("Page.captureScreenshot", { format: "png" });
      if (shot.result?.data) {
        fs.writeFileSync(screenshotPath, Buffer.from(shot.result.data, "base64"));
      }

      report.desktopResults.push({
        route,
        status: metrics.hasHOverflow ? "OVERFLOW_ERROR" : "PASS",
        metrics,
        screenshot: screenshotFilename,
      });

      console.log(`  -> Title: "${(metrics.heroTitle || "").slice(0, 35)}..." | Overflow: ${metrics.hasHOverflow ? "YES" : "NO"} | Cards: ${metrics.cards} | Subnav: ${metrics.subnav} | Broken Imgs: ${metrics.brokenImages?.length || 0}`);
    }

    // ==========================================
    // 2. MOBILE VISUAL QA (375x812)
    // ==========================================
    console.log("\n==========================================");
    console.log("RUNNING MOBILE QA (375x812)");
    console.log("==========================================");

    await send("Emulation.setDeviceMetricsOverride", {
      width: 375,
      height: 812,
      deviceScaleFactor: 2,
      mobile: true,
    });

    for (const route of MOBILE_ROUTES) {
      const url = `http://localhost:3000${route}`;
      console.log(`Testing Mobile: ${route}`);
      await send("Page.navigate", { url });
      await new Promise((r) => setTimeout(r, 2000));

      const evalRes = await send("Runtime.evaluate", {
        expression: `(() => {
          const docW = document.documentElement.scrollWidth;
          const winW = window.innerWidth;
          const hasHOverflow = docW > winW;
          const header = !!document.querySelector("header");
          const footer = !!document.querySelector("footer");
          const mobileMenuBtn = !!document.querySelector("header button[aria-label*='menu' i], header button svg.lucide-menu");
          const heroTitle = document.querySelector("h1")?.textContent?.trim() || "";
          const heroW = document.querySelector("h1")?.getBoundingClientRect()?.width || 0;
          const subnav = !!document.querySelector("nav[aria-label*='section navigation']");
          const subnavScrollable = (() => {
            const el = document.querySelector("nav[aria-label*='section navigation'] div.overflow-x-auto");
            return el ? el.scrollWidth > el.clientWidth : false;
          })();
          const brokenImages = Array.from(document.images)
            .filter(img => img.naturalWidth === 0 && !img.src.includes('data:'))
            .map(img => img.src);

          return {
            docW,
            winW,
            hasHOverflow,
            header,
            footer,
            mobileMenuBtn,
            heroTitle,
            heroW,
            subnav,
            subnavScrollable,
            brokenImages,
          };
        })()`,
        returnByValue: true,
      });

      const metrics = evalRes.result?.result?.value || evalRes.result?.value || {};
      const slugName = route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "_");
      const screenshotFilename = `mobile_${slugName}.png`;
      const screenshotPath = path.join(qaOutDir, screenshotFilename);

      const shot = await send("Page.captureScreenshot", { format: "png" });
      if (shot.result?.data) {
        fs.writeFileSync(screenshotPath, Buffer.from(shot.result.data, "base64"));
      }

      report.mobileResults.push({
        route,
        status: metrics.hasHOverflow ? "OVERFLOW_ERROR" : "PASS",
        metrics,
        screenshot: screenshotFilename,
      });

      console.log(`  -> Title: "${(metrics.heroTitle || "").slice(0, 30)}..." | Overflow: ${metrics.hasHOverflow ? "YES" : "NO"} | Subnav Scrollable: ${metrics.subnavScrollable}`);
    }

    // ==========================================
    // 3. NAVIGATION QA (Header links & SOON check)
    // ==========================================
    console.log("\n==========================================");
    console.log("RUNNING NAVIGATION & HEADER QA");
    console.log("==========================================");

    // Switch back to desktop for header menu checking
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send("Page.navigate", { url: "http://localhost:3000/about" });
    await new Promise((r) => setTimeout(r, 1500));

    const navEval = await send("Runtime.evaluate", {
      expression: `(() => {
        // Collect all header links
        const links = Array.from(document.querySelectorAll("header a")).map(a => ({
          text: a.textContent.trim().replace(/\\s+/g, " "),
          href: a.getAttribute("href"),
        }));

        // Check for any remaining 'SOON' badges
        const soonBadges = Array.from(document.querySelectorAll("header span, header button, header a"))
          .filter(el => el.textContent.trim().toUpperCase() === "SOON")
          .map(el => el.parentElement?.textContent?.trim() || "SOON");

        return {
          totalHeaderLinks: links.length,
          links: links.slice(0, 40),
          soonBadges,
        };
      })()`,
      returnByValue: true,
    });
    report.navigationCheck = navEval.result?.result?.value || navEval.result?.value || {};
    console.log(`Total header links captured: ${report.navigationCheck.totalHeaderLinks}`);
    console.log(`Remaining SOON badges in header: ${report.navigationCheck.soonBadges?.length || 0}`);
    if (report.navigationCheck.soonBadges?.length > 0) {
      console.log("Badges found:", report.navigationCheck.soonBadges);
    }

    // ==========================================
    // 4. NESTED CMS ROUTE QA
    // ==========================================
    console.log("\n==========================================");
    console.log("RUNNING NESTED CMS ROUTE QA (/courses/photography/documentary-lab)");
    console.log("==========================================");

    const nestedUrl = "http://localhost:3000/courses/photography/documentary-lab";
    await send("Page.navigate", { url: nestedUrl });
    await new Promise((r) => setTimeout(r, 2000));

    const nestedEval = await send("Runtime.evaluate", {
      expression: `(() => {
        const is404 = document.title.includes("404") || document.body.textContent.includes("This page could not be found");
        const h1 = document.querySelector("h1")?.textContent?.trim() || "";
        const crumbs = Array.from(document.querySelectorAll("nav[aria-label='Breadcrumb'] li, nav[aria-label='Breadcrumb'] span")).map(e => e.textContent.trim()).filter(Boolean);
        const hero = !!document.querySelector("section.bg-navy-950");
        const subnav = !!document.querySelector("nav[aria-label*='section navigation']");
        const cards = !!document.querySelector("div.grid");
        const cta = !!document.querySelector("section a[href='/contact'], section a[href='/courses']");

        return {
          url: window.location.href,
          title: document.title,
          is404,
          h1,
          crumbs,
          hero,
          subnav,
          cards,
          cta,
        };
      })()`,
      returnByValue: true,
    });
    report.nestedCmsCheck = nestedEval.result?.result?.value || nestedEval.result?.value || {};

    const shotNested = await send("Page.captureScreenshot", { format: "png" });
    if (shotNested.result?.data) {
      fs.writeFileSync(path.join(qaOutDir, "nested_documentary_lab.png"), Buffer.from(shotNested.result.data, "base64"));
    }
    console.log(`Nested route evaluation: is404=${report.nestedCmsCheck.is404} | Title="${report.nestedCmsCheck.title}" | h1="${report.nestedCmsCheck.h1}"`);

    // ==========================================
    // 5. CMS-DRIVEN RENDERING QA (Content Verification)
    // ==========================================
    console.log("\n==========================================");
    console.log("RUNNING CMS RENDERING & INTEGRATION GAP QA");
    console.log("==========================================");

    // Test /about
    await send("Page.navigate", { url: "http://localhost:3000/about" });
    await new Promise((r) => setTimeout(r, 2000));

    const cmsEval = await send("Runtime.evaluate", {
      expression: `(() => {
        const h1 = document.querySelector("h1")?.textContent?.trim() || "";
        const desc = document.querySelector("section.bg-navy-950 p")?.textContent?.trim() || "";
        const hasHero = !!document.querySelector("section.bg-navy-950");
        const hasSubnav = !!document.querySelector("nav[aria-label*='section navigation']");
        const hasSubsections = !!document.querySelector("section h2") && Array.from(document.querySelectorAll("h2")).some(h => h.textContent.includes("Tracks") || h.textContent.includes("Mission"));
        const hasCta = Array.from(document.querySelectorAll("h2")).some(h => h.textContent.includes("Narrative Ecosystem") || h.textContent.includes("Collaborate"));

        return {
          h1,
          desc,
          hasHero,
          hasSubnav,
          hasSubsections,
          hasCta,
        };
      })()`,
      returnByValue: true,
    });
    report.cmsRenderingCheck = cmsEval.result?.result?.value || cmsEval.result?.value || {};
    console.log("CMS Rendering Check on /about:", report.cmsRenderingCheck);

    // ==========================================
    // 6. HEADER / FOOTER / SOCIAL QA
    // ==========================================
    console.log("\n==========================================");
    console.log("RUNNING SOCIAL MEDIA & FOOTER QA");
    console.log("==========================================");

    const socialEval = await send("Runtime.evaluate", {
      expression: `(() => {
        const socialLinks = Array.from(document.querySelectorAll("footer a[aria-label]")).map(a => ({
          label: a.getAttribute("aria-label"),
          href: a.getAttribute("href"),
          target: a.getAttribute("target"),
        }));
        const footerLinks = Array.from(document.querySelectorAll("footer a")).map(a => ({
          text: a.textContent.trim(),
          href: a.getAttribute("href"),
        }));
        const logo = document.querySelector("footer img");
        const logoSrc = logo?.getAttribute("src") || "";

        return {
          socialLinks,
          footerLinkCount: footerLinks.length,
          logoSrc,
        };
      })()`,
      returnByValue: true,
    });
    report.socialCheck = socialEval.result?.result?.value || socialEval.result?.value || {};
    console.log("Social links captured:", report.socialCheck.socialLinks);

    // Save final report JSON
    const reportPath = path.join(qaOutDir, "browser-qa-report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n=== QA Complete! Report saved to ${reportPath} ===`);

  } catch (err) {
    console.error("QA Error:", err);
  } finally {
    try {
      chrome.kill();
    } catch {}
  }
}

main();
