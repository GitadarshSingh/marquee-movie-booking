package com.cfs.BOOKMYSHOW;

public enum SeatStatus {
    AVAILABLE,
    LOCKED,
    BOOKED
}

//Enum का उपयोग तब करते हैं जब किसी field में केवल कुछ निश्चित (fixed) values ही allowed हों।

/*
फायदा
Spelling mistakes नहीं होंगी।
केवल valid values ही save होंगी।
Code ज्यादा safe और professional बनता है।
Database में गलत data जाने की संभावना कम हो जाती है।
 */