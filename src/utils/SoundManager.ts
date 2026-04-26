/**
 * Audio feedback has been removed to avoid shipping foreground-service
 * media playback permissions in the Android build.
 */
export async function playNotifySound(): Promise<void> {
  return;
}
