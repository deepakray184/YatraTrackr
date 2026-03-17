package com.railops

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.input.pointer.pointerInteropFilter
import androidx.compose.ui.unit.dp
import com.railops.data.FetchTripRequest
import com.railops.data.SubmitReviewRequest
import com.railops.data.TripSnapshot
import com.railops.network.RailOpsApi
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                RailOpsScreen()
            }
        }
    }
}

private val api: RailOpsApi = Retrofit.Builder()
    .baseUrl("http://10.0.2.2:4000/")
    .addConverterFactory(GsonConverterFactory.create())
    .build()
    .create(RailOpsApi::class.java)

@Composable
fun RailOpsScreen() {
    val scope = rememberCoroutineScope()
    var pnr by remember { mutableStateOf("") }
    var staffId by remember { mutableStateOf("") }
    var comments by remember { mutableStateOf("") }
    var rating by remember { mutableFloatStateOf(3f) }
    var message by remember { mutableStateOf("") }
    var trip by remember { mutableStateOf<TripSnapshot?>(null) }
    val signaturePoints = remember { mutableStateListOf<Offset>() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("RailOps - PNR Fetch + Cleanliness Review")
        OutlinedTextField(value = pnr, onValueChange = { pnr = it }, label = { Text("PNR") })
        OutlinedTextField(value = staffId, onValueChange = { staffId = it }, label = { Text("Staff ID") })

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = {
                scope.launch {
                    runCatching {
                        api.fetchTrip(FetchTripRequest(pnr = pnr, requestedBy = staffId.ifBlank { "mobile-app" }))
                    }.onSuccess {
                        trip = it
                        message = "Fetched ${it.travellers.size} travellers"
                    }.onFailure {
                        message = "Fetch failed: ${it.message}"
                    }
                }
            }) {
                Text("Fetch PNR")
            }
        }

        trip?.let { snapshot ->
            Text("Train: ${snapshot.trainNumber} - ${snapshot.trainName}")
            LazyColumn(modifier = Modifier.height(120.dp)) {
                items(snapshot.travellers) { person ->
                    Text("${person.name} (${person.coach}-${person.berth})")
                }
            }
        }

        Text("Cleanliness Rating: ${rating.toInt()}")
        Slider(value = rating, onValueChange = { rating = it }, valueRange = 1f..5f, steps = 3)
        OutlinedTextField(
            modifier = Modifier.fillMaxWidth(),
            value = comments,
            onValueChange = { comments = it },
            label = { Text("Comments") }
        )

        Text("Signature")
        SignaturePad(signaturePoints)

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = { signaturePoints.clear() }) { Text("Clear") }
            Button(onClick = {
                scope.launch {
                    runCatching {
                        api.submitReview(
                            SubmitReviewRequest(
                                pnr = pnr,
                                staffId = staffId,
                                cleanlinessRating = rating.toInt(),
                                comments = comments,
                                signaturePayload = signaturePoints.joinToString(";") { "${it.x},${it.y}" }
                            )
                        )
                    }.onSuccess {
                        message = "Review submitted successfully"
                    }.onFailure {
                        message = "Submit failed: ${it.message}"
                    }
                }
            }) {
                Text("Submit Review")
            }
        }

        Text(message, color = Color.DarkGray)
        Text(
            "Disclaimer: RailOps is an independent tool and is not affiliated with, authorized by, or endorsed by IRCTC/Indian Railways."
        )
    }
}

@Composable
private fun SignaturePad(points: MutableList<Offset>) {
    Canvas(
        modifier = Modifier
            .fillMaxWidth()
            .height(180.dp)
            .pointerInteropFilter { event ->
                points.add(Offset(event.x, event.y))
                true
            }
    ) {
        val path = Path()
        points.forEachIndexed { index, offset ->
            if (index == 0) path.moveTo(offset.x, offset.y) else path.lineTo(offset.x, offset.y)
        }
        drawPath(path, Color.Black, style = Stroke(width = 4f))
    }
}
