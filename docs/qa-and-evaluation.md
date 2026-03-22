# QA and Evaluation Strategy

## QA Gate Purpose

QA is not cosmetic editing. It is the release gate for narrative consistency and chapter quality.

## QA Dimensions

### 1. Continuity
- does chapter violate confirmed canon?
- does it contradict character state?
- does it break timeline order?

### 2. Motivation Integrity
- do major character actions match known motives and pressure?
- if behavior changes, is there an in-text trigger?

### 3. Pacing
- does scene sequence feel appropriately distributed?
- does chapter over-compress or stall?

### 4. Style Compliance
- does prose match style profile?
- are POV and tense stable?

### 5. Setup / Payoff Logic
- are important callbacks missing?
- are new hooks introduced cleanly?

## Evidence Rule

Every medium/high severity QA issue must include at least one evidence reference to:
- artifact id / version
- chapter summary
- canon entry key
- relationship state snapshot

## Release Policy

- `pass` or `pass_with_notes` can be user-confirmed
- `revise` requires rewrite or edit
- `block` requires explicit user intervention or major replanning

## Evaluation Suite for Development

### Functional Tests
- packet schema validation
- worker output schema validation
- status transition tests
- confirm projection tests

### Story Tests
- multi-chapter consistency test
- character drift test
- unresolved thread carryover test
- retroactive rule conflict test

## Human Review Rubric

Use a 1-5 score for:
- coherence
- continuity
- readability
- excitement
- controllability

