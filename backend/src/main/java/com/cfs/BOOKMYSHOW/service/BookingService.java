package com.cfs.BOOKMYSHOW.service;


import com.cfs.BOOKMYSHOW.BookingStatus;
import com.cfs.BOOKMYSHOW.PaymentStatus;
import com.cfs.BOOKMYSHOW.SeatStatus;
import com.cfs.BOOKMYSHOW.dto.*;
import com.cfs.BOOKMYSHOW.exception.ResourceNotFoundException;
import com.cfs.BOOKMYSHOW.exception.SeatUnavailableException;
import com.cfs.BOOKMYSHOW.model.*;
import com.cfs.BOOKMYSHOW.repository.BookingRepository;
import com.cfs.BOOKMYSHOW.repository.ShowRepository;
import com.cfs.BOOKMYSHOW.repository.ShowSeatRepository;
import com.cfs.BOOKMYSHOW.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BookingService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShowRepository showRepository;

    @Autowired
    private ShowSeatRepository showSeatRepository;

    @Autowired
    private BookingRepository bookingRepository;

    //इस code में assume किया गया है कि user पहले से registered/logged in है।

    @Transactional  // -> Ensure ACID propertiees
    public BookingDto createBooking(BookingRequestDto bookingRequest){

        //User कौन है → निकाल रहे हैं
        User user = userRepository.findById(bookingRequest.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        //कौन सा शो book करना है → निकाल रहे हैं
        Show show = showRepository.findById(bookingRequest.getShowId())
                .orElseThrow(()->new ResourceNotFoundException("Show not found"));

        //कौन सी seats चाहिए → निकाल रहे हैं
        List<ShowSeat> selectedSeats = showSeatRepository.findAllByIdWithLock(bookingRequest.getSeatIds());
        if(selectedSeats.size() != bookingRequest.getSeatIds().size())
        {
            throw new ResourceNotFoundException("One or more seats not found");
        }
        for(ShowSeat seat:selectedSeats)
        {
            if (!seat.getShow().getId().equals(show.getId())) {
                throw new SeatUnavailableException(
                        "Seat does not belong to selected show");
            }
            //Seats available हैं या नहीं → check कर रहे हैं
            if(seat.getStatus() != SeatStatus.AVAILABLE)
            {
                throw new SeatUnavailableException("Seat " + seat.getSeat().getSeatNumber() + " is not available");            }

            //Seats को lock कर रहे हैं ताकि कोई दूसरा book न करे
            seat.setStatus(SeatStatus.LOCKED);
            seat.setLockedAt(LocalDateTime.now());
        }
        //Total price calculate कर रहे हैं
        showSeatRepository.saveAll(selectedSeats);

        BigDecimal totalAmount = selectedSeats.stream()
                .map(ShowSeat::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        //payment genrated : Payment details बना रहे हैं
        Payment payment = new Payment();
        payment.setAmount(totalAmount);
        payment.setPaymentTime(LocalDateTime.now());
        payment.setPaymentMethod(bookingRequest.getPaymentMethod());
        payment.setStatus(PaymentStatus.PENDING);

        //Unique transaction ID generate कर रहे हैं
        payment.setTransactionId(UUID.randomUUID().toString()); // UUID used to genrated random number for transaction id

        //Booking request -> validation -> seat locking -> payment preparation

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setShow(show);
        booking.setBookingTime(LocalDateTime.now());
        booking.setStatus(BookingStatus.PENDING);
        booking.setTotalAmount(totalAmount);
        booking.setBookingNumber("BookMyShow-" + System.currentTimeMillis());
        booking.setPayment(payment);

        Booking saveBooking = bookingRepository.save(booking);

        selectedSeats.forEach(seat ->
        {

            seat.setBooking(saveBooking);
        });

        showSeatRepository.saveAll(selectedSeats);
        return mapToBookingDto(saveBooking,selectedSeats);
    }

    // User Can Search By BooingId
    public BookingDto getBookingById(Long id)
    {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(()->new ResourceNotFoundException("Booking Not FounD"));

        List<ShowSeat> seats = showSeatRepository.findByBookingId(booking.getId()); //stream के processed data को वापस List में convert करता है।

        return mapToBookingDto(booking,seats);

    }

    // User can search from BookingNumber
    public BookingDto getBookingByBookingNumber(String bookingNumber)
    {
        Booking booking = bookingRepository.findByBookingNumber(bookingNumber)
                .orElseThrow(()->new ResourceNotFoundException("Booking Not Found"));

        List<ShowSeat> seats =
                showSeatRepository.findByBookingId(booking.getId());
        return mapToBookingDto(booking,seats);

    }

    // User can search from UserID
    public List<BookingDto> getBookingByUserId(Long userId)
    {
        List<Booking> bookings = bookingRepository.findByUserId(userId); //Optional mein through lAGATE HAI

        return bookings.stream()
                .map(booking -> {
                    List<ShowSeat> seats =
                            showSeatRepository.findByBookingId(booking.getId());
                    return mapToBookingDto(booking,seats);
                })
                .collect(Collectors.toList());

    }
    @Transactional
    public BookingDto cancelBooking(Long id)
    {
        Booking booking=bookingRepository.findById(id)
                .orElseThrow(()->new ResourceNotFoundException("Booking Not Found"));
        booking.setStatus(BookingStatus.CANCELLED);

//
        List<ShowSeat> seats =
                showSeatRepository.findByBookingId(booking.getId());

        seats.forEach(seat->{
            seat.setStatus(SeatStatus.AVAILABLE);
            seat.setLockedAt(null);
            seat.setBooking(null);
        });

        if(booking.getPayment()!=null)
        {
            booking.getPayment().setStatus(PaymentStatus.REFUNDED);
        }
        Booking updateBooking=bookingRepository.save(booking);
        showSeatRepository.saveAll(seats);

        return mapToBookingDto(updateBooking,seats);
    }

    private BookingDto mapToBookingDto(Booking booking,List<ShowSeat> seats)
    {
        BookingDto bookingDto=new BookingDto();
        bookingDto.setId(booking.getId());
        bookingDto.setBookingNumber(booking.getBookingNumber());
        bookingDto.setBookingTime(booking.getBookingTime());
        bookingDto.setStatus(booking.getStatus());
        bookingDto.setTotalAmount(booking.getTotalAmount());

        //user mapping
        UserDto userDto=new UserDto();
        userDto.setId(booking.getUser().getId());
        userDto.setName(booking.getUser().getName());
        userDto.setEmail(booking.getUser().getEmail());
        userDto.setPhoneNumber(booking.getUser().getPhoneNumber());
        bookingDto.setUser(userDto);

        //show mappping
        ShowDto showDto = new ShowDto();
        showDto.setId(booking.getShow().getId());
        showDto.setStartTime(booking.getShow().getStartTime());
        showDto.setEndTime(booking.getShow().getEndTime());

        //Movie mapping
        MovieDto movieDto=new MovieDto();
        movieDto.setId(booking.getShow().getMovie().getId());
        movieDto.setTitle(booking.getShow().getMovie().getTitle());
        movieDto.setDescription(booking.getShow().getMovie().getDescription());
        movieDto.setLanguage(booking.getShow().getMovie().getLanguage());
        movieDto.setGenre(booking.getShow().getMovie().getGenre());
        movieDto.setDurationMins(booking.getShow().getMovie().getDurationMins());
        movieDto.setReleaseDate(booking.getShow().getMovie().getReleaseDate());
        movieDto.setPosterUrl(booking.getShow().getMovie().getPosterUrl());
        showDto.setMovie(movieDto);

        //screen Mapping

        ScreenDto screenDto = new ScreenDto();
        screenDto.setId(booking.getShow().getScreen().getId());
        screenDto.setName(booking.getShow().getScreen().getName());
        screenDto.setTotalSeats(booking.getShow().getScreen().getTotalSeats());

        // Theater Mapping

        TheaterDto theaterDto=new TheaterDto();
        theaterDto.setId(booking.getShow().getScreen().getTheater().getId());
        theaterDto.setName(booking.getShow().getScreen().getTheater().getName());
        theaterDto.setAddress(booking.getShow().getScreen().getTheater().getAddress());
        theaterDto.setCity(booking.getShow().getScreen().getTheater().getCity());
        theaterDto.setTotalScreens(booking.getShow().getScreen().getTheater().getTotalScreens());

        screenDto.setTheater(theaterDto);
        showDto.setScreen(screenDto);
        bookingDto.setShow(showDto);

        List<ShowSeatDto> seatDtos=seats.stream()
                .map(seat->{
                    ShowSeatDto seatDto=new ShowSeatDto();
                    seatDto.setId(seat.getId());
                    seatDto.setStatus(seat.getStatus());
                    seatDto.setPrice(seat.getPrice());

                    SeatDto baseSeatDto=new SeatDto();
                    baseSeatDto.setId(seat.getSeat().getId());
                    baseSeatDto.setSeatNumber(seat.getSeat().getSeatNumber());
                    baseSeatDto.setSeatType(seat.getSeat().getSeatType());
                    baseSeatDto.setBasePrice(seat.getSeat().getBasePrice());
                    seatDto.setSeat(baseSeatDto);

                    return seatDto;
                })
                .collect(Collectors.toList());
        bookingDto.setSeats(seatDtos);

        if(booking.getPayment()!=null)
        {
            PaymentDto paymentDto=new PaymentDto();
            paymentDto.setId(booking.getPayment().getId());
            paymentDto.setAmount(booking.getPayment().getAmount());
            paymentDto.setPaymentMethod(booking.getPayment().getPaymentMethod());
            paymentDto.setPaymentTime(booking.getPayment().getPaymentTime());
            paymentDto.setStatus(booking.getPayment().getStatus());
            paymentDto.setTransactionId(booking.getPayment().getTransactionId());
            bookingDto.setPayment(paymentDto);
        }
        return bookingDto;



    }

}
