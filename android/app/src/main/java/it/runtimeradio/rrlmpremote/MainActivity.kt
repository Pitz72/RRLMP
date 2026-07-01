package it.runtimeradio.rrlmpremote

import android.app.Activity
import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.os.Bundle
import android.view.KeyEvent
import android.view.Menu
import android.view.MenuItem
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.Toast

/**
 * Guscio WebView del Controllo Remoto RRLMP.
 *
 * Due schermi: (1) inserimento dell'indirizzo del PC in regia, salvato in
 * SharedPreferences; (2) la WebView che carica la pagina web servita dal
 * server LAN (`http://<ip>:<porta>/?app=1`). Il parametro `app=1` dice alla
 * pagina di saltare lo schermo "installa PWA" (qui siamo già un'app nativa) e
 * andare dritti al PIN. Il canale WS+PIN è identico a quello del browser.
 */
class MainActivity : Activity() {

    private lateinit var prefs: android.content.SharedPreferences
    private var webView: WebView? = null

    // mDNS auto-discovery (step 4)
    private var nsdManager: NsdManager? = null
    private var discoveryListener: NsdManager.DiscoveryListener? = null
    private var discovering = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        prefs = getSharedPreferences("rrlmp", Context.MODE_PRIVATE)
        val saved = prefs.getString("server_url", null)
        if (saved != null) showWebView(saved) else showSetup()
    }

    private fun showSetup() {
        webView = null
        setContentView(R.layout.activity_setup)
        val host = findViewById<EditText>(R.id.host)
        val port = findViewById<EditText>(R.id.port)
        val connect = findViewById<Button>(R.id.connect)
        val discover = findViewById<Button>(R.id.discover)

        host.setText(prefs.getString("last_host", ""))
        port.setText(prefs.getString("last_port", "8787"))

        discover.setOnClickListener { discoverServer(host, port) }

        connect.setOnClickListener {
            val h = host.text.toString().trim()
            val p = port.text.toString().trim().ifEmpty { "8787" }
            if (h.isEmpty()) {
                Toast.makeText(this, "Inserisci l'indirizzo IP del PC in regia", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            val url = "http://$h:$p/?app=1"
            prefs.edit()
                .putString("server_url", url)
                .putString("last_host", h)
                .putString("last_port", p)
                .apply()
            showWebView(url)
        }
    }

    private fun showWebView(url: String) {
        val wv = WebView(this)
        wv.settings.javaScriptEnabled = true
        wv.settings.domStorageEnabled = true
        // Wake-lock leggero: lo schermo del tablet resta acceso durante lo show,
        // finché la WebView è in primo piano.
        wv.keepScreenOn = true
        wv.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                // La pagina vive interamente sul server LAN: nessuna navigazione
                // esterna prevista, tutto resta dentro la WebView.
                return false
            }
        }
        wv.loadUrl(url)
        webView = wv
        setContentView(wv)
    }

    /**
     * Cerca il PC in regia via mDNS/DNS-SD (`_rrlmp._tcp`, pubblicato dal server
     * RRLMP). Risolve il primo servizio trovato e precompila IP+porta. Best-effort
     * con timeout di 6s: se non trova nulla, l'inserimento manuale resta la via.
     */
    private fun discoverServer(host: EditText, port: EditText) {
        if (discovering) return
        val nsd = getSystemService(Context.NSD_SERVICE) as? NsdManager ?: run {
            Toast.makeText(this, "mDNS non disponibile su questo dispositivo", Toast.LENGTH_SHORT).show()
            return
        }
        nsdManager = nsd
        discovering = true
        Toast.makeText(this, "Ricerca del PC in regia…", Toast.LENGTH_SHORT).show()

        val listener = object : NsdManager.DiscoveryListener {
            override fun onDiscoveryStarted(serviceType: String) {}
            override fun onDiscoveryStopped(serviceType: String) { discovering = false }
            override fun onStartDiscoveryFailed(serviceType: String, errorCode: Int) { discovering = false }
            override fun onStopDiscoveryFailed(serviceType: String, errorCode: Int) { discovering = false }
            override fun onServiceLost(serviceInfo: NsdServiceInfo) {}
            override fun onServiceFound(serviceInfo: NsdServiceInfo) {
                // Risolvi il primo servizio trovato e ferma la ricerca.
                try { nsd.stopServiceDiscovery(this) } catch (_: Exception) {}
                nsd.resolveService(serviceInfo, object : NsdManager.ResolveListener {
                    override fun onResolveFailed(si: NsdServiceInfo, errorCode: Int) {
                        runOnUiThread {
                            discovering = false
                            Toast.makeText(this@MainActivity, "PC trovato ma non risolvibile", Toast.LENGTH_SHORT).show()
                        }
                    }
                    override fun onServiceResolved(si: NsdServiceInfo) {
                        val addr = si.host?.hostAddress
                        runOnUiThread {
                            discovering = false
                            if (addr != null) {
                                host.setText(addr)
                                port.setText(si.port.toString())
                                Toast.makeText(this@MainActivity, "PC trovato: $addr:${si.port}", Toast.LENGTH_LONG).show()
                            }
                        }
                    }
                })
            }
        }
        discoveryListener = listener
        try {
            nsd.discoverServices("_rrlmp._tcp.", NsdManager.PROTOCOL_DNS_SD, listener)
        } catch (e: Exception) {
            discovering = false
            Toast.makeText(this, "Ricerca non avviabile: ${e.message}", Toast.LENGTH_SHORT).show()
            return
        }

        // Timeout di sicurezza: se entro 6s non ha trovato nulla, ferma la ricerca.
        host.postDelayed({
            if (discovering) {
                stopDiscovery()
                Toast.makeText(this, "Nessun PC trovato. Inserisci l'IP a mano.", Toast.LENGTH_LONG).show()
            }
        }, 6000)
    }

    private fun stopDiscovery() {
        if (!discovering) return
        try { discoveryListener?.let { nsdManager?.stopServiceDiscovery(it) } } catch (_: Exception) {}
        discovering = false
    }

    override fun onPause() {
        super.onPause()
        stopDiscovery()
    }

    override fun onCreateOptionsMenu(menu: Menu): Boolean {
        menu.add(0, MENU_CHANGE_SERVER, 0, "Cambia server")
        menu.add(0, MENU_RELOAD, 1, "Ricarica")
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            MENU_CHANGE_SERVER -> { showSetup(); true }
            MENU_RELOAD -> { webView?.reload(); true }
            else -> super.onOptionsItemSelected(item)
        }
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView?.canGoBack() == true) {
            webView?.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    private companion object {
        const val MENU_CHANGE_SERVER = 1
        const val MENU_RELOAD = 2
    }
}
