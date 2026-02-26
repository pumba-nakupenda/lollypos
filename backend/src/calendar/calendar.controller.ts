import { Controller, Get, Post, Query, Body, Req, UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @UseGuards(AuthGuard)
  @Get('auth-url')
  getAuthUrl(@Req() req) {
    return { url: this.calendarService.getAuthUrl(req.user.id) };
  }

  @Post('callback')
  async handleCallback(@Body('code') code: string, @Body('userId') userId: string) {
    return this.calendarService.handleCallback(code, userId);
  }

  @UseGuards(AuthGuard)
  @Get('events')
  async listEvents(@Req() req) {
    return this.calendarService.listEvents(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Post('events')
  async createEvent(@Req() req, @Body() eventData: any) {
    return this.calendarService.createEvent(req.user.id, eventData);
  }

  @UseGuards(AuthGuard)
  @Post('sync-customer')
  async syncCustomer(@Req() req, @Body() data: { name: string; date: string }) {
    const event = {
      title: `Relance Prospect: ${data.name}`,
      description: `Rappel automatique généré par Lolly POS pour le suivi client.`,
      start: new Date(data.date).toISOString(),
      end: new Date(new Date(data.date).getTime() + 30 * 60000).toISOString(), // +30 min
    };
    return this.calendarService.createEvent(req.user.id, event);
  }
}
