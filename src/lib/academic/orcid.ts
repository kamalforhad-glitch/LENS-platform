/* eslint-disable @typescript-eslint/no-explicit-any */
const ORCID_API_BASE = "https://pub.orcid.org/v3.0";
const ORCID_MEMBER_API_BASE = "https://api.orcid.org/v3.0";

export interface OrcidPerson {
  name: string;
  givenName: string;
  familyName: string;
  creditName: string | null;
  biography: string | null;
  country: string | null;
  keywords: string[];
  employments: {
    organization: string;
    department: string;
    role: string;
    startDate: string;
    endDate: string | null;
  }[];
  educations: {
    organization: string;
    department: string;
    role: string;
    startDate: string;
    endDate: string | null;
  }[];
  works: {
    title: string;
    type: string;
    publicationDate: string;
    journalTitle: string | null;
    doi: string | null;
    url: string | null;
  }[];
  externalIdentifiers: {
    type: string;
    value: string;
  }[];
}

export interface OrcidSearchResult {
  numFound: number;
  results: {
    orcid: string;
    name: string;
    institution: string;
  }[];
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { Accept: "application/json" };
  const token = process.env.ORCID_ACCESS_TOKEN;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

function formatDate(datePart: any): string {
  if (!datePart) return "";
  const y = datePart.year?.value || "";
  const m = datePart.month?.value || "";
  const d = datePart.day?.value || "";
  return [y, m, d].filter(Boolean).join("-");
}

function extractAffiliation(group: any, summaryKey: string) {
  const summary = group?.summaries?.[0]?.[summaryKey] || {};
  const org = summary?.organization || {};
  const dates = summary?.period || {};
  return {
    organization: org?.name?.value || "",
    department: org?.["disambiguated-organization"]?.["disambiguation-source"] || "",
    role: summary?.["role-title"]?.value || "",
    startDate: formatDate(dates?.["start-date"]),
    endDate: dates?.["end-date"] ? formatDate(dates["end-date"]) : null,
  };
}

export async function fetchOrcidProfile(orcid: string): Promise<OrcidPerson | null> {
  const cleanOrcid = orcid.replace(/[^0-9X-]/g, "");
  if (!/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(cleanOrcid)) {
    return null;
  }

  try {
    const baseUrl = process.env.ORCID_ACCESS_TOKEN ? ORCID_MEMBER_API_BASE : ORCID_API_BASE;
    const res = await fetch(`${baseUrl}/${cleanOrcid}/person`, {
      headers: getHeaders(),
    });

    if (!res.ok) return null;
    const data: any = await res.json();

    const worksRes = await fetch(`${baseUrl}/${cleanOrcid}/works`, {
      headers: getHeaders(),
    });
    const worksData: any = worksRes.ok ? await worksRes.json() : null;

    const person = data?.person || data;
    const name = person?.name || {};
    const biographical = person?.biography || {};
    const addresses = person?.addresses || {};
    const keywords = person?.keywords || {};
    const employments = person?.employments || {};
    const educations = person?.educations || {};
    const externalIds = person?.["external-identifiers"] || {};

    const givenName: string = name?.["given-names"]?.value || "";
    const familyName: string = name?.["family-name"]?.value || "";

    const employmentList = (employments?.["affiliation-group"] || []).map((g: any) =>
      extractAffiliation(g, "employment-summary")
    );

    const educationList = (educations?.["affiliation-group"] || []).map((g: any) =>
      extractAffiliation(g, "education-summary")
    );

    const worksList = (worksData?.group || []).map((group: any) => {
      const work: any = group.work?.[0] || {};
      const title = work?.title || {};
      const journal = work?.["journal-title"] || {};
      const pubDate = work?.["publication-date"] || {};
      const extIds = work?.["external-ids"] || {};
      const doiEntry = (extIds?.["external-id"] || []).find((e: any) => e["external-id-type"] === "doi");
      return {
        title: title?.title?.value || "",
        type: work?.type || "",
        publicationDate: formatDate(pubDate),
        journalTitle: journal?.value || null,
        doi: doiEntry?.["external-id-value"] || null,
        url: work?.url?.value || null,
      };
    });

    const keywordList: string[] = (keywords?.keyword || []).map((k: any) => k.keyword?.value || "");

    const externalIdList = (externalIds?.["external-id"] || []).map((e: any) => ({
      type: e["external-id-type"] || "",
      value: e["external-id-value"] || "",
    }));

    const address: any = (addresses?.address || [])[0] || {};

    return {
      name: `${givenName} ${familyName}`.trim(),
      givenName,
      familyName,
      creditName: name?.["credit-name"]?.value || null,
      biography: biographical?.content || null,
      country: address?.country?.value || null,
      keywords: keywordList,
      employments: employmentList,
      educations: educationList,
      works: worksList,
      externalIdentifiers: externalIdList,
    };
  } catch (error) {
    console.error("[ORCID API Error]", error);
    return null;
  }
}

export async function searchOrcid(query: string): Promise<OrcidSearchResult> {
  if (!query || query.trim().length < 2) {
    return { numFound: 0, results: [] };
  }

  try {
    const res = await fetch(
      `${ORCID_API_BASE}/search/?q=${encodeURIComponent(query)}&rows=10`,
      { headers: getHeaders() }
    );

    if (!res.ok) return { numFound: 0, results: [] };
    const data: any = await res.json();

    const results = (data?.result || []).map((r: any) => {
      const profile: any = r?.["orcid-identifier"] || {};
      const personName: any = r?.person?.name || {};
      const empGroup: any = r?.["activities-summary"]?.employments?.["affiliation-group"] || [];
      const firstOrg: any = empGroup[0]?.summaries?.[0]?.["employment-summary"]?.organization || {};

      return {
        orcid: (profile?.path || "").split("/").pop() || "",
        name: `${personName?.["given-names"]?.value || ""} ${personName?.["family-name"]?.value || ""}`.trim(),
        institution: firstOrg?.name?.value || "",
      };
    });

    return {
      numFound: data?.["num-found"] || 0,
      results,
    };
  } catch (error) {
    console.error("[ORCID Search Error]", error);
    return { numFound: 0, results: [] };
  }
}
