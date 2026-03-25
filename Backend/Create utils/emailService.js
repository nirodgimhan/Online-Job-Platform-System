const nodemailer = require('nodemailer');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendInterviewEmail = async ({ to, type, data }) => {
  try {
    let subject = '';
    let html = '';

    switch(type) {
      case 'scheduled':
        subject = `Interview Scheduled: ${data.jobTitle}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4f46e5; margin: 0;">Interview Scheduled</h1>
              <p style="color: #64748b;">Your interview has been scheduled</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <p>Dear <strong>${data.studentName}</strong>,</p>
              <p>We are pleased to inform you that your interview for the position of <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong> has been scheduled.</p>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e293b;">Interview Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0;"><strong>Date & Time:</strong></td>
                  <td style="padding: 8px 0;">${data.scheduledDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Duration:</strong></td>
                  <td style="padding: 8px 0;">${data.duration} minutes</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Mode:</strong></td>
                  <td style="padding: 8px 0;">${data.mode}</td>
                </tr>
                ${data.meetingLink ? `
                <tr>
                  <td style="padding: 8px 0;"><strong>Meeting Link:</strong></td>
                  <td style="padding: 8px 0;"><a href="${data.meetingLink}" style="color: #4f46e5;">${data.meetingLink}</a></td>
                </tr>
                ` : ''}
                ${data.location ? `
                <tr>
                  <td style="padding: 8px 0;"><strong>Location:</strong></td>
                  <td style="padding: 8px 0;">${data.location.address}, ${data.location.city}, ${data.location.country}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0;"><strong>Interviewer:</strong></td>
                  <td style="padding: 8px 0;">${data.interviewerName}</td>
                </tr>
              </table>
            </div>

            ${data.notes ? `
            <div style="background-color: #fef9c3; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Additional Notes:</strong></p>
              <p style="margin: 5px 0 0 0;">${data.notes}</p>
            </div>
            ` : ''}

            <div style="margin-top: 20px;">
              <p>Please arrive 5-10 minutes before the scheduled time.</p>
              <p>If you need to reschedule or have any questions, please contact us as soon as possible.</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0;">Best regards,</p>
              <p style="margin: 5px 0 0 0;"><strong>${data.companyName} Team</strong></p>
            </div>
          </div>
        `;
        break;

      case 'rescheduled':
        subject = `Interview Rescheduled: ${data.jobTitle}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #f59e0b; margin: 0;">Interview Rescheduled</h1>
              <p style="color: #64748b;">Your interview time has been changed</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <p>Dear <strong>${data.studentName}</strong>,</p>
              <p>Your interview for the position of <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong> has been rescheduled.</p>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e293b;">Updated Interview Details:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0;"><strong>Previous Date:</strong></td>
                  <td style="padding: 8px 0; color: #dc2626;">${data.oldDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>New Date & Time:</strong></td>
                  <td style="padding: 8px 0; color: #10b981;">${data.newDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Duration:</strong></td>
                  <td style="padding: 8px 0;">${data.duration} minutes</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Mode:</strong></td>
                  <td style="padding: 8px 0;">${data.mode}</td>
                </tr>
                ${data.meetingLink ? `
                <tr>
                  <td style="padding: 8px 0;"><strong>Meeting Link:</strong></td>
                  <td style="padding: 8px 0;"><a href="${data.meetingLink}" style="color: #4f46e5;">${data.meetingLink}</a></td>
                </tr>
                ` : ''}
              </table>
            </div>

            ${data.notes ? `
            <div style="background-color: #fef9c3; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Notes:</strong></p>
              <p style="margin: 5px 0 0 0;">${data.notes}</p>
            </div>
            ` : ''}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0;">Best regards,</p>
              <p style="margin: 5px 0 0 0;"><strong>${data.companyName} Team</strong></p>
            </div>
          </div>
        `;
        break;

      case 'cancelled':
        subject = `Interview Cancelled: ${data.jobTitle}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #ef4444; margin: 0;">Interview Cancelled</h1>
              <p style="color: #64748b;">Your interview has been cancelled</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <p>Dear <strong>${data.userName}</strong>,</p>
              <p>The interview scheduled for <strong>${data.jobTitle}</strong> on <strong>${data.scheduledDate}</strong> has been cancelled by the <strong>${data.cancelledBy}</strong>.</p>
            </div>

            <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;">If you have any questions, please contact the recruitment team.</p>
            </div>

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0;">Best regards,</p>
              <p style="margin: 5px 0 0 0;">Recruitment Team</p>
            </div>
          </div>
        `;
        break;

      case 'feedback':
        subject = `Interview Feedback: ${data.jobTitle}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #4f46e5; margin: 0;">Interview Feedback</h1>
              <p style="color: #64748b;">Thank you for attending the interview</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <p>Dear <strong>${data.studentName}</strong>,</p>
              <p>Thank you for attending the interview for the position of <strong>${data.jobTitle}</strong>.</p>
            </div>

            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1e293b;">Feedback Summary:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0;"><strong>Overall Rating:</strong></td>
                  <td style="padding: 8px 0;">
                    ${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}
                    (${data.rating}/5)
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;"><strong>Recommendation:</strong></td>
                  <td style="padding: 8px 0; font-weight: bold;">${data.recommendation}</td>
                </tr>
              </table>
            </div>

            ${data.comments ? `
            <div style="background-color: #e0f2fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Feedback Comments:</strong></p>
              <p style="margin: 5px 0 0 0;">${data.comments}</p>
            </div>
            ` : ''}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0;">We appreciate your time and interest in our company.</p>
              <p style="margin: 5px 0 0 0;">Best regards,</p>
              <p style="margin: 5px 0 0 0;">Recruitment Team</p>
            </div>
          </div>
        `;
        break;
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Recruitment System" <noreply@recruitment.com>',
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

module.exports = { sendInterviewEmail };