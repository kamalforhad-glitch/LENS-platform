import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const projectQaDir = "D:\\downloads\\civic-youth-bangladesh\\lens\\lens_website\\qa-screenshots";
const artifactDir = "C:\\Users\\Mypc\\.gemini\\antigravity\\brain\\6bd6823d-5325-48c6-99ba-c35253963bf3";
const tempUserData = path.join(artifactDir, "scratch", "chrome-profile-qa2");

if (!fs.existsSync(projectQaDir)) {
  fs.mkdirSync(projectQaDir, { recursive: true });
}
if (!fs.existsSync(tempUserData)) {
  fs.mkdirSync(tempUserData, { recursive: true });
}

const VIEWPORTS = [
  { id: "desktop-1440x900", width: 1440, height: 900, mobile: false },
  { id: "laptop-1024x768", width: 1024, height: 768, mobile: false },
  { id: "tablet-768x1024", width: 768, height: 1024, mobile: true },
  { id: "mobile-390x844", width: 390, height: 844, mobile: true },
  { id: "small-mobile-320x700", width: 320, height: 700, mobile: true },
];

async function runQA() {
  const chrome = spawn(chromePath, [
    "--headless=new",
    "--remote-debugging-port=9225",
    `--user-data-dir=${tempUserData}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1440,900",
    "about:blank",
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  const results = {
    consoleErrors: [],
    consoleWarnings: [],
    exceptions: [],
    viewportTests: [],
    rotationVerified: false,
    rotationDifferenceBytes: 0,
    screenshots: [],
  };

  try {
    const listRes = await fetch("http://127.0.0.1:9225/json/list");
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
          results.consoleErrors.push(text);
        } else if (msg.params.type === "warning") {
          results.consoleWarnings.push(text);
        }
      }
      if (msg.method === "Runtime.exceptionThrown") {
        results.exceptions.push(msg.params.exceptionDetails.text);
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
    await send("Log.enable");

    console.log("Navigating to http://localhost:3000...");
    await send("Page.navigate", { url: "http://localhost:3000" });
    await new Promise((r) => setTimeout(r, 4500));

    // Remove cookie banner
    await send("Runtime.evaluate", {
      expression: `
        try { localStorage.setItem("analytics-consent", "true"); } catch(e){}
        document.querySelectorAll("div.fixed").forEach(d => {
          if (d.textContent.includes("Cookie Preferences")) d.remove();
        });
        window.scrollTo(0, 0);
      `,
    });

    // Verify continuous rotation over time
    console.log("Testing continuous rotation over time...");
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 1000));

    // Capture snapshot at t=0
    const snapT0 = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
    // Wait 2.5 seconds while Earth rotates
    await new Promise((r) => setTimeout(r, 2500));
    // Capture snapshot at t=2.5s
    const snapT1 = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });

    const buf0 = Buffer.from(snapT0.result.data, "base64");
    const buf1 = Buffer.from(snapT1.result.data, "base64");
    
    // Compare bytes to verify pixel movement from rotating 3D Earth
    let diffCount = 0;
    const minLen = Math.min(buf0.length, buf1.length);
    for (let i = 0; i < minLen; i++) {
      if (buf0[i] !== buf1[i]) diffCount++;
    }
    diffCount += Math.abs(buf0.length - buf1.length);

    console.log(`Rotation diff bytes between t=0s and t=2.5s: ${diffCount} bytes`);
    if (diffCount > 500) {
      results.rotationVerified = true;
      results.rotationDifferenceBytes = diffCount;
    }

    // Test each viewport
    for (const vp of VIEWPORTS) {
      console.log(`Testing viewport ${vp.id} (${vp.width}x${vp.height})...`);
      await send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: vp.mobile,
      });

      await send("Runtime.evaluate", {
        expression: `
          window.scrollTo(0, 0);
          document.querySelectorAll("div.fixed").forEach(d => {
            if (d.textContent.includes("Cookie Preferences")) d.remove();
          });
        `,
      });

      await new Promise((r) => setTimeout(r, 1500));

      const evalRes = await send("Runtime.evaluate", {
        expression: `
          (() => {
            const heading = document.querySelector("h1");
            const headingRect = heading ? heading.getBoundingClientRect() : null;
            const buttonsContainer = document.querySelector("a[href*='/research']")?.parentElement;
            const buttonsRect = buttonsContainer ? buttonsContainer.getBoundingClientRect() : null;
            
            const leftCol = document.querySelector(".lg\\\\:col-span-7") || document.querySelector("h1")?.parentElement;
            const leftColRect = leftCol ? leftCol.getBoundingClientRect() : null;

            const globeContainer = document.querySelector(".globe-container");
            const globeRect = globeContainer ? globeContainer.getBoundingClientRect() : null;

            const canvas = document.querySelector(".globe-container canvas");
            const canvasRect = canvas ? canvas.getBoundingClientRect() : null;

            // Check if leftCol overlaps globeContainer
            let hasOverlap = false;
            let overlapWidth = 0;
            let overlapHeight = 0;
            if (leftColRect && globeRect) {
              const xOverlap = Math.max(0, Math.min(leftColRect.right, globeRect.right) - Math.max(leftColRect.left, globeRect.left));
              const yOverlap = Math.max(0, Math.min(leftColRect.bottom, globeRect.bottom) - Math.max(leftColRect.top, globeRect.top));
              overlapWidth = xOverlap;
              overlapHeight = yOverlap;
              hasOverlap = (xOverlap > 0) && (yOverlap > 0);
            }

            // Check buttons specifically vs globe
            let buttonsOverlapGlobe = false;
            if (buttonsRect && globeRect) {
              const bx = Math.max(0, Math.min(buttonsRect.right, globeRect.right) - Math.max(buttonsRect.left, globeRect.left));
              const by = Math.max(0, Math.min(buttonsRect.bottom, globeRect.bottom) - Math.max(buttonsRect.top, globeRect.top));
              buttonsOverlapGlobe = (bx > 0) && (by > 0);
            }

            const scrollWidth = document.documentElement.scrollWidth;
            const clientWidth = document.documentElement.clientWidth;
            const hasHorizontalOverflow = scrollWidth > clientWidth;

            // WebGL check
            let webglStatus = "unavailable";
            if (canvas) {
              const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
              if (gl) webglStatus = gl.isContextLost() ? "lost" : "active";
            }

            return {
              viewport: { width: window.innerWidth, height: window.innerHeight },
              hasHorizontalOverflow,
              scrollWidth,
              clientWidth,
              leftColRect: leftColRect ? { left: Math.round(leftColRect.left), right: Math.round(leftColRect.right), top: Math.round(leftColRect.top), bottom: Math.round(leftColRect.bottom), width: Math.round(leftColRect.width), height: Math.round(leftColRect.height) } : null,
              globeRect: globeRect ? { left: Math.round(globeRect.left), right: Math.round(globeRect.right), top: Math.round(globeRect.top), bottom: Math.round(globeRect.bottom), width: Math.round(globeRect.width), height: Math.round(globeRect.height) } : null,
              canvasRect: canvasRect ? { width: Math.round(canvasRect.width), height: Math.round(canvasRect.height) } : null,
              hasOverlap,
              overlapWidth,
              overlapHeight,
              buttonsOverlapGlobe,
              webglStatus,
              globeVisible: !!(globeRect && globeRect.width > 0 && globeRect.height > 0 && canvasRect && canvasRect.width > 0),
            };
          })()
        `,
        returnByValue: true,
      });

      const metrics = evalRes.result?.result?.value;
      console.log(`Metrics for ${vp.id}:`, metrics);

      // Capture screenshot
      const snap = await send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });

      const filename = `${vp.id}.png`;
      const projPath = path.join(projectQaDir, filename);
      const artPath = path.join(artifactDir, filename);
      const buf = Buffer.from(snap.result.data, "base64");

      fs.writeFileSync(projPath, buf);
      fs.writeFileSync(artPath, buf);

      results.viewportTests.push({
        id: vp.id,
        width: vp.width,
        height: vp.height,
        metrics,
        savedPath: projPath,
      });
      results.screenshots.push(projPath);
    }

    ws.close();
  } catch (err) {
    console.error("QA error:", err);
    results.error = err.message;
  } finally {
    chrome.kill();
  }

  fs.writeFileSync(
    path.join(projectQaDir, "qa-report.json"),
    JSON.stringify(results, null, 2)
  );
  console.log("QA Completed. Report saved.");
}

runQA();

