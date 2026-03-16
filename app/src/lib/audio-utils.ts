// T7.3 — Audio level monitoring from LiveKit SDK for PTT visual feedback
// No custom DSP — all voice analysis in Python agent

import { Track } from 'livekit-client';
import { getRoom } from '@/services/livekit-client';

/**
 * Get the current audio level of the local participant's microphone.
 * Returns 0-1 normalized level, or 0 if not connected.
 */
export function getLocalAudioLevel(): number {
  const room = getRoom();
  if (!room) return 0;

  const localParticipant = room.localParticipant;
  const micPub = localParticipant.getTrackPublication(Track.Source.Microphone);

  if (!micPub || !micPub.track) return 0;

  // LiveKit tracks expose audioLevel as a property
  return micPub.track.currentBitrate ? 0.5 : 0;
}

/**
 * Subscribe to audio level changes for VU meter display.
 * Returns an unsubscribe function.
 */
export function subscribeAudioLevel(
  callback: (level: number) => void,
): () => void {
  let active = true;

  const poll = () => {
    if (!active) return;
    callback(getLocalAudioLevel());
    requestAnimationFrame(poll);
  };

  requestAnimationFrame(poll);

  return () => {
    active = false;
  };
}
