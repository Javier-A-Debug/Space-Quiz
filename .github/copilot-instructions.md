# Copilot instructions

## Project shape and commands

- The app is a single-page quiz in `index.html`; its markup, CSS, question data, and JavaScript are kept together. There is no package manifest or configured build, test, or lint command.
- Run it by opening `index.html` directly in a browser. No server, dependency installation, or build step is required.
- There is no automated or single-test runner. For a browser smoke check, answer both correctly and incorrectly, advance through all ten questions, verify the score and final result, and check the theme toggle.

## Architecture

- The `questions` array is the quiz's source of truth. `renderQuestion()` builds each set of answer buttons from the current entry; `chooseAnswer()` locks that question, updates the score and progress, and shows feedback. `showResults()` replaces the quiz view with the summary, while `restart()` resets in-memory state.
- The UI is updated directly through DOM elements identified by IDs and the small `$` lookup helper. Quiz state is held in JavaScript variables and resets when the page is reloaded.
- CSS custom properties define the light palette in `:root` and the dark palette in `[data-theme="dark"]`. The theme button switches that root attribute; keep styling for both themes aligned when changing colors or components.

## Codebase conventions

- Each question has `category`, `planet`, `question`, `answers`, `correct`, and `fact` fields. `correct` is a zero-based index into `answers`; keep the order and index consistent when editing question content.
- Preserve the quiz's mission-control visual language and its single-file, no-dependency setup.
- Keep accessible behavior in step with UI changes: answer choices and navigation are native buttons, the answer list is a labelled group, feedback and score are announced through live regions, and the progress bar exposes its value. Focus moves to the question heading between questions; retain visible `:focus-visible` styles and the reduced-motion media query.
