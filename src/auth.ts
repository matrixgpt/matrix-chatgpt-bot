import { fetch } from "undici";
export interface LoginResponse {
  /**
   * An access token for the account.
   * This access token can then be used to authorize other requests.
   */
  access_token: string;
  /**
   * ID of the logged-in device.
   * Will be the same as the corresponding parameter in the request, if one was specified.
   */
  device_id: string;
  /**
   * The fully-qualified Matrix ID for the account.
   */
  user_id: string;
  /**
   * The lifetime of the access token, in milliseconds.
   * Once the access token has expired a new access token can be obtained by using the provided refresh token.
   * If no refresh token is provided, the client will need to re-log in to obtain a new access token.
   * If not given, the client can assume that the access token will not expire.
   */
  expires_in_ms?: number;
  /**
   * A refresh token for the account.
   * This token can be used to obtain a new access token when it expires by calling the /refresh endpoint.
   */
  refresh_token?: string;
  /**
   * The server_name of the homeserver on which the account has been registered.
   * @deprecated Clients should extract the server_name from user_id (by splitting at the first colon) if they require it.
   */
  home_server?: string;
}

export async function clientCredentialsLogin(
  matrixServerUrl: string,
  clientId: string,
  clientSecret: string
) {
  // POST /_matrix/client/v3/login
  const response = await fetch(`${matrixServerUrl}/_matrix/client/v3/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier: {
        type: "globalid.id.client",
        user: clientId,
      },
      password: clientSecret,
      initial_device_display_name: "GlobaliD ChatGPT Bot",
      type: "globalid.login.client_credentials",
    }),
  });

  return response.json() as Promise<LoginResponse>;
}
