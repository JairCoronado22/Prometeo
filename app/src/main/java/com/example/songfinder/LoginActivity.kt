package com.example.songfinder

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.songfinder.api.ApoloApiService
import com.example.songfinder.model.User
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class LoginActivity : AppCompatActivity() {

    private lateinit var apiService: ApoloApiService
    private lateinit var usernameEditText: EditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        val retrofit = Retrofit.Builder()
            .baseUrl("http://192.168.1.13:8080")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        apiService = retrofit.create(ApoloApiService::class.java)

        usernameEditText = findViewById(R.id.usernameEditText)
    }

    fun onLoginClick(view: View) {
        val username = usernameEditText.text.toString().trim()
        if (username.isNotEmpty()) {
            performLogin(username)
        } else {
            Toast.makeText(this, "Ingresa un usuario", Toast.LENGTH_SHORT).show()
        }
    }

    fun onGuestClick(view: View) {
        navigateToMain("Invitado")
    }

    private fun performLogin(username: String) {
        lifecycleScope.launch {
            try {
                val response = apiService.getUser(username)
                if (response.isSuccessful && response.body() != null) {
                    navigateToMain(username)
                } else {
                    // Si no existe, lo creamos con el nuevo modelo que incluye fecha
                    val createResponse = apiService.createUser(User(username))
                    if (createResponse.isSuccessful) {
                        navigateToMain(username)
                    } else {
                        // Si falla el backend, igual permitimos entrar para el avance 1
                        Toast.makeText(this@LoginActivity, "Modo Offline", Toast.LENGTH_SHORT).show()
                        navigateToMain(username)
                    }
                }
            } catch (e: Exception) {
                // Error de red, permitir entrar igual para demostración
                Toast.makeText(this@LoginActivity, "Error de red: Entrando modo demo", Toast.LENGTH_SHORT).show()
                navigateToMain(username)
            }
        }
    }

    private fun navigateToMain(username: String) {
        val intent = Intent(this, MainActivity::class.java)
        intent.putExtra("USERNAME", username)
        startActivity(intent)
        finish()
    }
}
