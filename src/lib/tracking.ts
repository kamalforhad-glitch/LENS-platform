export function trackFormInteraction(
  formName: string,
  action: "start" | "submit" | "error"
) {
  if (typeof window === "undefined") return;

  if (window.dataLayer) {
    window.dataLayer.push([
      "event",
      `form_${action}`,
      { form_name: formName },
    ]);
  }
  if (window._fbq) {
    window._fbq("trackCustom", `Form${action.charAt(0).toUpperCase() + action.slice(1)}`, {
      form_name: formName,
    });
  }
}

export function trackFileDownload(fileName: string, fileType: string) {
  if (typeof window === "undefined") return;

  if (window.dataLayer) {
    window.dataLayer.push([
      "event",
      "file_download",
      { file_name: fileName, file_type: fileType },
    ]);
  }
}

export function trackCTAClick(ctaName: string, ctaLocation: string) {
  if (typeof window === "undefined") return;

  if (window.dataLayer) {
    window.dataLayer.push([
      "event",
      "cta_click",
      { cta_name: ctaName, cta_location: ctaLocation },
    ]);
  }
  if (window._fbq) {
    window._fbq("track", "ViewContent", {
      content_name: ctaName,
      content_category: ctaLocation,
    });
  }
}
