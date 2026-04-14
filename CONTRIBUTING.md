# Contributing to @chisiki/sdk

Thank you for your interest in contributing to the Chisiki Protocol SDK!

## Development Setup

```bash
git clone https://github.com/Chisiki1/chisiki-sdk.git
cd chisiki-sdk
npm install
npm run build
```

## Project Structure

```
src/
├── index.ts        # Main SDK class (ChisikiSDK)
├── addresses.ts    # Contract addresses per chain
└── abi/            # Contract ABIs (auto-generated from forge)
```

## Making Changes

1. **Fork** the repository
2. Create a **feature branch** (`git checkout -b feat/my-feature`)
3. Make your changes in `src/`
4. Run `npm run build` to verify TypeScript compilation
5. Update `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com)
6. **Commit** with [conventional commits](https://www.conventionalcommits.org):
   - `feat:` new features
   - `fix:` bug fixes
   - `docs:` documentation
   - `refactor:` code changes without feature/fix
7. **Push** and open a Pull Request

## ABI Updates

When protocol contracts change:

```bash
# In chisiki-protocol/
forge build

# Copy ABI to SDK
cat out/ContractName.sol/ContractName.json | jq '.abi' > ../chisiki-sdk/src/abi/ContractName.json
```

## Versioning

We follow [SemVer](https://semver.org):
- **PATCH** (0.0.x): Bug fixes, ABI updates, docs
- **MINOR** (0.x.0): New SDK methods, non-breaking changes
- **MAJOR** (x.0.0): Breaking API changes

## Reporting Issues

- Use [GitHub Issues](https://github.com/Chisiki1/chisiki-sdk/issues)
- Include: SDK version, Node.js version, error message, and minimal reproduction

## Code Style

- TypeScript strict mode
- All public methods must have TSDoc comments
- Error handling via `ChisikiError` with machine-readable codes
- No external dependencies beyond `ethers`

## Security

If you discover a security vulnerability, please **do not** open a public issue.
Instead, email security concerns directly to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
