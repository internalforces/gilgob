<!--
Purpose:        Collection-specific method for evidence-based, direct-share job portfolio documents
Owner:          Content Writer and Reviewer
Update Trigger: Portfolio schema, privacy behavior, route contract, or narrative expectations change
Harness Version: 1.1
-->

# Writing Direct-Share Portfolio Documents

Use `content/portfolio/` for a role- and domain-targeted presentation of verified project evidence. A portfolio complements its project document; it does not replace the technical source record.

Start from `content/templates/portfolio.md`. A current example is `content/portfolio/signal-hub.md`.

## Privacy Model

Portfolio routes are direct-share and deliberately excluded from public indexes, Pagefind search, RSS, sitemap, and ordinary site navigation. They use `noindex`, `nofollow`, `noarchive`, and `nosnippet` metadata.

A hard-to-guess `shareId` reduces accidental discovery but is **not authentication**. Anyone who knows the URL can open the published page. Never include secrets, personal identifiers that should remain private, NDA material, private repository details, or claims the user has not approved for disclosure.

## Frontmatter Contract

Portfolio frontmatter is separate from the four indexed collections.

| Field | Required | Rule |
|---|---|---|
| `title` | Yes | Non-empty portfolio title, normally project plus target framing |
| `description` | Yes | Accurate summary of problem, contribution, and value |
| `shareId` | Yes | At least 12 characters; lowercase letters, digits, and single hyphen-separated segments; no slash |
| `project` | Yes | Safe relative slug for the related project document |
| `targetRole` | Yes | Specific intended job role |
| `targetDomains.primary` | Yes | Strongest supported industry or problem domain |
| `targetDomains.subdomains` | Yes | At least one non-empty related domain |
| `period` | Yes | Accurate project period |
| `projectType` | Yes | Accurate type such as personal, team, contract, or work project |
| `role` | Yes | At least one precise contribution statement |
| `tags` | Yes | At least one relevant technology or capability |
| `updated` | Yes | Date of material portfolio revision |
| `draft` | Optional in schema, required by workflow | Keep `true` until disclosure and evidence review are complete |
| `repository` | No | Public HTTPS repository URL |
| `package` | No | Public HTTPS package URL |
| `demo` | No | Public HTTPS demo URL |

Do not add `category`, `created`, `aliases`, `featured`, `slug`, `nextQuestions`, or collection `status` fields to portfolio frontmatter.

## Project Link

`project` is used to build the related technical-document link. Verify that the intended public project route exists and that the slug is exact. A valid-looking value can still create a broken link if there is no matching project document.

## Targeting Standard

- Choose `targetRole` based on the actual work demonstrated.
- Choose one `primary` domain that has the strongest evidence.
- Use subdomains to show adjacent relevance, not to claim unsupported industry experience.
- Write `role` as concrete responsibility and contribution, not generic participation.
- Choose tags that are demonstrated by the narrative and source project.

## Recommended Narrative

Use this six-section structure unless a shorter evidence-driven structure is clearer:

1. **30-second summary:** Problem, system, personal contribution, and verifiable result.
2. **Problem and constraints:** Why the work mattered and what limited the solution.
3. **My scope:** Exact responsibilities and boundaries with other people or systems.
4. **Key technical decisions:** Choices, alternatives, rationale, and trade-offs.
5. **Verification and results:** Tests, releases, artifacts, measurements, or usage that can be checked.
6. **Limits and next improvement:** Honest current boundaries and evidence-based next direction.

Write body headings naturally in Korean for the site's reader experience.

## Evidence Standard

- Verify every version, supported runtime, release, repository, package, demo, and result against current sources.
- Describe team contribution without claiming others' work.
- Do not invent metrics. When a measurement exists, include method, environment, and date.
- Separate delivered behavior from planned improvement.
- Prefer concrete technical decisions and verification over adjective-heavy self-promotion.
- Make limitations visible; honest constraints strengthen credibility.

## Share Identifier Safety

- Generate a sufficiently long, non-semantic random prefix followed by a short project label.
- Use only lowercase alphanumeric segments separated by hyphens.
- Never reuse a `shareId`; duplicate identifiers fail the build.
- Do not encode email, name, employer, target company, or other personal data in the identifier.
- Treat a leaked or widely shared URL as public and replace it only with explicit user approval because the route changes.

## Links

- External action links must use HTTPS.
- Link only public destinations the recipient is allowed to access.
- Confirm the repository, package, and demo match the claims in the body.
- Do not link private issue trackers, internal dashboards, or secret-bearing assets.

## Anti-Patterns

- A generic project README copied into a portfolio.
- Unsupported claims about scale, security, performance, users, revenue, or production use.
- A long technology list with no demonstrated decision or contribution.
- Multiple equally broad primary domains.
- Hiding project limitations or ambiguous personal scope.
- Publishing because the route is unlisted while ignoring disclosure review.
- Treating noindex or a long `shareId` as access control.

## Publication Checklist

- [ ] `shareId` is unique, safe, non-personal, and at least 12 characters.
- [ ] The `project` slug resolves to the intended public technical document.
- [ ] Target role and domains are supported by the evidence.
- [ ] Role statements distinguish personal contribution accurately.
- [ ] Versions, links, releases, results, and measurements are verified.
- [ ] External links are HTTPS and intentionally public.
- [ ] No private, secret, personal, or NDA material is present.
- [ ] The user approves the disclosure and intended recipient context.
- [ ] `draft: false` is set only after that review.
- [ ] Production build confirms the route while public discovery surfaces remain free of portfolio references.
- [ ] Shared publication checks in `README.md` pass.

## Verification

Run the full static quality gate and the route/privacy acceptance tests before publication:

```bash
npm run verify
SITE_URL=https://internalforces.github.io BASE_PATH=/gilgob npm run test:e2e
```

Inspect the generated portfolio page only as build output. Do not edit `dist/`.
