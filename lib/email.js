import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = "service_qtol4zn";
const EMAILJS_TEMPLATE_ID = "template_xrosjfa";
const EMAILJS_PUBLIC_KEY = "Y7jwA8QWDnxchidbp";

export const sendBookingEmail = async (bookingData, bookingId) => {
    try {
      // Get your website's URL from window.location or environment variable
      const baseUrl = window.location.origin;
      const qrCodeUrl = `${baseUrl}/qr/${bookingId}`;
  
      // Format date string
      let dateString = '';
      if (bookingData.date) {
        try {
          dateString = new Date(bookingData.date).toLocaleString();
        } catch (e) {
          dateString = bookingData.date;
        }
      }
  
      const templateParams = {
        to_name: bookingData.fullName || 'Valued Customer',
        to_email: bookingData.email,
        booking_date: dateString,
        guests: bookingData.guests || 'Not specified',
        booking_id: bookingId,
        qr_code_url: qrCodeUrl,
      };
  
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
  
      console.log('Email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  };