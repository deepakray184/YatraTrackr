package com.yatratrackr.network

import com.yatratrackr.data.FetchTripRequest
import com.yatratrackr.data.SubmitReviewRequest
import com.yatratrackr.data.TripSnapshot
import retrofit2.http.Body
import retrofit2.http.POST

interface YatraTrackrApi {
    @POST("api/trips/fetch-by-pnr")
    suspend fun fetchTrip(@Body request: FetchTripRequest): TripSnapshot

    @POST("api/reviews")
    suspend fun submitReview(@Body request: SubmitReviewRequest)
}
