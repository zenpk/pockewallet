export type ChallengeVerifier = {
  codeChallenge: string;
  codeVerifier: string;
};

export type LoginReq = {
  clientId: string;
  redirect: string;
  codeChallenge: string;
};

export type AuthorizeReq = {
  codeVerifier: string;
  authorizationCode: string;
};

export type CommonResp = {
  ok: boolean;
  msg: string;
};

export type AuthorizeResp = {
  accessToken: string;
  refreshToken: string;
} & CommonResp;

export type RefreshReq = {
  refreshToken: string;
};

export type RefreshResp = {
  accessToken: string;
} & CommonResp;

export type PublicJwk = {
  kty: string;
  e: string;
  use: string;
  kid: string;
  alg: string;
  n: string;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`POST ${url} failed: ${res.status}`);
  return res.json();
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`GET ${url} failed: ${res.status}`);
  return res.json();
}

function arrayToBase64Url(array: Uint8Array): string {
  let src = "";
  for (const num of array) {
    src += String.fromCharCode(num);
  }
  return btoa(src).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export class MyOAuthSdk {
  constructor(
    private oAuthEndpoint: string,
    private authorizeEndpoint: string,
    private refreshEndpoint: string,
  ) {}

  public async genChallengeVerifier(len: number): Promise<ChallengeVerifier> {
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    const verifier = arrayToBase64Url(bytes);

    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(verifier),
    );
    const challenge = arrayToBase64Url(new Uint8Array(hashBuffer));

    return { codeChallenge: challenge, codeVerifier: verifier };
  }

  public redirectLogin(req: LoginReq) {
    const params = new URLSearchParams({
      clientId: req.clientId,
      redirect: req.redirect,
      codeChallenge: req.codeChallenge,
    });
    window.location.replace(`${this.oAuthEndpoint}/login?${params}`);
  }

  public authorize(codeVerifier: string): Promise<AuthorizeResp> {
    const authorizationCode =
      new URLSearchParams(window.location.search).get("authorizationCode") ??
      "";
    return postJson<AuthorizeResp>(this.authorizeEndpoint, {
      codeVerifier,
      authorizationCode,
    });
  }

  public refresh(refreshToken: string): Promise<RefreshResp> {
    return postJson<RefreshResp>(this.refreshEndpoint, { refreshToken });
  }

  public verify(accessToken: string): Promise<CommonResp> {
    return postJson<CommonResp>(`${this.oAuthEndpoint}/api/auth/verify`, {
      accessToken,
    });
  }

  public getPublicKey(): Promise<PublicJwk> {
    return getJson<PublicJwk>(`${this.oAuthEndpoint}/api/setup/public-key`);
  }
}

export const oAuthSdk = new MyOAuthSdk(
  import.meta.env.VITE_OAUTH_ENDPOINT as string,
  "/api/authorize",
  "/api/refresh",
);
