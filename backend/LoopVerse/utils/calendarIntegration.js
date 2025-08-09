const { google } = require('googleapis');
const ical = require('ical-generator');
const fs = require('fs');
const path = require('path');

/**
 * Calendar Integration Utilities
 * Provides functions to integrate with popular calendar systems
 */
const calendarIntegration = {
  /**
   * Generate an iCalendar file for a session
   * @param {Object} session - The session object
   * @returns {String} - Path to the generated .ics file
   */
  generateICalFile: (session) => {
    try {
      const calendar = ical({
        domain: 'loopverse.com',
        prodId: { company: 'LoopVerse', product: 'MentoringSessions' },
        name: 'LoopVerse Mentoring'
      });

      calendar.createEvent({
        start: session.startTime,
        end: session.endTime,
        summary: session.title,
        description: session.description,
        location: session.meetingLink || 'Online',
        url: session.meetingLink,
        organizer: {
          name: `${session.mentorId.firstName} ${session.mentorId.lastName}`,
          email: session.mentorId.email
        },
        attendees: [
          {
            name: `${session.learnerId.firstName} ${session.learnerId.lastName}`,
            email: session.learnerId.email,
            rsvp: true,
            role: 'REQ-PARTICIPANT'
          }
        ]
      });

      // Ensure directory exists
      const dir = path.join(__dirname, '../public/calendar');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const filePath = path.join(dir, `session-${session._id}.ics`);
      fs.writeFileSync(filePath, calendar.toString());

      return `/calendar/session-${session._id}.ics`;
    } catch (error) {
      console.error('Error generating iCal file:', error);
      throw new Error('Failed to generate calendar file');
    }
  },

  /**
   * Add event to Google Calendar (requires OAuth)
   * @param {Object} session - The session object
   * @param {String} accessToken - User's Google OAuth access token
   * @returns {Object} - Created event details
   */
  addToGoogleCalendar: async (session, accessToken) => {
    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const event = {
        summary: session.title,
        description: session.description,
        start: {
          dateTime: session.startTime.toISOString(),
          timeZone: session.learnerTimeZone
        },
        end: {
          dateTime: session.endTime.toISOString(),
          timeZone: session.learnerTimeZone
        },
        attendees: [
          { email: session.mentorId.email },
          { email: session.learnerId.email }
        ],
        conferenceData: {
          createRequest: {
            requestId: `loopverse-${session._id}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' }
          }
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 }
          ]
        }
      };

      const result = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        conferenceDataVersion: 1
      });

      return result.data;
    } catch (error) {
      console.error('Error adding to Google Calendar:', error);
      throw new Error('Failed to add event to Google Calendar');
    }
  }
};

module.exports = calendarIntegration;