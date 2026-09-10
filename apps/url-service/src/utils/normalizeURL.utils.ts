export const normalizeURL = (url: string): string => {
  const parsedUrl = new URL(url);

  const ignoreParams = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content", // Google Analytics
    "fbclid",
    "gclid",
    "wbraid",
    "gbraid", // Ad trackers
    "ref",
    "source",
    "clickid",
    "affiliate", // Common affiliate tags
  ];

  ignoreParams.forEach((param) => parsedUrl.searchParams.delete(param));

  parsedUrl.searchParams.sort();

  const lowerCaseDomain = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname;

  const strippedUrl = lowerCaseDomain.startsWith("www.")
    ? lowerCaseDomain.slice(4)
    : lowerCaseDomain;
  const strippedTrailingSlash = pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
  return `${strippedUrl}${strippedTrailingSlash}${
    parsedUrl.searchParams.toString()
      ? `?${parsedUrl.searchParams.toString()}`
      : ""
  }`;
};
