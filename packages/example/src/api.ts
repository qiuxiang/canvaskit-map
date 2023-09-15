let accessToken = "";

const baseUrl = "https://cloud.yuanshen.site";

export async function api(
  path: string,
  params: Record<string, any> = {}
): Promise<any> {
  if (!accessToken) {
    await fetchAccessToken();
  }
  const response = await fetch(`${baseUrl}/api/${path}`, {
    method: "post",
    body: JSON.stringify(params),
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
  });
  if (response.status == 401) {
    await fetchAccessToken();
    return api(path, params);
  }
  return (await response.json())["data"];
}

export async function fetchAccessToken() {
  const headers = { authorization: "Basic Y2xpZW50OnNlY3JldA==" };
  const response = await fetch(
    `${baseUrl}/oauth/token?scope=all&grant_type=client_credentials`,
    { method: "post", headers }
  );
  accessToken = (await response.json())["access_token"];
}
