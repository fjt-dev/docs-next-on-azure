/** The GitHub repository whose issues take translation requests; override with NEXT_PUBLIC_ISSUES_URL (the new-issue page). */
export const newIssueUrl = process.env.NEXT_PUBLIC_ISSUES_URL ?? "https://github.com/fjt-dev/docs-next-on-azure/issues/new";

/** A link to the new-issue page of GitHub with the title and text filled in. */
export function translationIssueUrl(kind: "request" | "contribute", lang: string, route: string, source?: string): string {
  const page = route === "/" ? "/" : route;
  const subject = kind === "request" ? "Translation request" : "Translation contribution";
  const intro =
    kind === "request"
      ? `Please translate this page into ${lang === "ja" ? "Japanese" : lang}.`
      : `I would like to translate this page into ${lang === "ja" ? "Japanese" : lang}.`;
  const body = [intro, "", `Page: /${lang}${page === "/" ? "" : page}`, source ? `Source: ${source}` : undefined].filter((line) => line !== undefined).join("\n");
  const url = new URL(newIssueUrl);
  url.searchParams.set("title", `${subject} (${lang}): ${page}`);
  url.searchParams.set("body", body);
  return url.toString();
}
