package com.example.songfinder

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.EditText
import android.widget.ListView
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.songfinder.api.ApoloApiService
import com.example.songfinder.model.*
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class MainActivity : AppCompatActivity() {

    private lateinit var apiService: ApoloApiService
    private lateinit var songsListView: ListView
    private lateinit var similarSongsListView: ListView
    private lateinit var searchEditText: EditText
    
    private var allSongs: List<Song> = emptyList()
    private lateinit var username: String

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        Log.d("Lifecycle", "onCreate llamado")

        username = intent.getStringExtra("USERNAME") ?: "Invitado"

        val retrofit = Retrofit.Builder()
            .baseUrl("http://192.168.1.13:8080")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        apiService = retrofit.create(ApoloApiService::class.java)

        songsListView = findViewById(R.id.songsListView)
        similarSongsListView = findViewById(R.id.similarSongsListView)
        searchEditText = findViewById(R.id.searchEditText)

        fetchAllSongs()

        songsListView.setOnItemClickListener { _, _, position, _ ->
            val selectedSong = (songsListView.adapter as ArrayAdapter<Song>).getItem(position)
            if (selectedSong != null) {
                onSongSelected(selectedSong)
            }
        }
    }

    override fun onStart() { super.onStart(); Log.d("Lifecycle", "onStart llamado") }
    override fun onResume() { super.onResume(); Log.d("Lifecycle", "onResume llamado") }
    override fun onPause() { super.onPause(); Log.d("Lifecycle", "onPause llamado") }
    override fun onStop() { super.onStop(); Log.d("Lifecycle", "onStop llamado") }
    override fun onDestroy() { super.onDestroy(); Log.d("Lifecycle", "onDestroy llamado") }

    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.main_menu, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            R.id.action_logout -> { finish(); true }
            R.id.action_settings -> { Toast.makeText(this, "Ajustes", Toast.LENGTH_SHORT).show(); true }
            else -> super.onOptionsItemSelected(item)
        }
    }

    fun onSearchClick(view: View) {
        val query = searchEditText.text.toString().trim().lowercase()
        if (query.isNotEmpty()) {
            val filteredSongs = allSongs.filter {
                it.id.songName.lowercase().contains(query) || it.id.songArtist.lowercase().contains(query)
            }
            updateSongsListView(filteredSongs)
        } else {
            updateSongsListView(allSongs)
        }
    }

    fun onHistoryClick(view: View) {
        val intent = Intent(this, HistoryActivity::class.java)
        startActivity(intent)
    }

    private fun fetchAllSongs() {
        lifecycleScope.launch {
            try {
                val response = apiService.getAllSongs()
                if (response.isSuccessful && response.body() != null) {
                    allSongs = response.body()!!
                    updateSongsListView(allSongs)
                }
            } catch (e: Exception) { Log.e("API", "Error: ${e.message}") }
        }
    }

    private fun updateSongsListView(songs: List<Song>) {
        val adapter = object : ArrayAdapter<Song>(this, R.layout.item_song, R.id.songNameTextView, songs) {
            override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
                val view = super.getView(position, convertView, parent)
                val song = getItem(position)
                view.findViewById<TextView>(R.id.songNameTextView).text = song?.id?.songName
                view.findViewById<TextView>(R.id.artistTextView).text = song?.id?.songArtist
                return view
            }
        }
        songsListView.adapter = adapter
    }

    private fun onSongSelected(song: Song) {
        Toast.makeText(this, "Explorando: ${song.id.songName}", Toast.LENGTH_SHORT).show()
        saveToHistory(song)
        fetchSimilarSongs(song)
    }

    private fun saveToHistory(song: Song) {
        // Local save
        HistoryManager.addSong(song)

        // API save
        lifecycleScope.launch {
            try {
                val dateFormat = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", java.util.Locale.getDefault())
                val historyEntry = ListeningHistory(
                    user = User(username),
                    song = song,
                    playedAt = dateFormat.format(java.util.Date()),
                    durationPlayedMs = 0L
                )
                val response = apiService.createHistory(historyEntry)
                if (response.isSuccessful) {
                    Log.d("API", "Historial guardado en el servidor")
                }
            } catch (e: Exception) {
                Log.e("API", "Error al guardar historial: ${e.message}")
            }
        }
    }

    private fun fetchSimilarSongs(song: Song) {
        lifecycleScope.launch {
            try {
                val response = apiService.getSimilarSongs(song.id.songArtist, song.id.songName)
                if (response.isSuccessful && response.body() != null) {
                    val similarSongs = response.body()!!
                    val adapter = object : ArrayAdapter<SimilarSongDTO>(this@MainActivity, R.layout.item_song, R.id.songNameTextView, similarSongs) {
                        override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
                            val view = super.getView(position, convertView, parent)
                            val item = getItem(position)
                            view.findViewById<TextView>(R.id.songNameTextView).text = item?.songName
                            view.findViewById<TextView>(R.id.artistTextView).text = "${item?.artist} • ${(item?.similarity?.times(100))?.toInt()}% coincidencia"
                            return view
                        }
                    }
                    similarSongsListView.adapter = adapter
                }
            } catch (e: Exception) { Log.e("API", "Error: ${e.message}") }
        }
    }
}
