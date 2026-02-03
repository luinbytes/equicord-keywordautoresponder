# Contributing to KeywordNotify

Thank you for your interest in contributing to KeywordNotify! This document provides guidelines and instructions for contributing to this Vencord/Equicord plugin.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [pnpm](https://pnpm.io/) or [npm](https://www.npmjs.com/)
- [Vencord](https://vencord.dev/) or [Equicord](https://equicord.com/) installed and working
- Basic knowledge of:
  - TypeScript/JavaScript
  - React
  - Discord client modding

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/luinbytes/equicord-keywordautoresponder.git
   cd equicord-keywordautoresponder
   ```

2. **Install dependencies** (if you add dependencies in the future):
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Build and test**:
   - Copy `index.tsx` and `style.css` to your Vencord plugins folder
   - Reload Discord or restart
   - Enable the plugin in Settings → Vencord → Plugins

4. **Development workflow**:
   - Edit `index.tsx` and `style.css`
   - Reload Discord (Ctrl+R) to see changes
   - Test thoroughly before submitting

## Code Style Guidelines

### TypeScript
- Use TypeScript for type safety
- Define interfaces for all data structures
- Avoid `any` type when possible
- Use proper type assertions with care

### React
- Use functional components with hooks
- Keep components focused and small
- Use `classNameFactory` from Vencord utils for CSS classes
- Follow React best practices (hooks rules, etc.)

### General
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions short and focused
- Follow existing code structure and style

## Testing

### Manual Testing
Since this is a Vencord plugin, automated testing is limited. Manual testing is crucial:

1. **Test keyword matching**:
   - Add various regex patterns
   - Test case sensitivity toggle
   - Verify blacklist/whelist filtering

2. **Test notifications**:
   - Verify keywords tab shows matches
   - Check message jumping works
   - Test log clearing functionality

3. **Test edge cases**:
   - Empty regex patterns
   - Invalid regex patterns
   - Large keyword lists
   - Special characters in regex

### Test Checklist Before Submitting
- [ ] Plugin loads without errors in console
- [ ] Keywords match as expected
- [ ] Notifications appear in Keywords tab
- [ ] Blacklist/whitelist filters work correctly
- [ ] Settings persist across Discord restarts
- [ ] No memory leaks (watch console)
- [ ] UI renders correctly in all tested scenarios

## Submitting Changes

### Pull Request Process

1. **Fork the repository** and create your branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and test thoroughly

3. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push to your fork** and submit a PR:
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Convention

Use clear, descriptive commit messages:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring (no functional change)
- `style:` - Code style changes (formatting, etc.)
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Example:
```
feat: add support for multiple regex patterns per keyword
```

### Pull Request Description

Include in your PR:
- Clear description of changes
- Reason for the change
- Testing performed
- Screenshots if UI changes
- Related issues (if any)

Example:
```
## Changes
- Added support for multiple regex patterns per keyword entry
- Updated UI to show multiple pattern inputs
- Added validation for empty patterns

## Testing
- Tested with single and multiple patterns
- Verified patterns work with case sensitivity
- Checked blacklist/whitelist filtering

## Related Issues
Fixes #42
```

## Code of Conduct

- Be respectful and constructive
- Focus on what is best for the community
- Show empathy towards other community members
- Accept feedback gracefully
- Help others when possible

## Reporting Bugs

When reporting bugs, please include:
- **Environment**: Vencord or Equicord version
- **Discord version**: Desktop or Web, version number
- **Steps to reproduce**: Clear, step-by-step instructions
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots/logs**: If applicable
- **Additional context**: Any other relevant information

Use the [issue template](.github/ISSUE_TEMPLATE/bug_report.md) when reporting bugs.

## Suggesting Features

Feature suggestions are welcome! Please include:
- **Problem statement**: What problem does this solve?
- **Proposed solution**: How should it work?
- **Alternatives considered**: What other approaches did you think about?
- **Additional context**: Examples, mockups, references

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) when suggesting features.

## Questions?

Feel free to:
- Open an issue for questions
- Join the [Vencord Discord](https://discord.gg/vencord)
- Join the [Equicord Discord](https://discord.gg/equicord)

Happy contributing! ✨
