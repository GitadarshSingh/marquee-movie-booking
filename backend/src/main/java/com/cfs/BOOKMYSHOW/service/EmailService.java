package com.cfs.BOOKMYSHOW.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class EmailService {

    private static final String APP_NAME = "Marquee by Adarsh";

    @Autowired
    private JavaMailSender javaMailSender;

    // application.properties wala spring.mail.username
    @Value("${spring.mail.username}")
    private String fromEmail;

    // Frontend ka link (button ke liye). Deploy karne par application.properties mein app.frontend.url set kar dena
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("EEE, dd MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter TIME_FMT =
            DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);

    // Naya: poori booking details ke saath sundar HTML mail
    public void sendBookingConfirmation(String email,
                                        String name,
                                        String amount,
                                        String movieTitle,
                                        String bookingNumber,
                                        LocalDateTime showTime,
                                        String theater,
                                        String screen,
                                        String seats) {
        try {
            MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String date = showTime != null ? showTime.format(DATE_FMT) : "-";
            String time = showTime != null ? showTime.format(TIME_FMT) : "-";

            String plain = "Hi " + name + ",\n\n"
                    + "Your booking is confirmed!\n\n"
                    + "Movie: " + movieTitle + "\n"
                    + "Date: " + date + "\n"
                    + "Show time: " + time + "\n"
                    + "Theater: " + theater + " (" + screen + ")\n"
                    + "Seats: " + seats + "\n"
                    + "Booking ID: " + bookingNumber + "\n"
                    + "Amount Paid: ₹" + amount + "\n\n"
                    + "Thank you for booking with " + APP_NAME + ". Enjoy your show!";

            String html = buildHtml(name, amount, movieTitle, bookingNumber,
                    date, time, theater, screen, seats);

            helper.setFrom(fromEmail, APP_NAME);
            helper.setTo(email);
            helper.setSubject("🎬 Booking Confirmed - " + movieTitle + " | " + APP_NAME);
            helper.setText(plain, html);   // plain text + HTML dono

            javaMailSender.send(message);
        } catch (Exception e) {
            // PaymentService isko catch karke log kar dega, booking CONFIRMED hi rahegi
            throw new RuntimeException("Failed to send booking email", e);
        }
    }

    // Purana simple method (agar kahin aur use ho raha ho to na toote)
    public void sendEmail(String email, String name, String amount, String movieTitle) {
        sendBookingConfirmation(email, name, amount, movieTitle,
                "-", null, "-", "-", "-");
    }

    private String esc(String s) {
        return HtmlUtils.htmlEscape(s == null ? "" : s);
    }

    private String buildHtml(String name, String amount, String movieTitle,
                             String bookingNumber, String date, String time,
                             String theater, String screen, String seats) {

        String template = """
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f1f1f6;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f1f6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td align="center" bgcolor="#5b3df5" style="background:linear-gradient(135deg,#5b3df5,#8a6bff);padding:34px 20px;">
            <div style="font-size:30px;font-weight:800;color:#ffffff;letter-spacing:1px;">🎬 Marquee</div>
            <div style="font-size:12px;color:#e3dcff;letter-spacing:3px;margin-top:4px;">BY ADARSH</div>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td align="center" style="padding:30px 28px 8px;">
            <div style="font-size:44px;line-height:1;">🎉</div>
            <h1 style="margin:12px 0 6px;font-size:24px;color:#1c1c22;">Booking Confirmed!</h1>
            <p style="margin:0;font-size:15px;color:#5f6370;">Hi <b>{{name}}</b>, your tickets are ready. Get your popcorn!</p>
          </td>
        </tr>

        <!-- Ticket card -->
        <tr>
          <td style="padding:22px 28px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:2px dashed #cfc6ff;border-radius:14px;background:#faf9ff;">
              <tr>
                <td style="padding:20px 22px 8px;">
                  <div style="font-size:11px;color:#8a8fa0;letter-spacing:2px;">NOW SHOWING</div>
                  <div style="font-size:24px;font-weight:800;color:#5b3df5;margin-top:4px;">{{movie}}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 22px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td width="50%" style="padding:10px 0;">
                        <div style="font-size:11px;color:#8a8fa0;letter-spacing:1px;">📅 DATE</div>
                        <div style="font-size:16px;font-weight:700;color:#1c1c22;margin-top:3px;">{{date}}</div>
                      </td>
                      <td width="50%" style="padding:10px 0;">
                        <div style="font-size:11px;color:#8a8fa0;letter-spacing:1px;">⏰ SHOW TIME</div>
                        <div style="font-size:16px;font-weight:700;color:#1c1c22;margin-top:3px;">{{time}}</div>
                      </td>
                    </tr>
                    <tr>
                      <td width="50%" style="padding:10px 0;">
                        <div style="font-size:11px;color:#8a8fa0;letter-spacing:1px;">🏛 THEATER</div>
                        <div style="font-size:15px;font-weight:700;color:#1c1c22;margin-top:3px;">{{theater}}</div>
                      </td>
                      <td width="50%" style="padding:10px 0;">
                        <div style="font-size:11px;color:#8a8fa0;letter-spacing:1px;">🎞 SCREEN</div>
                        <div style="font-size:15px;font-weight:700;color:#1c1c22;margin-top:3px;">{{screen}}</div>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding:10px 0 14px;">
                        <div style="font-size:11px;color:#8a8fa0;letter-spacing:1px;">💺 SEATS</div>
                        <div style="margin-top:6px;display:inline-block;background:#5b3df5;color:#ffffff;font-size:16px;font-weight:700;padding:6px 14px;border-radius:999px;">{{seats}}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 22px 20px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px dashed #cfc6ff;">
                    <tr>
                      <td style="padding-top:14px;">
                        <div style="font-size:11px;color:#8a8fa0;letter-spacing:1px;">BOOKING ID</div>
                        <div style="font-size:14px;font-weight:700;color:#1c1c22;margin-top:3px;">{{bookingNumber}}</div>
                      </td>
                      <td align="right" style="padding-top:14px;">
                        <div style="font-size:11px;color:#8a8fa0;letter-spacing:1px;">AMOUNT PAID</div>
                        <div style="font-size:22px;font-weight:800;color:#1a9d55;margin-top:3px;">₹{{amount}}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Button -->
        <tr>
          <td align="center" style="padding:4px 28px 10px;">
            <a href="{{link}}" style="display:inline-block;background:#5b3df5;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 34px;border-radius:999px;">View My Bookings →</a>
          </td>
        </tr>

        <!-- Tips -->
        <tr>
          <td align="center" style="padding:18px 28px 6px;">
            <p style="margin:0;font-size:13px;color:#5f6370;line-height:1.6;">
              ⏳ Please reach the theater <b>15 minutes</b> before the show.<br>
              📱 Show this email or your Booking ID at the counter.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" bgcolor="#1c1c22" style="background:#1c1c22;padding:22px 20px;margin-top:20px;">
            <div style="font-size:15px;color:#ffffff;font-weight:700;">Enjoy your show! 🍿</div>
            <div style="font-size:12px;color:#9aa0ac;margin-top:6px;">© Marquee by Adarsh · Built with React + Spring Boot</div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
""";

        return template
                .replace("{{name}}", esc(name))
                .replace("{{movie}}", esc(movieTitle))
                .replace("{{date}}", esc(date))
                .replace("{{time}}", esc(time))
                .replace("{{theater}}", esc(theater))
                .replace("{{screen}}", esc(screen))
                .replace("{{seats}}", esc(seats))
                .replace("{{bookingNumber}}", esc(bookingNumber))
                .replace("{{amount}}", esc(amount))
                .replace("{{link}}", frontendUrl + "/#/bookings");
    }
}