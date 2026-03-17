package com.railops.network

import com.railops.data.FetchTripRequest
import com.railops.data.SubmitReviewRequest
import com.railops.data.TripSnapshot
import retrofit2.http.Body
import retrofit2.http.POST

interface RailOpsApi {
    @POST("api/trips/fetch-by-pnr")
    suspend fun fetchTrip(@Body request: FetchTripRequest): TripSnapshot

    @POST("api/reviews")
    suspend fun submitReview(@Body request: SubmitReviewRequest)
}
