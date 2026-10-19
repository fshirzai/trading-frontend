export class ApiError extends Error {
  constructor(message, status = 0, requestId = "", details) {
    super(message);
    this.status = status;
    this.requestId = requestId;
    this.details = details;
  }
}
export function createApi({
  base = "/api",
  fetcher = (...args) => fetch(...args),
  onExpired = () => {},
} = {}) {
  let accessToken = "",
    refreshTask = null,
    sessionVersion = 0;
  async function send(path, options = {}) {
    const {
      body,
      method = "GET",
      key,
      signal,
      blob = false,
      raw = false,
      retry = true,
    } = options;
    const epoch = sessionVersion,
      hadToken = !!accessToken;
    const timeout =
      typeof AbortSignal !== "undefined" && AbortSignal.timeout
        ? AbortSignal.timeout(20000)
        : undefined;
    const requestSignal =
      signal && timeout && AbortSignal.any
        ? AbortSignal.any([signal, timeout])
        : signal || timeout;
    const headers = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    if (key) headers["Idempotency-Key"] = key;
    if (body !== undefined && !raw)
      headers["Content-Type"] = "application/json";
    Object.assign(headers, options.headers || {});
    let res;
    try {
      res = await fetcher(base + path, {
        method,
        credentials: "include",
        headers,
        body:
          body === undefined ? undefined : raw ? body : JSON.stringify(body),
        signal: requestSignal,
        cache: "no-store",
      });
    } catch (e) {
      if (e.name === "AbortError") throw e;
      throw new ApiError(
        "Cannot reach the backend. Check that it is running and this frontend origin is allowed.",
      );
    }
    if (hadToken && epoch !== sessionVersion)
      throw new ApiError("Session changed; reload this screen", 401);
    if (
      res.status === 401 &&
      retry &&
      accessToken &&
      ![
        "/auth/login",
        "/auth/register",
        "/auth/refresh",
        "/auth/verify-email",
        "/auth/resend-verification",
        "/auth/forgot-password",
        "/auth/reset-password",
      ].includes(path)
    ) {
      await refresh();
      return send(path, { ...options, retry: false });
    }
    if (!res.ok) {
      let data = {};
      try {
        data = await res.json();
      } catch {}
      throw new ApiError(
        data.error || `Request failed (${res.status})`,
        res.status,
        data.requestId,
        data.details,
      );
    }
    if (res.status === 204) return null;
    if(blob)return res.blob();
    try{return await res.json()}catch{throw new ApiError("Backend returned an unexpected response. Check the API connection.",502)}
  }
  async function refresh() {
    if (!refreshTask) {
      const version = sessionVersion;
      const perform = () =>
        send("/auth/refresh", { method: "POST", body: {}, retry: false });
      const locks = typeof navigator !== "undefined" ? navigator.locks : null;
      refreshTask = (
        locks ? locks.request("trading-refresh", perform) : perform()
      )
        .then((x) => {
          if (version !== sessionVersion)
            throw new ApiError("Session changed", 401);
          accessToken = x.accessToken;
        })
        .catch((e) => {
          if (version === sessionVersion) {
            accessToken = "";
            onExpired();
          }
          throw e;
        })
        .finally(() => {
          refreshTask = null;
        });
    }
    return refreshTask;
  }
  return {
    request: send,
    setToken(value) {
      sessionVersion++;
      accessToken = value || "";
    },
    clear() {
      sessionVersion++;
      accessToken = "";
    },
    async restore() {
      await refresh();
      return send("/me");
    },
  };
}
export function safeCheckoutUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.stripe.com"
      ? url.href
      : null;
  } catch {
    return null;
  }
}
