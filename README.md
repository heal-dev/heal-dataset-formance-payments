# Heal sandbox for Formance

## Background

This is a sample test sandbox with specs and tests generated on the open-source PSP orchestration framework [formance](https://github.com/formancehq/payments). It was created with Heal, an agent that turns your codebase into a production-like, testable sandbox, then tests the hell out of it.


## How to run tests

Tests are written in Playwright and can run independently of the heal agent. They use the [heal-playwright-tracer](https://github.com/heal-dev/heal-playwright-tracer) to provide better, easier-to-analyze tracers. To run:

1. Install dependencies `npm i`
2. Run tests `npx playwright test`

## How to add more test coverage

To add more test coverage, get better bug reports, grow the sandbox for more features and add smart mocks:

[Get early access to heal](https://www.heal.dev/). Mention this repo to get fast-tracked!

## Results

A fast, naive pass of heal found [7 bugs](https://github.com/formancehq/payments/issues?q=is%3Aissue%20author%3Amalomarrec%20label%3Abug)
