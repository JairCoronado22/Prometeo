package com.example.songfinder

import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.ImageButton
import android.widget.ListView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.example.songfinder.model.Song

class HistoryActivity : AppCompatActivity() {

    private lateinit var historyListView: ListView
    private lateinit var backButton: ImageButton

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_history)

        historyListView = findViewById(R.id.historyListView)
        backButton = findViewById(R.id.backButton)

        backButton.setOnClickListener {
            finish()
        }

        updateHistoryListView()
    }

    private fun updateHistoryListView() {
        val songs = HistoryManager.getHistory()
        val adapter = object : ArrayAdapter<Song>(this, R.layout.item_song, R.id.songNameTextView, songs) {
            override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
                val view = super.getView(position, convertView, parent)
                val song = getItem(position)
                view.findViewById<TextView>(R.id.songNameTextView).text = song?.id?.songName
                view.findViewById<TextView>(R.id.artistTextView).text = song?.id?.songArtist
                return view
            }
        }
        historyListView.adapter = adapter
    }
}
