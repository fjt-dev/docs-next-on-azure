/** The GitHub repository whose issues take translation requests; override with NEXT_PUBLIC_ISSUES_URL (the new-issue page). */
export const newIssueUrl = process.env.NEXT_PUBLIC_ISSUES_URL ?? "https://github.com/fjt-dev/docs-next-on-azure/issues/new";

/** A link to the new-issue page of GitHub with the title and text filled in. */
export function translationRequestUrl(lang: string, route: string, source?: string): string {
  const language = lang === "ja" ? "Japanese" : lang;
  const body = [`Please translate this page into ${language}.`, "", `Page: /${lang}${route === "/" ? "" : route}`, source ? `Source: ${source}` : undefined]
    .filter((line) => line !== undefined)
    .join("\n");
  const url = new URL(newIssueUrl);
  url.searchParams.set("title", `Translation request (${lang}): ${route}`);
  url.searchParams.set("body", body);
  return url.toString();
}
