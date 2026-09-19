# Kerala Play — Good First Issues

These are beginner-friendly contribution ideas that can usually be completed without redesigning the entire architecture.

Before starting, read `CONTRIBUTING.md`.

## UI and accessibility

### 1. Improve focus states for buttons and controls

Goal: make keyboard navigation easier to see.

Acceptance criteria:

- interactive controls have a visible focus state;
- mouse/touch appearance is not negatively affected;
- major panels remain readable.

Suggested area: CSS files.

### 2. Standardize small popup/toast spacing

Goal: keep game notifications compact and consistent.

Acceptance criteria:

- toast/popup padding and text sizes are consistent;
- messages do not cover major gameplay controls;
- mobile viewport is tested.

Suggested area: `game.css`, `social.css`, related markup.

### 3. Add accessible labels to icon-only controls

Goal: improve screen-reader and accessibility support.

Acceptance criteria:

- icon-only controls receive useful `aria-label` text;
- labels describe the action, not just the icon.

Suggested area: `index.html` and dynamically-created controls.

## Documentation

### 4. Add a manual two-player test checklist

Goal: document how to test follows, blocks, messages and nearby voice using two browser profiles/devices.

Acceptance criteria:

- clear setup steps;
- expected result for each test;
- includes block/privacy behavior.

### 5. Add Android device test checklist

Goal: create a simple checklist covering touch movement, orientation, microphone permission, performance and resume-from-background behavior.

Suggested references: `MOBILE-ANDROID.md`, `ANDROID-RELEASE.md`.

## Testing

### 6. Add one missing backend validation test

Choose one server rule that is implemented but not currently covered well.

Examples:

- invalid task state;
- duplicate reward request;
- unauthorized social action;
- bad vehicle ownership action.

Acceptance criteria:

- test fails if the validation is removed;
- `npm test` passes with the intended implementation.

Suggested area: `server.test.mjs`.

### 7. Add regression coverage for malformed API input

Goal: verify one API route returns a safe error instead of crashing when it receives missing or malformed fields.

Acceptance criteria:

- no uncaught server exception;
- error response is predictable;
- existing tests continue to pass.

## World polish

### 8. Add a lightweight Kerala-style roadside prop

Examples: bus-stop sign, bench variation, small shop sign, milestone-style marker.

Acceptance criteria:

- asset is original or properly licensed;
- mobile-friendly geometry/material use;
- does not block important roads;
- collision is added only if needed.

Suggested area: `environment.js` / world creation code.

### 9. Improve one location's visual readability

Goal: make an existing gameplay location easier to recognize from a distance without increasing GPU cost significantly.

Examples:

- fuel station;
- service garage;
- village shop;
- job pickup point.

Acceptance criteria:

- location is easier to identify;
- no heavy new dependency;
- mobile performance remains reasonable.

## Contributor workflow

For any task above:

1. Create or claim a GitHub issue.
2. Mention the task number/title.
3. Create a focused branch.
4. Make the smallest useful change.
5. Run `npm test` where applicable.
6. Open a pull request with screenshots for visual changes.

Maintainers can convert these ideas into GitHub issues and apply the `good first issue` label as the contributor community grows.
