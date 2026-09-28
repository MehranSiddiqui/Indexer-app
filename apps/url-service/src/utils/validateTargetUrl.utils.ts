import { AppError } from "@rocket/shared";
import ipaddr from "ipaddr.js";
import { lookup } from "node:dns/promises";
import { env } from "../config/env.js";
const MAX_URL_LENGTH = env.MAX_URL_LENGTH;
const DNS_TIMEOUT_MS = 3000;
const availableProtocol = new Set(["http:", "https:"]);
const allowedPorts = new Map([
  ["http:", 80],
  ["https:", 443],
]);

const validatePort = (parseUrl: URL): void => {
  const defaultPort = allowedPorts.get(parseUrl.protocol);
  const currentPort = parseUrl.port ? parseInt(parseUrl.port, 10) : defaultPort;

  if (currentPort !== defaultPort) {
    throw new AppError("Bad request. Port not allowed", 400);
  }
};

const validateCredentials = (parseUrl: URL): void => {
  if (parseUrl.username || parseUrl.password) {
    throw new AppError("Bad request. Credentials not allowed", 400);
  }
};

const validateProtocol = (parseUrl: URL): void => {
  if (!availableProtocol.has(parseUrl.protocol)) {
    throw new AppError("Bad request. Defined protocol of url not allowed", 400);
  }
};

const isPublicIp = (host: string): boolean => {
  let parsed: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    parsed = ipaddr.parse(host);
  } catch {
    return false;
  }

  // ::ffff:127.0.0.1 style addresses: unwrap to plain IPv4 before range check
  if (
    parsed.kind() === "ipv6" &&
    (parsed as ipaddr.IPv6).isIPv4MappedAddress()
  ) {
    parsed = (parsed as ipaddr.IPv6).toIPv4Address();
  }

  return parsed.range() === "unicast";
};

// Returns the hostname that still needs a DNS check, or null for IP literals
const validateHostName = (parseUrl: URL): string | null => {
  let hostName = parseUrl.hostname.toLowerCase().trim();

  if (hostName.startsWith("[") && hostName.endsWith("]")) {
    hostName = hostName.slice(1, -1);
  }

  if (ipaddr.isValid(hostName)) {
    if (!isPublicIp(hostName)) {
      throw new AppError("Bad request. Defined IP not allowed", 400);
    }
    return null;
  }

  if (hostName.endsWith(".")) hostName = hostName.slice(0, -1);

  if (
    hostName === "localhost" ||
    hostName.endsWith(".local") ||
    hostName.endsWith(".localhost") ||
    hostName.endsWith(".internal") ||
    !hostName.includes(".")
  ) {
    throw new AppError("Bad request. Defined hostname not allowed", 400);
  }
  return hostName;
};

const validateResolvedAddresses = async (hostName: string): Promise<void> => {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("DNS lookup timed out")),
      DNS_TIMEOUT_MS,
    );
  });

  try {
    const records = await Promise.race([
      lookup(hostName, { all: true }),
      timeout,
    ]);
    if (
      records.length === 0 ||
      !records.every((record) => isPublicIp(record.address))
    ) {
      throw new AppError("Bad request. Defined hostname not allowed", 400);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Bad request. Hostname could not be resolved", 400);
  } finally {
    clearTimeout(timer);
  }
};

export const validateTargetUrl = async (url: string): Promise<void> => {
  if (!url) throw new AppError("Bad request. Url missing", 400);
  if (url.length > MAX_URL_LENGTH) {
    throw new AppError("Bad request. Url too long", 400);
  }

  let parseUrl: URL;
  try {
    parseUrl = new URL(url);
  } catch {
    throw new AppError("Bad request. Invalid url", 400);
  }

  validateProtocol(parseUrl);
  validatePort(parseUrl);
  validateCredentials(parseUrl);
  const hostToResolve = validateHostName(parseUrl);
  if (hostToResolve) await validateResolvedAddresses(hostToResolve);
};
