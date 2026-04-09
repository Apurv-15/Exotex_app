import { supabase } from '../../config/supabase';
import { Platform } from 'react-native';
import { logger } from '../logging/Logger';

/**
 * PRODUCTION-GRADE ANALYTICS ENGINE
 * 
 * This service provides a unified interface for tracking user behavior.
 * It is designed to be "pluggable" - you can easily add Mixpanel, PostHog, or Firebase
 * by adding them to the 'providers' array.
 */

export type AnalyticsEvent = 
  | 'user_login'
  | 'user_logout'
  | 'sync_started'
  | 'sync_completed'
  | 'sync_failed'
  | 'form_started'
  | 'form_submitted'
  | 'photo_captured'
  | 'error_encountered'
  | 'screen_view';

interface AnalyticsPayload {
  [key: string]: any;
}

class Analytics {
  private static instance: Analytics;
  private isDev = __DEV__;

  private constructor() {}

  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  /**
   * Tracks a user event across all configured production providers.
   * @param event The name of the event (use AnalyticsEvent type for consistency)
   * @param properties Optional metadata about the event
   */
  public async track(event: AnalyticsEvent, properties: AnalyticsPayload = {}) {
    const timestamp = new Date().toISOString();
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id || 'anonymous';

    const enrichedProperties = {
      ...properties,
      distinct_id: userId,
      platform: Platform.OS,
      version: Platform.Version,
      timestamp,
      is_dev: this.isDev
    };

    // 1. Console Log (Dev only)
    if (this.isDev) {
      console.log(`[ANALYTICS] 📊 ${event}`, enrichedProperties);
    }

    // 2. SUPABASE TRACKING (Our custom internal analytics)
    // We store these in a dedicated analytics table for business reporting
    this.persistToInternalAnalytics(event, userId, enrichedProperties);

    // 3. INTEGRATION HOOKS (Add Sentry/Mixpanel/PostHog here)
    if (!this.isDev) {
      this.pushToExternalProviders(event, enrichedProperties);
    }
  }

  /**
   * Identifies a user across all providers (useful after login)
   */
  public async identify(userId: string, traits: AnalyticsPayload = {}) {
    if (this.isDev) {
      console.log(`[ANALYTICS] 👤 Identity Set: ${userId}`, traits);
    }
    
    // In production, this would call sentry.setUser, mixpanel.identify, etc.
  }

  private async persistToInternalAnalytics(event: string, userId: string, properties: any) {
    try {
      // Fire and forget
      supabase
        .from('user_analytics_events')
        .insert({
          event_name: event,
          user_id: userId !== 'anonymous' ? userId : null,
          properties,
          created_at: new Date().toISOString()
        })
        .then(({ error }) => {
          if (error && this.isDev) {
            console.warn('Analytics sync failed', error.message);
          }
        });
    } catch (e) {
      // Never block the UI for analytics failures
    }
  }

  private pushToExternalProviders(event: string, properties: any) {
    // Placeholder for future integrations:
    // Mixpanel.track(event, properties);
    // PostHog.capture(event, properties);
  }
}

export const analytics = Analytics.getInstance();
