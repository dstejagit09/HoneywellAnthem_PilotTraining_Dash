// T6.9 — ATC engine service
// Calls Supabase Edge Function /atc, sends instruction to agent via data channel

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { sendATCInstruction, sendSetKeywords } from './livekit-client';
import type { ATCContext, ATCInstruction } from '@/types';

/**
 * Generate an ATC instruction via the Claude API proxy Edge Function,
 * then send it to the LiveKit agent for TTS synthesis.
 */
export async function generateAndSpeakATCInstruction(
  context: ATCContext,
): Promise<ATCInstruction | null> {
  // Generate instruction via Edge Function
  const instruction = await generateATCInstruction(context);

  if (!instruction) {
    return null;
  }

  // Send to agent for TTS
  sendATCInstruction(instruction.instruction, instruction.expectedReadback);

  return instruction;
}

/**
 * Call the Supabase Edge Function /atc to generate an ATC instruction via Claude.
 */
export async function generateATCInstruction(
  context: ATCContext,
): Promise<ATCInstruction | null> {
  if (!isSupabaseConfigured()) {
    console.warn('[atc-engine] Supabase not configured, using fallback instruction');
    return createFallbackInstruction(context);
  }

  try {
    const { data, error } = await supabase.functions.invoke('atc', {
      body: {
        facility: context.facility,
        sector: context.sector,
        callsign: context.callsign,
        conversationHistory: context.conversationHistory,
        drillConstraints: context.drill.atcConstraints,
        currentState: {
          altitude: context.altitude,
          heading: context.heading,
          frequency: context.frequency,
          phase: context.flightPhase,
        },
        traffic: context.drill.traffic,
        weather: context.drill.weather,
      },
    });

    if (error) {
      console.error('[atc-engine] Edge function error:', error);
      return createFallbackInstruction(context);
    }

    return data as ATCInstruction;
  } catch (err) {
    console.error('[atc-engine] Failed to generate ATC instruction:', err);
    return createFallbackInstruction(context);
  }
}

/**
 * Send drill-specific keywords to the agent for STT boosting.
 */
export function updateDrillKeywords(keywords: string[]): void {
  sendSetKeywords(keywords);
}

/**
 * Fallback instruction when Edge Function is unavailable.
 * Uses the drill event prompt text directly.
 */
function createFallbackInstruction(context: ATCContext): ATCInstruction {
  return {
    instruction: `${context.callsign}, maintain current altitude and heading.`,
    expectedReadback: `Maintain current altitude and heading, ${context.callsign}`,
    requiredActions: [],
  };
}
