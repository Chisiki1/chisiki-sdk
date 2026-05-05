# Release automation

This repository uses two separate mechanisms:

1. **Release Please** creates and updates a release PR after changes land on `main`.
2. **npm Trusted Publishing** lets GitHub Actions publish `@chisiki/sdk` to npm without storing an npm token or using an interactive npm auth link each time.

## Normal flow

1. Merge ordinary feature/fix PRs into `main`.
2. The `Release` workflow creates or updates a Release Please PR.
3. Review the release PR. It should bump `package.json` / `package-lock.json` and update `CHANGELOG.md`.
4. Merge the release PR when ready to publish.
5. Release Please creates the `vX.Y.Z` git tag and GitHub Release.
6. The same `Release` workflow runs `npm ci`, `npm test`, `npm pack --dry-run`, then publishes to npm with:

```bash
npm publish --access public --provenance
```

## Version bump rules

Release Please reads merged commit messages using the Conventional Commits format.

Common examples:

- `fix: correct buyer bond allowance` -> patch release, e.g. `0.5.6` -> `0.5.7`
- `feat: add a new SDK helper` -> minor release, e.g. `0.5.6` -> `0.6.0`
- `feat!: change a public API` or a commit body containing `BREAKING CHANGE:` -> major release

If a merged PR does not use a release-relevant Conventional Commit type, Release Please may leave the release PR unchanged.

## npm Trusted Publishing setup

This must be configured once in the npm web UI for `@chisiki/sdk`.

In npm package settings, add a trusted publisher with these values:

- Provider: `GitHub Actions`
- Organization / owner: `Chisiki1`
- Repository: `chisiki-sdk`
- Workflow filename: `release.yml`
- Environment: leave blank unless this workflow is later changed to use a GitHub Environment

The publish job grants GitHub's OIDC token permission via:

```yaml
permissions:
  contents: read
  id-token: write
```

With trusted publishing enabled, no `NPM_TOKEN` secret and no interactive npm auth link should be required for the release workflow.

## GitHub repository settings

Release Please needs permission to create and update pull requests. If release PRs are not created, check repository settings:

- Settings → Actions → General → Workflow permissions
- Enable `Read and write permissions`
- Allow GitHub Actions to create and approve pull requests, if the setting is present

## Important notes

- Merging an ordinary PR into `main` does **not** immediately publish to npm.
- Ordinary PR merges update the Release Please PR.
- npm publish happens only after the release PR is merged and a GitHub Release is created.
- npm still requires a new semver version for every publish. Release Please handles that version bump in the release PR.
- For protocol/ABI-sensitive releases, review the release PR carefully and keep compatibility proof documents accurate before merging.
