# Supabase → Honeywell Forge Pipeline Entity Mapping

> Strategic Dimension 2: Data pipeline architecture that maps directly to Honeywell Forge.

## Overview

This document maps the prototype's Supabase PostgreSQL schema to the equivalent entities that would exist in a production Honeywell Forge deployment. The prototype schema is deliberately designed so that migration to Forge involves entity mapping, not restructuring.

## Entity Mapping

| Supabase Table | Forge Entity | Forge Service | Notes |
|---------------|-------------|--------------|-------|
| `pilots` | `TrainingSubject` | Forge Identity | Maps to operator's existing pilot records. `accent_group` and `experience_level` become Forge metadata attributes. |
| `sessions` | `TrainingSession` | Forge Training | Each session maps to a Forge training event with start/end timestamps and device context. |
| `drill_results` | `AssessmentRecord` | Forge Training + Analytics | `metrics_json` → Forge structured assessment fields. `cbta_scores_json` → Forge competency profile. |
| `readback_scores` | `CommunicationAssessment` | Forge Analytics | Per-event granular data feeds Forge analytics pipeline. Confidence tiers map to Forge data quality flags. |
| `cognitive_load_baselines` | `BiometricBaseline` | Forge Health/Performance | Per-pilot baselines stored as Forge time-series entities with versioning. |

## RPC Functions → Forge Analytics

| Supabase RPC | Forge Equivalent | Purpose |
|-------------|-----------------|---------|
| `population_cbta_baseline()` | Forge Analytics Aggregation API | Cohort percentile computation across operator fleet |
| `pilot_percentile_rank()` | Forge Ranking Service | Individual pilot ranking within filtered cohort |

## Data Flow: Prototype → Production

```
Prototype:                          Production:
Browser → Supabase REST     →      Browser → Forge API Gateway
LiveKit Agent → Supabase    →      LiveKit Agent → Forge Ingest Pipeline
Supabase Edge Functions     →      Forge Serverless Functions
Supabase PostgreSQL         →      Forge Time-Series DB + PostgreSQL
Supabase RPC               →      Forge Analytics Engine
```

## Key Considerations

1. **Pilot identity**: Prototype uses trust-based UUID. Production requires Forge Identity SSO integration.
2. **Data sovereignty**: Prototype uses Supabase Cloud (us-west-2). Production Forge deployment must comply with operator's data residency requirements.
3. **Real-time sync**: Prototype uses direct Supabase writes. Production should use Forge event streaming (Kafka/Pulsar) for durability.
4. **Audit trail**: `instructor_override_json` maps to Forge's immutable audit log for regulatory compliance.
