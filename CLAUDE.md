# Honeywell Anthem Cockpit — Pilot Training Solution Design

## Project Purpose

We are designing an optimal training system to bring pilots to proficiency on Honeywell's Anthem cockpit as quickly and safely as possible — without introducing friction into the training process that undermines learning outcomes, instructor workflows, or regulatory compliance.

Two research reports provide the analytical foundation. They examine the same core challenge — transitioning pilots to a next-generation flight deck — from complementary angles:

- **Report A** ("FAA frameworks, industry practices, and the AI frontier in avionics transition training") focuses on the regulatory architecture, industry training ecosystem, and the structural gaps that block AI-driven training from receiving formal credit.
- **Report B** ("Automated pilot evaluation through AI-driven ATC voice analysis") focuses on using AI-based voice and communication analysis to objectively assess pilot performance, extract cognitive load indicators, and map automated metrics to ICAO competency frameworks.

Together, these reports define both the **what** (the training structure, regulatory constraints, and delivery infrastructure) and the **how** (the measurement, assessment, and adaptive feedback mechanisms) of an Anthem training solution.

---

## Domain Context

### What is Honeywell Anthem?

Anthem is a clean-sheet, cloud-native integrated flight deck — Honeywell's first new core avionics architecture in over two decades. Key characteristics that make it a unique training challenge:

- **Touch-first interface** eliminating traditional buttons, knobs, and mode selection panels
- **Always-on cloud connectivity** via the Integrated Network Server Unit (SATCOM, cellular, Wi-Fi, Bluetooth)
- **Pilot-customizable display layouts** replacing fixed OEM-defined arrangements
- **PilotPredict** AI-driven smart scratchpad that anticipates pilot inputs
- **Connected Mission Manager** that proactively pushes information by flight phase
- **System-on-chip smart displays** versus Epic's modular virtual backplane network

Anthem is **not yet FAA-certified** as of March 2026. No production business jet currently uses it. The bridging product — **Primus Epic 3.0** (launching 2026) — incorporates Anthem-like features into the existing Epic architecture.

### Who are the target pilots?

Primarily business aviation pilots operating under Part 91 and Part 135, transitioning from legacy Primus EPIC or other avionics suites. These pilots face a paradigm shift in cockpit interaction philosophy — from knob-and-button hardware controls to touch-first, AI-assisted, cloud-connected workflows.

### Why does training matter so much here?

The EPIC-to-Anthem transition is not incremental. It is an architectural generation change. Historical data shows 73% of pilots have inadvertently selected wrong automation modes, and insufficient crew knowledge of automated systems was a factor in more than one-third of accidents and serious incidents. Getting training wrong creates safety risk. Getting training right — fast, frictionless proficiency — is the entire objective.

---

## Multi-Agent Debate Protocol

This project uses three Claude Code agents in a structured adversarial debate to stress-test ideas, identify friction points, and converge on the strongest possible training solution.

### Agent Roles

| Agent | Role | Context | Objective |
|-------|------|---------|-----------|
| **Agent 1 — Advocate A** | Regulatory & Infrastructure Strategist | Report A ONLY | Argue for the best training solution from the perspective of regulatory pathways, simulator infrastructure, industry delivery models, and the SFAR/AQP innovation framework |
| **Agent 2 — Advocate B** | Assessment & Measurement Architect | Report B ONLY | Argue for the best training solution from the perspective of AI-driven assessment, voice-based cognitive load monitoring, CBTA competency mapping, and automated evaluation |
| **Team Lead — The Judge** | Evaluator & Synthesizer | BOTH Reports | Score arguments, identify blind spots, catch friction points, and produce the final synthesis document |

### Context Isolation Rules

- Agent 1 must NOT read or reference Report B
- Agent 2 must NOT read or reference Report A
- The Judge has access to both reports and scores arguments against the full evidence base
- Agents may challenge each other's claims but must argue from their own report's evidence

### Debate Structure

**Round 1 — Opening Arguments**
Each advocate presents their core thesis: What is the most critical element of an effective Anthem training system, and why does their report's angle provide the essential foundation?

**Round 2 — Cross-Examination**
Each advocate challenges the other's position. Key questions to surface:
- What does the other approach miss?
- What friction would it introduce?
- What assumptions does it make that may not hold?

**Round 3 — Refined Positions**
Each advocate incorporates valid criticisms and strengthens their argument. The Judge scores each argument from Rounds 1–3.

**Final Synthesis — Judge produces the deliverable**

---

## Scoring Rubric (Judge Use Only)

The Judge evaluates every argument on these five dimensions, scored 1–5:

