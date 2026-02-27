import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { SupabaseService } from '../supabase.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);
  private oauth2Client;

  constructor(
    private supabase: SupabaseService,
    private configService: ConfigService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      `${this.configService.get('NEXT_PUBLIC_SITE_URL')}/calendar/callback`,
    );
    this.logger.log(`Google Calendar Service Initialized. ClientID: ${!!this.configService.get('GOOGLE_CLIENT_ID')} Secret: ${!!this.configService.get('GOOGLE_CLIENT_SECRET')}`);
  }

  getAuthUrl(userId: string) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
      ],
      state: userId,
    });
  }

  async handleCallback(code: string, userId: string) {
    try {
      this.logger.log(`Handling Google callback for user: ${userId}. Code length: ${code?.length}`);
      const { tokens } = await this.oauth2Client.getToken(code);
      this.logger.log(`Tokens received. Refresh token present: ${!!tokens.refresh_token}`);
      
      // We strictly need the refresh token for long-term sync
      if (tokens.refresh_token) {
        const { error } = await this.supabase.getClient()
          .from('user_calendar_settings')
          .upsert({
            user_id: userId,
            google_refresh_token: tokens.refresh_token,
            is_sync_enabled: true,
            last_sync_at: new Date().toISOString(),
          });

        if (error) {
          this.logger.error(`Database UPSERT error: ${error.message}`);
          throw new Error(`Database error: ${error.message}`);
        }
        this.logger.log(`Calendar settings updated successfully for user ${userId}`);
      } else {
        this.logger.warn(`No refresh token received. User might have already authorized. Force prompt might be needed.`);
      }

      return { success: true };
    } catch (err) {
      this.logger.error(`Callback exchange FAILED: ${err.message}`);
      throw err;
    }
  }

  async createEvent(userId: string, eventData: { title: string; description: string; start: string; end: string }) {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: { dateTime: eventData.start, timeZone: 'UTC' },
        end: { dateTime: eventData.end, timeZone: 'UTC' },
      };

      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      return res.data;
    } catch (err) {
      this.logger.error(`Failed to create event: ${err.message}`);
      throw err;
    }
  }

  private async getAuthenticatedClient(userId: string) {
    const { data, error } = await this.supabase.getClient()
      .from('user_calendar_settings')
      .select('google_refresh_token')
      .eq('user_id', userId)
      .single();

    if (error || !data?.google_refresh_token) {
      throw new Error('Google Calendar not linked');
    }

    const client = new google.auth.OAuth2(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
    );

    client.setCredentials({
      refresh_token: data.google_refresh_token,
    });

    return client;
  }

  async listEvents(userId: string) {
    try {
      const auth = await this.getAuthenticatedClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return res.data.items;
    } catch (err) {
      this.logger.error(`Failed to list events: ${err.message}`);
      return [];
    }
  }
}
