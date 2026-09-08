package com.example.songfinder.api

import com.example.songfinder.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApoloApiService {

    // --- AppUserController ---
    @GET("/api/users/{username}")
    suspend fun getUser(@Path("username") username: String): Response<User>

    @POST("/api/users")
    suspend fun createUser(@Body user: User): Response<User>

    // --- SongController ---
    @GET("/api/songs")
    suspend fun getAllSongs(): Response<List<Song>>

    @GET("/api/songs/similar")
    suspend fun getSimilarSongs(
        @Query("artist") artist: String,
        @Query("songName") songName: String
    ): Response<List<SimilarSongDTO>>

    // --- ListeningHistoryController ---
    @POST("/api/listening-history")
    suspend fun createHistory(@Body history: ListeningHistory): Response<ListeningHistory>
}
