# Mollica · Forno & Pasticceria (prototipo)

Vetrina e negozio online per un forno artigianale (attività fittizia, Torino). È un prototipo **solo frontend**: niente backend, niente build. Apri `index.html` o servi la cartella con un server statico qualsiasi:

```bash
python3 -m http.server 8000   # poi http://localhost:8000
```

Si pubblica così com'è su Vercel, Netlify o GitHub Pages.

## Cosa mostra

| Sezione | Cosa fa |
|---|---|
| Hero | Forno a legna rivestito a mosaico: la pagnotta lievita, prende colore e si apre l'orecchio. Farina che vola e reagisce al mouse (clic = sbuffo). Prossima sfornata calcolata sull'ora reale. |
| Sfornate di oggi | Linea del tempo con le infornate del giorno, l'ago "adesso", i pezzi rimasti e il conto alla rovescia di quelle in forno. |
| Il bancone | Catalogo con illustrazioni SVG originali, cartellino del prezzo che oscilla, prezzo al kg, allergeni UE, opzioni (ripieno, formato, affettatura). Il prodotto "vola" nel sacchetto. |
| Torte su misura | Configuratore: piani, porzioni (→ diametro e peso), impasto, farcitura, copertura (panna, ganache con colature, pasta di zucchero colorata, naked), decorazioni, scritta "spremuta col sac à poche", vista della fetta, prezzo al grammo, 48 ore di preavviso. |
| 48 ore | Il processo del lievito madre: l'impasto cresce, si riempie di bolle, si taglia e si cuoce mentre scorri. |
| Checkout | Tre passi ottimizzati per il telefono: ritiro/consegna (verifica CAP), orari a 15 minuti con quelli "appena sfornato", dati, pagamento (Apple Pay, Google Pay, Satispay, carta, al ritiro). Conferma col biglietto dell'eliminacode. |
| Avvisi | Anteprima del messaggio WhatsApp al cliente, campanello e avviso al titolare, messaggio "è pronto". |
| Vista titolare | Ordini in arrivo, stati (nuovo → in preparazione → pronto → consegnato), incasso, registro avvisi WhatsApp/SMS. Apri `index.html#titolare` in un'altra scheda: gli ordini arrivano in tempo reale (BroadcastChannel). |

## Cosa è simulato

Pagamenti, messaggi WhatsApp/SMS, disponibilità degli orari e quantità rimaste. Ordini e sacchetto restano nel `localStorage` del browser.

## Per la versione con backend

- Prodotti, sfornate e orari → database gestito dal titolare (ora in `js/data.js`)
- Pagamenti → Stripe (carte, Apple/Google Pay) e Satispay
- Avvisi → WhatsApp Business Cloud API + SMS di riserva
- Vista titolare → realtime (es. Supabase) al posto di `BroadcastChannel`

## File

```
index.html        struttura della pagina
css/style.css     identità visiva, animazioni, layout mobile
js/data.js        catalogo, sfornate, opzioni torta, utilità
js/art.js         illustrazioni SVG dei prodotti
js/app.js         sacchetto, bancone, sfornate, hero, 48 ore, avvisi, ordini
js/cake.js        configuratore torte
js/checkout.js    checkout, biglietto, messaggi al cliente
js/owner.js       vista titolare
```
