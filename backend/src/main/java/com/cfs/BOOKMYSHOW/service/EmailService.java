package com.cfs.BOOKMYSHOW.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender javaMailSender;

    public void sendEmail(String email,
                          String name,
                          String amount,
                          String movieTitle) {

        SimpleMailMessage mailMessage = new SimpleMailMessage();

        mailMessage.setTo(email);
        mailMessage.setSubject("Booking Confirmed - " + movieTitle);

        mailMessage.setText(
                "Hi " + name + ",\n\n" +
                        "Your movie ticket has been booked successfully.\n\n" +
                        "Movie: " + movieTitle + "\n" +
                        "Amount Paid: ₹" + amount + "\n\n" +
                        "Thank you for booking with BookMyShow.\n\n" +
                        "Enjoy your show!"
        );

        javaMailSender.send(mailMessage);
    }
}