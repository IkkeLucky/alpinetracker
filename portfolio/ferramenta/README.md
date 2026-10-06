# Bottega Ferri — negozio online per ferramenta (prototipo)

Prototipo solo frontend di un negozio online per una ferramenta di quartiere (attività fittizia).
Il sito è in italiano, è statico e non richiede build: apri `index.html` oppure pubblica la cartella su Vercel/Netlify.

## Cosa mostra
- **Saracinesca d'apertura**: all'avvio la serranda si alza e si accende l'insegna al neon "APERTO".
- **Hero con torcia**: un fascio di luce illumina il laboratorio buio. Scorrendo, il titolo si stringe come in una morsa (asse `wdth` del font).
- **Nastro di cantiere**: due nastri incrociati che si muovono più veloci quando scorri.
- **Cassettiera dei reparti**: cassetti con portaetichetta e maniglia in ottone che si aprono e mostrano la foto del reparto.
- **Bancone**: cartellini del prezzo appesi che oscillano, varianti (batteria, misura), scorte al banco e animazione "vola nel carrello".
- **Su misura**, con tre configuratori:
  - kit in valigetta: le sagome nella gommapiuma si riempiono e c'è l'incisione laser sulla targhetta;
  - taglio legno: anteprima in scala sul pannello intero, segatura e prezzo al m²;
  - duplicazione chiavi: tipo, colore e numero di copie.
- **Officina**: scintille della smerigliatrice disegnate su canvas, che seguono il mouse.
- **Checkout da telefono in tre passi**: ritiro al banco, ritiro in auto o consegna in giornata, con fascia oraria. Al termine viene "stampato" lo scontrino.
- **Notifiche simulate**: SMS al cliente e WhatsApp al negozio. Il pannello "Lato negozio" segna l'ordine come pronto e avvisa il cliente.

## Cosa manca (backend, fase 2)
Ordini, pagamenti (Stripe/Satispay), invio di WhatsApp/SMS (WhatsApp Cloud API o Twilio) e gestione del magazzino.
Per ora carrello e ordini vivono solo nel `localStorage` del browser.

## Foto
Le foto sono di Unsplash e vengono caricate dal browser tramite ID (`unsplash.com/photos/<id>/download?w=…`).
Se una foto non si carica, al suo posto compare una texture "acciaio spazzolato".
Per la produzione è meglio scaricare le foto e servirle in locale (WebP).
