package com.railops.data

data class Traveller(
    val name: String,
    val age: Int,
    val gender: String,
    val coach: String,
    val berth: String
)

data class TripSnapshot(
    val pnr: String,
    val trainNumber: String,
    val trainName: String,
    val boardingStation: String,
    val destinationStation: String,
    val travellers: List<Traveller>,
    val source: String,
    val fetchedAt: String
)

data class FetchTripRequest(
    val pnr: String,
    val requestedBy: String
)

data class SubmitReviewRequest(
    val pnr: String,
    val staffId: String,
    val cleanlinessRating: Int,
    val comments: String,
    val signaturePayload: String
)
