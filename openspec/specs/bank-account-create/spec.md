# Create Bank Account

## Purpose

_(no summary specced)_

_Source: `payments/internal/api/v3/router.go:40-40`, `payments/internal/api/v3/handler_bank_accounts_create.go:29-70`, `payments/QA_PLAYBOOK.MD:9-9`_

## Requirements

### Requirement: Create a bank account

The system SHALL let the Ops Engineer register an external bank account.

_Source: `payments/internal/api/v3/handler_bank_accounts_create.go:29-70`, `payments/QA_PLAYBOOK.MD:9-9`_ · _Reference test: `sandbox/e2e/flows/bank-account-create.spec.ts`_

#### Scenario: Create a bank account — happy path

- GIVEN the Ops Engineer on the app

### Requirement: Ops Engineer creates a bank account with a name and an IBAN (POST /v3/bank-accounts)

When the Ops Engineer creates a bank account with a name and an IBAN (POST /v3/bank-accounts), the system SHALL create it (201) and return its id in {data}, and it SHALL appear in GET /v3/bank-accounts with fields id, createdAt, name, country, metadata, relatedAccounts. [CRAWL-CONFIRMED: 201 → {data:<uuid>}; NOTE the sensitive fields iban/accountNumber/swiftBicCode read back as null in the list (encrypted at rest) — assert by id/name/country, not by echoed iban.]

_Source: `payments/internal/api/v3/handler_bank_accounts_create.go:52-69`_

#### Scenario: Ops Engineer creates a bank account with a name and an IBAN (POST /v3/bank-accounts)

- GIVEN the Ops Engineer in the “Create a bank account” flow
- WHEN the Ops Engineer creates a bank account with a name and an IBAN (POST /v3/bank-accounts)
- THEN the system shall create it (201) and return its id in {data}, and it shall appear in GET /v3/bank-accounts with fields id, createdAt, name, country, metadata, relatedAccounts. [CRAWL-CONFIRMED: 201 → {data:<uuid>}; NOTE the sensitive fields iban/accountNumber/swiftBicCode read back as null in the list (encrypted at rest) — assert by id/name/country, not by echoed iban.]

### Requirement: Bank account is created without a name

When the bank account is created without a name, the system SHALL reject it with 400 VALIDATION (name is required). [CRAWL-CONFIRMED: 400 {errorCode:VALIDATION, 'Name is a required field'}.]

_Source: `payments/internal/api/v3/handler_bank_accounts_create.go:19-19`_ · _Reference test: `sandbox/e2e/scenarios/bank-account-create/BC-validation-guards.spec.ts`_

#### Scenario: Bank account is created without a name

- GIVEN the Ops Engineer in the “Create a bank account” flow
- WHEN the bank account is created without a name
- THEN the system shall reject it with 400 VALIDATION (name is required). [CRAWL-CONFIRMED: 400 {errorCode:VALIDATION, 'Name is a required field'}.]

### Requirement: Bank account is created with neither an accountNumber nor an IBAN

When the bank account is created with neither an accountNumber nor an IBAN, the system SHALL reject it with 400 VALIDATION (one of accountNumber/IBAN is required). [CRAWL-CONFIRMED: 400 {errorCode:VALIDATION, 'AccountNumber is a required field'}.]

_Source: `payments/internal/api/v3/handler_bank_accounts_create.go:21-22`_ · _Reference test: `sandbox/e2e/scenarios/bank-account-create/BC-validation-guards.spec.ts`_

#### Scenario: Bank account is created with neither an accountNumber nor an IBAN

- GIVEN the Ops Engineer in the “Create a bank account” flow
- WHEN the bank account is created with neither an accountNumber nor an IBAN
- THEN the system shall reject it with 400 VALIDATION (one of accountNumber/IBAN is required). [CRAWL-CONFIRMED: 400 {errorCode:VALIDATION, 'AccountNumber is a required field'}.]

### Requirement: Bank account is created with an IBAN shorter than 15 characters

