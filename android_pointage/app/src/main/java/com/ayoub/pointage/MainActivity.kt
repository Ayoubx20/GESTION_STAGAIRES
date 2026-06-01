package com.ayoub.pointage

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.FileProvider
import androidx.webkit.WebViewAssetLoader
import java.io.File

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        
        setupWebView()

        // Handle back button presses using the modern OnBackPressedDispatcher
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    private fun setupWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true // Essential for localStorage (timesheet data)
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.supportZoom()

        // Modern WebView Asset Loader for secure offline asset loading
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                return assetLoader.shouldInterceptRequest(request.url)
            }
        }

        // Enable WebChromeClient for javascript alerts and confirm dialogs (fixes Reset button)
        webView.webChromeClient = android.webkit.WebChromeClient()

        // Expose native sharing interface to JavaScript
        webView.addJavascriptInterface(WebAppInterface(this), "AndroidApp")

        // Load timesheet page from local assets
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
    }



    // Javascript interface to bridge web pages and Android sharing features
    class WebAppInterface(private val context: Context) {
        @JavascriptInterface
        fun shareCSV(csvContent: String, filename: String) {
            try {
                val cacheDir = File(context.cacheDir, "exports")
                if (!cacheDir.exists()) {
                    cacheDir.mkdirs()
                }
                val file = File(cacheDir, filename)
                file.writeText(csvContent)

                val contentUri: Uri = FileProvider.getUriForFile(
                    context,
                    "com.ayoub.pointage.fileprovider",
                    file
                )

                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/csv"
                    putExtra(Intent.EXTRA_STREAM, contentUri)
                    putExtra(Intent.EXTRA_SUBJECT, "Pointage Export")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }

                context.startActivity(Intent.createChooser(shareIntent, "Partager le pointage CSV"))
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}
