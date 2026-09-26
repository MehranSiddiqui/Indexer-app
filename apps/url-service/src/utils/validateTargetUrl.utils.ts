import { AppError } from "@rocket/shared";
import ipaddr from "ipaddr.js";
const MAX_URL_LENGTH = 2048;
const availableProtocol = new Set(["http:", "https:"]);
const allowedPorts = new Map([
  ["http:", 80],
  ["https:", 443],
]);

const validatePort = async (parseUrl: URL): Promise<void> => {
  const urlPort = parseUrl.port;
  let currentPort;
  if (urlPort) {
    currentPort = parseInt(urlPort, 10);
  } else {
    currentPort = allowedPorts.get(parseUrl.protocol);
    const arePortAllowed = currentPort === allowedPorts.get(parseUrl.protocol);

    if (!arePortAllowed)
      throw new AppError("Bad request. Port not allowed", 400);
  }
};

const validateCredentials = async (parseUrl: URL): Promise<void> => {
  const isEmptyUserName = parseUrl.username;
  const isEmptyPasswordAvailable = parseUrl.password;
  if (!isEmptyUserName && !isEmptyPasswordAvailable) {
    throw new AppError("Bad request. Credentials not available", 400);
  }
};

const validateProtocol = async (parseUrl: URL): Promise<void> => {
  if (!availableProtocol.has(parseUrl.protocol)) {
    throw new AppError("Bad request. Defined protocol of url not allowed", 400);
  }
};
const validateIpLiterals = (host: string): boolean => {
  let parsed: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    parsed = ipaddr.parse(host);
  } catch {
    return false;
  }

  if (
    parsed.kind() === "ipv6" &&
    (parsed as ipaddr.IPv6).isIPv4MappedAddress()
  ) {
    parsed = (parsed as ipaddr.IPv6).toIPv4Address();
  }

  return parsed.range() === "unicast";
};
const normalizeAndValidateHostName = async (parseUrl: URL): Promise<void> => {
  const hostName = parseUrl.hostname;
  const normalizeHostName = hostName.toLowerCase().trim();
  const removeSquareBraces = (): string => {
    if (normalizeHostName.startsWith("[") && normalizeHostName.endsWith("]"))
      return normalizeHostName.slice(1, -1);

    return normalizeHostName;
  };
  const areIPsValid = validateIpLiterals(removeSquareBraces());

  if (areIPsValid) {
    if (
      normalizeHostName === "localhost" ||
      normalizeHostName.endsWith(".local") ||
      normalizeHostName.endsWith(".localhost") ||
      normalizeHostName.endsWith(".internal")
    ) {
      throw new AppError("Bad request. Defined hostname not allowed", 400);
    }
  } else {
    throw new AppError("Bad request. Defined IP not allowed", 400);
  }
};

export const validateTargetUrl = async (url: string): Promise<void> => {
  if (!url) throw new AppError("Bad request. Url missing", 400);
  if (url?.length > MAX_URL_LENGTH) {
    throw new AppError("Bad request. Url too long", 400);
  }
  const parseUrl = new URL(url);
  await validatePort(parseUrl);
  await validateProtocol(parseUrl);
  await validateCredentials(parseUrl);
  await normalizeAndValidateHostName(parseUrl);
};
