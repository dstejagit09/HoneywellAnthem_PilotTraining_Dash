# SkySpeak AI – Adaptive Automation Training Scenario

## Scenario: VNAV Descent Conflict with Adaptive ATC

---

## Overview

This training scenario simulates a conflict between ATC instructions and aircraft automation behavior. The system tracks automation state, altitude, and pilot interaction to evaluate automation management performance.

---

## System Requirements

### Core Functionalities

- Real-time ATC interaction (simulated or voice-driven)
- Automation state tracking (VNAV, FLCH, VS)
- Altitude display (current + assigned)
- Button-based interaction for automation modes
- Visual feedback for active automation state (highlighted)
- Ability to adjust altitude (increase/decrease)

---

## UI Components

### 1. Altitude Display

- **Current Altitude:** Displayed numerically (e.g., 14,000 ft)
- **Assigned Altitude:** Displayed next to current altitude (e.g., 8,000 ft)
- Updates dynamically based on system state

---

### 2. Automation Mode Buttons

Buttons:

- VNAV PATH
- FLCH
- VERTICAL SPEED (VS)

Behavior:

- Only one mode can be active at a time
- Active mode is:
  - Highlighted (glow or color change)
  - Visually distinct (e.g., yellow or green)
- Clicking a button:
  - Changes automation state
  - Updates system behavior

---

### 3. Altitude Control Interface

Controls:

- ▲ Increase altitude
- ▼ Decrease altitude

Behavior:

- Adjusts **assigned altitude**
- Triggers system logic:
  - If altitude < constraint → conflict condition
  - If corrected → descent initiated

---

## Scenario Flow

### Step 1 — Initial State

- Mode: VNAV PATH
- Current Altitude: 14,000 ft
- Assigned Altitude: 12,000 ft
- Constraint: 11,000 ft

---

### Step 2 — ATC Instruction

ATC issues:

> “Descend and maintain 8,000”

System updates:
- Assigned Altitude → 8,000 ft

---

### Step 3 — Automation Conflict

Condition:


System state:

- Mode: VNAV PATH
- Aircraft remains level at 14,000 ft

---

### Step 4 — Adaptive ATC Escalation

After delay:

> “Expedite descent, traffic below”

If further delay:

> “Verify altitude immediately”

---

### Step 5 — Pilot Interaction

User must:

1. Select new automation mode:
   - FLCH or VS

2. Confirm altitude:
   - 8,000 ft

System response:

- Descent begins
- Mode updated
- Conflict resolved

---

### Step 6 — Evaluation Metrics

System records:

- Automation Response Time
- Mode Selection Accuracy
- ATC Compliance
- Communication Accuracy (if applicable)

Example output:


---

## Training Objective

Train pilots to:

- Recognize automation intent mismatch
- Intervene appropriately
- Maintain compliance with ATC under pressure

---