When the bank account is created with an IBAN shorter than 15 characters, the system SHALL reject it with 400 VALIDATION (IBAN length constraint). [CRAWL-CONFIRMED: 400 {errorCode:VALIDATION, 'IBAN must be at least 15 characters in length'}.]

_Source: `payments/internal/api/v3/handler_bank_accounts_create.go:22-22`_ · _Reference test: `sandbox/e2e/scenarios/bank-account-create/BC-validation-guards.spec.ts`_

#### Scenario: Bank account is created with an IBAN shorter than 15 characters

- GIVEN the Ops Engineer in the “Create a bank account” flow
- WHEN the bank account is created with an IBAN shorter than 15 characters
- THEN the system shall reject it with 400 VALIDATION (IBAN length constraint). [CRAWL-CONFIRMED: 400 {errorCode:VALIDATION, 'IBAN must be at least 15 characters in length'}.]

### Requirement: A bank account is created with an invalid ISO country code (Country fails the country_code validator)

When a bank account is created with an invalid ISO country code (Country fails the country_code validator), the system SHALL reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST /v3/bank-accounts {name, iban, country:'XX'} → 400 {errorCode:VALIDATION, errorMessage:"...Country... failed on the 'country_code' tag"}; a valid country 'DE' → 201.]

_Source: `payments/internal/api/v3/handler_bank_accounts_create.go:24-24`_ · _Reference test: `sandbox/e2e/scenarios/bank-account-create/BC-validation-guards-2.spec.ts`_

#### Scenario: A bank account is created with an invalid ISO country code (Country fails the country_code validator)

- GIVEN the Ops Engineer in the “Create a bank account” flow
- WHEN a bank account is created with an invalid ISO country code (Country fails the country_code validator)
- THEN the system shall reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST /v3/bank-accounts {name, iban, country:'XX'} → 400 {errorCode:VALIDATION, errorMessage:"...Country... failed on the 'country_code' tag"}; a valid country 'DE' → 201.]

### Requirement: A bank account is created with an IBAN longer than 31 characters (fails the lte=31 validator)

When a bank account is created with an IBAN longer than 31 characters (fails the lte=31 validator), the system SHALL reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST with a 40-char alphanum IBAN → 400 {errorCode:VALIDATION, errorMessage:'IBAN must be at maximum 31 characters in length'}.]

_Source: `payments/internal/api/v3/handler_bank_accounts_create.go:22-22`_ · _Reference test: `sandbox/e2e/scenarios/bank-account-create/BC-validation-guards-2.spec.ts`_

#### Scenario: A bank account is created with an IBAN longer than 31 characters (fails the lte=31 validator)

- GIVEN the Ops Engineer in the “Create a bank account” flow
- WHEN a bank account is created with an IBAN longer than 31 characters (fails the lte=31 validator)
- THEN the system shall reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST with a 40-char alphanum IBAN → 400 {errorCode:VALIDATION, errorMessage:'IBAN must be at maximum 31 characters in length'}.]

### Requirement: A bank account is created with a swiftBicCode shorter than 8 characters (fails the gte=8 validator)

When a bank account is created with a swiftBicCode shorter than 8 characters (fails the gte=8 validator), the system SHALL reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST with swiftBicCode:'AB' → 400 {errorCode:VALIDATION, errorMessage:'SwiftBicCode must be at least 8 characters in length'}.]

_Source: `payments/internal/api/v3/handler_bank_accounts_create.go:23-23`_ · _Reference test: `sandbox/e2e/scenarios/bank-account-create/BC-validation-guards-2.spec.ts`_

#### Scenario: A bank account is created with a swiftBicCode shorter than 8 characters (fails the gte=8 validator)

- GIVEN the Ops Engineer in the “Create a bank account” flow
- WHEN a bank account is created with a swiftBicCode shorter than 8 characters (fails the gte=8 validator)
- THEN the system shall reject it with 400 VALIDATION. [CRAWL-CONFIRMED 2026-06-24: POST with swiftBicCode:'AB' → 400 {errorCode:VALIDATION, errorMessage:'SwiftBicCode must be at least 8 characters in length'}.]
