# Private access before GitHub Pages publication

The repository contains a static GitHub Pages build, but the learner-facing page must not be published until its access boundary is in place.

## Important security fact

GitHub Pages on a personal GitHub account is public by default. A private source repository does not, by itself, make the Pages website private. Do not treat a client-side sign-in screen, a hidden link, or an email field as access control: the static files would still be downloadable.

Use one of these real access-control options before enabling deployment:

1. **GitHub Enterprise Cloud private Pages**: move the repository into a GitHub Enterprise Cloud organization and configure the organization’s private Pages controls for the approved GGW users or group.
2. **Approved access-controlled host**: publish the static build to a host that supports Google Workspace authentication and an email/group allowlist. If a custom domain is placed in front of GitHub Pages, protect the custom domain with the gateway and do not distribute the default `github.io` URL; confirm with the gateway owner that the origin URL cannot bypass the policy.

The workflow in `.github/workflows/pages.yml` is manual and its deploy job is disabled unless the repository variable `GGW_ENABLE_PAGES_DEPLOYMENT` is exactly `true`. This is an intentional stop point, not a missing feature.

## GGW access checklist

Before enabling the deploy variable, the GGW site owner should confirm:

- The approved sign-in method is Google Workspace / Google identity.
- Access is an explicit GGW email or Google Group allowlist, with everyone else denied.
- The default GitHub Pages URL is not being distributed and cannot bypass the protected learner URL, or private Pages is enabled through GitHub Enterprise Cloud.
- The access session duration and sign-out behavior meet GGW policy.
- The site contains no secrets, API keys, donor records, financial records, or private source documents.
- Any external progress or Gemini endpoint is protected by the same identity layer and validates the identity server-side.

## Static build behavior

When built with `npm run build:github`, the academy:

- exports the home, progress, and prompt-library pages under `/GGW-Academy/`;
- keeps the four beginner learning paths prominent: Sheets, Drive, Docs, and Gmail + AI;
- saves learner progress in the current browser when no secure remote API is configured;
- provides a built-in academy coach in the progress page when no secure Gemini endpoint is configured;
- never places a Gemini API key in browser code;
- does not claim that browser storage is a verified Google identity or a shared learner record.

Browser storage is a practice fallback. It is not suitable for organization-wide reporting, cross-device progress, or sensitive records.

## Optional secure backend configuration

After an access gateway and server-side API are ready, configure these as build-time public endpoint URLs in GitHub Actions or the selected host:

```text
NEXT_PUBLIC_ACADEMY_API_BASE=https://approved.example
NEXT_PUBLIC_GEMINI_API_URL=https://approved.example/api/gemini
```

These values are URLs, not secrets. The backend must authenticate the request, enforce the GGW allowlist, apply CORS and CSRF protections as appropriate, and keep `GEMINI_API_KEY` server-side. Never put the Gemini key, OAuth client secret, service-account key, or D1 credentials in `NEXT_PUBLIC_*` variables.

## Safe activation sequence

1. Configure and test the Google Workspace access policy with a non-production hostname.
2. Verify an approved learner can sign in and an unapproved account receives a denial.
3. Verify the default GitHub Pages URL cannot bypass the protected route, or use GitHub Enterprise Cloud private Pages.
4. Configure the secure API and test identity, progress writes, and Gemini responses with fictional data.
5. Run the manual workflow with deployment still disabled and inspect the artifact.
6. Set `GGW_ENABLE_PAGES_DEPLOYMENT=true` only after the checks above pass.