| Criterion | What It Measures | 5 = Excellent | 1 = Poor |
|-----------|-----------------|---------------|----------|
| **Relevance to Anthem** | Does this directly apply to the Anthem cockpit's unique characteristics (touch-first, cloud-native, AI-assisted)? | Addresses Anthem-specific challenges head-on | Generic aviation training argument with no Anthem specificity |
| **Friction Reduction** | Does this reduce friction in the training process for pilots, instructors, operators, and regulators? | Actively removes barriers at multiple levels | Introduces new friction or ignores existing friction |
| **Path to Proficiency** | Does this accelerate the time-to-proficiency for pilots transitioning to Anthem? | Clear, measurable acceleration mechanism | No impact on proficiency timeline or actively slows it |
| **Regulatory Viability** | Is this achievable within FAA/EASA frameworks (current or near-term)? | Clear pathway under existing or pending regulation | Requires regulatory changes with no visible pathway |
| **Evidence Quality** | Is the argument grounded in specific data, precedent, or validated research from the report? | Cites specific studies, numbers, or regulatory provisions | Speculative or unsupported assertion |

### Friction Watchlist

The Judge must specifically flag if any proposed element would introduce friction in these areas:

- **Pilot friction**: Adds cognitive burden, unfamiliar assessment methods, surveillance anxiety, or technology distrust
- **Instructor friction**: Undermines instructor authority, adds workload without value, or requires skills instructors don't have
- **Operator friction**: Excessive cost, infrastructure requirements, or scheduling complexity for Part 91/135 operators
- **Regulatory friction**: Requires approvals that don't exist and have no clear pathway, or conflicts with existing Part 60/142 frameworks
- **Training continuity friction**: Creates a training approach that doesn't bridge naturally from Epic 3.0 to full Anthem

---

## Final Deliverable Specification

The Judge produces a single polished document after the debate concludes:

### Structure

1. **Executive Summary** — The recommended Anthem training approach in 500 words or fewer
2. **The Problem** — Why Anthem demands a fundamentally different training approach (grounded in both reports)
3. **Training Architecture** — The integrated solution combining regulatory strategy and assessment technology
4. **Friction Analysis** — Every identified friction point and its mitigation
5. **Phased Implementation** — How Epic 3.0 bridges to full Anthem training, with regulatory milestones
6. **Assessment Framework** — How pilot proficiency is measured, with specific KPIs and CBTA mapping
7. **Regulatory Pathway** — The concrete steps to achieve FAA/EASA credit for the proposed approach
8. **Risk Register** — What could go wrong and how to manage it
9. **Competitive Positioning** — How this positions Honeywell against FlightSafety FlightSmart, CAE Rise, and APC PROJECT ORCA

### Quality Standards

- Every claim must trace back to specific evidence from one or both reports
- No assertion without a regulatory reference, research citation, or industry precedent
- Friction points must be explicitly addressed, not hand-waved
- The document must be actionable by a Honeywell product team, not an academic exercise

---

## Key Terms & Acronyms

| Term | Definition |
|------|-----------|
| **AQP** | Advanced Qualification Program (Part 121 Subpart Y) — the most promising FAA framework for training innovation |
| **CBTA** | Competency-Based Training and Assessment — ICAO/IATA methodology emphasizing demonstrated proficiency over fixed hours |
| **EBT** | Evidence-Based Training — ICAO Doc 9995 framework for data-driven training design |
| **FSB** | Flight Standardization Board — FAA body that determines training difference levels for aircraft variants |
| **FSTD** | Flight Simulation Training Device — umbrella term for simulators and flight training devices |
| **MDR/ODR** | Master/Operator Differences Requirements — FSB-specified training differences between aircraft variants |
| **Part 60** | FAA regulation governing FSTD qualification — currently deterministic, no AI provisions |
| **Part 142** | FAA regulation governing training centers — static curriculum model |
| **SFAR** | Special Federal Aviation Regulation — mechanism used to introduce AQP as a regulatory sandbox |
| **WER** | Word Error Rate — key metric for speech recognition accuracy in aviation communications |
| **HAAWAII** | SESAR-funded project achieving state-of-the-art aviation speech recognition (<5% WER controllers, <10% pilots) |
| **NPA 2025-07** | EASA's first regulatory proposal addressing AI trustworthiness in aviation |
| **Epic 3.0** | Honeywell's bridging product incorporating Anthem-like features into existing Epic architecture |
| **PilotPredict** | Anthem's AI-driven smart scratchpad that anticipates pilot inputs |
| **F0** | Fundamental frequency — the strongest single voice indicator of cognitive load |

---

## Constraints & Ground Rules

- The training solution must work for **Part 91 and Part 135 operators** — AQP (Part 121 only) cannot be assumed as the default pathway
- **Instructor authority is non-negotiable** — any AI assessment must be a decision-support tool, not an autonomous grader
- The solution must account for the fact that **Anthem is not yet certified** and no FSB activity, qualified FTD, or formal transition syllabus exists
- **Epic 3.0 as a bridge** must be explicitly leveraged — the training approach should build progressively from Epic → Epic 3.0 → Anthem
- The accent problem in pilot speech recognition (current ~8–10% WER for pilots vs 3–5% for controllers) must be honestly addressed, not minimized
- The solution should position Honeywell competitively but must remain **technically honest** about what is achievable today versus what requires further development
- All proposed regulatory pathways must reference **specific regulations, advisory circulars, or rulemaking activities** — no vague "the FAA should allow this" arguments
