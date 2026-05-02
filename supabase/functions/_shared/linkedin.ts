const LINKEDIN_API_BASE_URL = "https://api.linkedin.com";
const LINKEDIN_API_VERSION = Deno.env.get("LINKEDIN_API_VERSION") || "202604";

export interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
  name: string;
  profilePicture: string | null;
}

export interface LinkedInOrganization {
  id: string;
  name: string;
  vanityName: string;
  logo: string | null;
}

export class LinkedInApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "LinkedInApiError";
    this.status = status;
  }
}

async function linkedinRequest<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`${LINKEDIN_API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
      "Linkedin-Version": LINKEDIN_API_VERSION,
    },
  });

  if (!response.ok) {
    const rawBody = await response.text();
    let message = `LinkedIn API request failed with status ${response.status}`;

    try {
      const parsed = JSON.parse(rawBody);
      message =
        parsed.message ||
        parsed.error_description ||
        parsed.serviceErrorCode?.toString() ||
        message;
    } catch {
      if (rawBody) {
        message = rawBody;
      }
    }

    throw new LinkedInApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}

function pickHighestResolutionImage(displayImageElements: any[] | undefined): string | null {
  if (!Array.isArray(displayImageElements)) {
    return null;
  }

  const identifiers = displayImageElements
    .flatMap((element) => element?.identifiers ?? [])
    .filter((identifier) => typeof identifier?.identifier === "string");

  if (identifiers.length === 0) {
    return null;
  }

  const best = identifiers.sort((left, right) => {
    const leftArea = (left.width ?? 0) * (left.height ?? 0);
    const rightArea = (right.width ?? 0) * (right.height ?? 0);
    return rightArea - leftArea;
  })[0];

  return best.identifier ?? null;
}

function parseOrganizationId(organizationUrn: string): string | null {
  const match = organizationUrn.match(/^urn:li:organization:(\d+)$/);
  return match?.[1] ?? null;
}

export async function fetchLinkedInProfile(accessToken: string): Promise<LinkedInProfile> {
  const profile = await linkedinRequest<any>(accessToken, "/v2/userinfo");

  const givenName = profile.given_name ?? "";
  const familyName = profile.family_name ?? "";
  const displayName =
    profile.name ??
    `${givenName} ${familyName}`.trim() ??
    "LinkedIn User";

  return {
    id: profile.sub ?? "",
    localizedFirstName: givenName,
    localizedLastName: familyName,
    name: displayName || "LinkedIn User",
    profilePicture: profile.picture ?? null,
  };
}

export async function fetchLinkedInAdminOrganizations(
  accessToken: string,
): Promise<LinkedInOrganization[]> {
  const aclResponse = await linkedinRequest<any>(
    accessToken,
    "/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED&count=100",
  );

  const adminOrganizationIds = Array.from(
    new Set(
      (aclResponse.elements ?? [])
        .filter((element: any) => element.role === "ADMINISTRATOR")
        .map((element: any) =>
          parseOrganizationId(element.organizationTarget ?? element.organization ?? ""),
        )
        .filter(Boolean),
    ),
  ) as string[];

  const organizations = await Promise.all(
    adminOrganizationIds.map(async (organizationId) => {
      const organization = await linkedinRequest<any>(
        accessToken,
        `/rest/organizations/${organizationId}`,
      );

      const logo =
        pickHighestResolutionImage(organization?.logoV2?.["original~"]?.elements) ??
        pickHighestResolutionImage(organization?.logoV2?.["displayImage~"]?.elements);

      return {
        id: String(organization.id ?? organizationId),
        name: organization.localizedName ?? "LinkedIn Page",
        vanityName: organization.vanityName ?? "",
        logo,
      } satisfies LinkedInOrganization;
    }),
  );

  return organizations;
}
