export type ChallengeVerifier = {
  codeChallenge: string;
  codeVerifier: string;
};

type OidcDiscovery = {
  authorization_endpoint: string;
};

export type LoginReq = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  nonce: string;
  scope?: string;
};

export type AuthorizeReq = {
  codeVerifier: string;
  code: string;
  redirectUri: string;
  state: string;
};

export type CommonResp = {
  ok: boolean;
  msg: string;
};

export type AuthorizeResp = {} & CommonResp;

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

export class MyOAuthOidc {
  private discoveryPromise: Promise<OidcDiscovery> | null = null;

  constructor(
    private issuer: string,
    private authorizeEndpoint: string,
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

  public async redirectLogin(req: LoginReq) {
    const issuer = this.issuer.replace(/\/+$/, "");
    this.discoveryPromise ??= getJson<OidcDiscovery>(
      `${issuer}/.well-known/openid-configuration`,
    );
    const discovery = await this.discoveryPromise;
    const params = new URLSearchParams({
      response_type: "code",
      client_id: req.clientId,
      redirect_uri: req.redirectUri,
      scope: req.scope || "openid profile",
      code_challenge: req.codeChallenge,
      code_challenge_method: "S256",
      state: req.state,
      nonce: req.nonce,
    });
    window.location.replace(`${discovery.authorization_endpoint}?${params}`);
  }

  public authorize(req: AuthorizeReq): Promise<AuthorizeResp> {
    return postJson<AuthorizeResp>(this.authorizeEndpoint, req);
  }
}

export const oAuthSdk = new MyOAuthOidc(
  import.meta.env.VITE_OAUTH_ISSUER as string,
  "/api/authorize",
);
