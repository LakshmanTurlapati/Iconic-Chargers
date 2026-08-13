// Static-page copy that is not already present in web/locales.js. Badge
// explanations, notes, country names, regions, reasons, and map UI labels come
// from that canonical catalog; this module supplies the crawlable-site chrome.

const en = {
  labels: {
    map: "Map", badges: "Badges", locations: "Locations", about: "About",
    data: "Data", home: "Home", source: "Source documentation", github: "GitHub",
    badgeDirectory: "Iconic Charger badges", locationDirectory: "Supercharger locations",
    methodology: "Methodology", provenance: "Sources and provenance",
    uncertainty: "Uncertainty", rights: "Data rights", downloads: "Downloads",
    citation: "How to cite", locationsForBadge: "Locations for this badge",
    badgeForLocation: "Badge relationship", confidence: "Confidence", exact: "Exact",
    approximate: "Approximate", notes: "Notes", details: "Site facts",
    sourceIds: "Source identifiers", openMap: "Open on the interactive map",
    viewPage: "View details", snapshot: "Snapshot", author: "Author", status: "Status"
  },
  text: {
    intro: "An independent atlas of 40 Tesla Charging Passport badges and 53 mapped Supercharger sites worldwide.",
    disclaimer: "Iconic Chargers is independent, is not affiliated with or endorsed by Tesla, and does not show live charger availability.",
    badgeIntro: "Browse every badge recorded from the Tesla app and the Supercharger sites mapped to it in this snapshot.",
    locationIntro: "Browse the worldwide Supercharger sites associated with the recorded Iconic Charger badges.",
    aboutIntro: "Iconic Chargers documents Tesla Charging Passport badges and maps them to real Supercharger sites so the collection can be explored, checked, and cited on the open web.",
    methodology: "Badge names were transcribed from the Tesla app. Site facts were joined to the public Supercharge.info register. A badge may correspond to more than one Supercharger.",
    provenance: "Badge names are a user-supplied snapshot of the Tesla app. Addresses, coordinates, stalls, power, opening dates, status, and source identifiers come from Supercharge.info.",
    uncertainty: "Exact means the badge name and site are directly matched or only one live site fits the landmark. Approximate means the project selected the best candidate by proximity because Tesla does not publish the complete mapping.",
    dataIntro: "Download the canonical English snapshot as JSON, CSV, or GeoJSON. Each location record includes its badge relationship, confidence, explanation, note, source identifiers, and page URLs.",
    rights: "Lakshman Turlapati’s original mappings, selection, and editorial text are licensed CC BY 4.0. That license does not cover upstream Supercharge.info facts, Tesla names or trademarks, or basemap data."
  }
};

const translations = {
  fr: {
    labels: { map: "Carte", badges: "Badges", locations: "Sites", about: "À propos", data: "Données", home: "Accueil", source: "Documentation source", badgeDirectory: "Badges Iconic Charger", locationDirectory: "Sites Supercharger", methodology: "Méthodologie", provenance: "Sources et provenance", uncertainty: "Incertitude", rights: "Droits sur les données", downloads: "Téléchargements", citation: "Comment citer", locationsForBadge: "Sites associés à ce badge", badgeForLocation: "Lien avec le badge", confidence: "Confiance", exact: "Exact", approximate: "Approximatif", notes: "Notes", details: "Détails du site", sourceIds: "Identifiants source", openMap: "Ouvrir sur la carte interactive", viewPage: "Voir les détails", snapshot: "Instantané", author: "Auteur", status: "État" },
    text: {
      intro: "Un atlas indépendant de 40 badges Tesla Charging Passport et de 53 sites Supercharger cartographiés dans le monde.",
      disclaimer: "Iconic Chargers est indépendant, sans affiliation ni approbation de Tesla, et n’indique pas la disponibilité en direct.",
      badgeIntro: "Parcourez tous les badges relevés dans l’application Tesla et les sites Supercharger qui leur sont associés dans cet instantané.",
      locationIntro: "Parcourez les sites Supercharger du monde associés aux badges Iconic Charger relevés.",
      aboutIntro: "Iconic Chargers documente les badges Tesla Charging Passport et les relie à des sites Supercharger réels afin que la collection puisse être explorée, vérifiée et citée sur le Web ouvert.",
      methodology: "Les noms des badges ont été transcrits depuis l’application Tesla. Les données des sites ont été rapprochées du registre public Supercharge.info. Un badge peut correspondre à plusieurs sites Supercharger.",
      provenance: "Les noms des badges constituent un instantané de l’application Tesla fourni par un utilisateur. Les adresses, coordonnées, nombres de bornes, puissances, dates d’ouverture, états et identifiants source proviennent de Supercharge.info.",
      uncertainty: "« Exact » signifie que le badge et le site correspondent directement, ou qu’un seul site en service correspond au lieu emblématique. « Approximatif » signifie que le projet a retenu le meilleur candidat selon la proximité, car Tesla ne publie pas la correspondance complète.",
      dataIntro: "Téléchargez l’instantané canonique en anglais aux formats JSON, CSV ou GeoJSON.",
      rights: "Les correspondances, la sélection et les textes éditoriaux originaux de Lakshman Turlapati sont sous licence CC BY 4.0. Cette licence ne couvre ni les données tierces de Supercharge.info, ni les noms ou marques de Tesla, ni les données du fond de carte."
    }
  },
  de: {
    labels: { map: "Karte", badges: "Badges", locations: "Standorte", about: "Über das Projekt", data: "Daten", home: "Start", source: "Quelldokumentation", badgeDirectory: "Iconic-Charger-Badges", locationDirectory: "Supercharger-Standorte", methodology: "Methodik", provenance: "Quellen und Herkunft", uncertainty: "Unsicherheit", rights: "Datenrechte", downloads: "Downloads", citation: "Zitierweise", locationsForBadge: "Standorte für dieses Badge", badgeForLocation: "Badge-Zuordnung", confidence: "Sicherheit", exact: "Exakt", approximate: "Ungefähr", notes: "Hinweise", details: "Standortdaten", sourceIds: "Quellkennungen", openMap: "Auf der interaktiven Karte öffnen", viewPage: "Details ansehen", snapshot: "Datenstand", author: "Autor", status: "Status" },
    text: {
      intro: "Ein unabhängiger Atlas mit 40 Tesla-Charging-Passport-Badges und 53 kartierten Supercharger-Standorten weltweit.",
      disclaimer: "Iconic Chargers ist unabhängig, weder mit Tesla verbunden noch von Tesla unterstützt und zeigt keine Live-Verfügbarkeit.",
      badgeIntro: "Alle in der Tesla-App erfassten Badges und die ihnen in diesem Datenstand zugeordneten Supercharger-Standorte.",
      locationIntro: "Weltweite Supercharger-Standorte, die den erfassten Iconic-Charger-Badges zugeordnet sind.",
      aboutIntro: "Iconic Chargers dokumentiert Tesla-Charging-Passport-Badges und ordnet sie realen Supercharger-Standorten zu, damit die Sammlung im offenen Web erkundet, geprüft und zitiert werden kann.",
      methodology: "Die Badge-Namen wurden aus der Tesla-App übertragen. Die Standortdaten wurden mit dem öffentlichen Verzeichnis von Supercharge.info verknüpft. Ein Badge kann mehreren Supercharger-Standorten entsprechen.",
      provenance: "Die Badge-Namen stammen aus einem von einem Nutzer bereitgestellten Datenstand der Tesla-App. Adressen, Koordinaten, Ladeplätze, Leistung, Eröffnungsdaten, Status und Quellkennungen stammen von Supercharge.info.",
      uncertainty: "„Exakt“ bedeutet, dass Badge und Standort direkt zugeordnet sind oder nur ein aktiver Standort zum Wahrzeichen passt. „Ungefähr“ bedeutet, dass das Projekt anhand der Nähe den besten Kandidaten ausgewählt hat, weil Tesla die vollständige Zuordnung nicht veröffentlicht.",
      dataIntro: "Der kanonische englische Datenstand steht als JSON, CSV und GeoJSON zum Download bereit.",
      rights: "Die ursprünglichen Zuordnungen, die Auswahl und die redaktionellen Texte von Lakshman Turlapati sind unter CC BY 4.0 lizenziert. Diese Lizenz gilt nicht für zugrunde liegende Fakten von Supercharge.info, Namen oder Marken von Tesla oder Grundkartendaten."
    }
  },
  nl: {
    labels: { map: "Kaart", badges: "Badges", locations: "Locaties", about: "Over", data: "Data", home: "Home", source: "Brondocumentatie", badgeDirectory: "Iconic Charger-badges", locationDirectory: "Supercharger-locaties", methodology: "Methode", provenance: "Bronnen en herkomst", uncertainty: "Onzekerheid", rights: "Datarechten", downloads: "Downloads", citation: "Citeren", locationsForBadge: "Locaties voor deze badge", badgeForLocation: "Relatie met badge", confidence: "Zekerheid", exact: "Exact", approximate: "Bij benadering", notes: "Notities", details: "Locatiegegevens", sourceIds: "Bron-ID’s", openMap: "Openen op de interactieve kaart", viewPage: "Details bekijken", snapshot: "Momentopname", author: "Auteur", status: "Status" },
    text: {
      intro: "Een onafhankelijke atlas van 40 Tesla Charging Passport-badges en 53 in kaart gebrachte Supercharger-locaties wereldwijd.",
      disclaimer: "Iconic Chargers is onafhankelijk, niet verbonden met of goedgekeurd door Tesla en toont geen live beschikbaarheid.",
      badgeIntro: "Bekijk elke badge uit de Tesla-app en de Supercharger-locaties die er in deze momentopname aan zijn gekoppeld.",
      locationIntro: "Bekijk de wereldwijde Supercharger-locaties die bij de vastgelegde Iconic Charger-badges horen.",
      aboutIntro: "Iconic Chargers documenteert Tesla Charging Passport-badges en koppelt ze aan echte Supercharger-locaties, zodat de verzameling op het open web kan worden verkend, gecontroleerd en geciteerd.",
      methodology: "De badgenamen zijn overgenomen uit de Tesla-app. De locatiegegevens zijn gekoppeld aan het openbare register van Supercharge.info. Eén badge kan bij meerdere Supercharger-locaties horen.",
      provenance: "De badgenamen komen uit een door een gebruiker aangeleverde momentopname van de Tesla-app. Adressen, coördinaten, laadpunten, vermogen, openingsdatums, status en bron-ID’s zijn afkomstig van Supercharge.info.",
      uncertainty: "‘Exact’ betekent dat de badge en locatie rechtstreeks overeenkomen, of dat slechts één actieve locatie bij het herkenningspunt past. ‘Bij benadering’ betekent dat het project op basis van nabijheid de beste kandidaat koos, omdat Tesla de volledige koppeling niet publiceert.",
      dataIntro: "Download de canonieke Engelstalige momentopname als JSON, CSV of GeoJSON.",
      rights: "De oorspronkelijke koppelingen, selectie en redactionele teksten van Lakshman Turlapati vallen onder CC BY 4.0. Die licentie geldt niet voor onderliggende feiten van Supercharge.info, namen of handelsmerken van Tesla, of gegevens van de basiskaart."
    }
  },
  nb: {
    labels: { map: "Kart", badges: "Merker", locations: "Ladesteder", about: "Om", data: "Data", home: "Hjem", source: "Kildedokumentasjon", badgeDirectory: "Iconic Charger-merker", locationDirectory: "Supercharger-ladesteder", methodology: "Metode", provenance: "Kilder og opphav", uncertainty: "Usikkerhet", rights: "Datarettigheter", downloads: "Nedlastinger", citation: "Slik siterer du", locationsForBadge: "Ladesteder for dette merket", badgeForLocation: "Merketilknytning", confidence: "Sikkerhet", exact: "Eksakt", approximate: "Omtrentlig", notes: "Merknader", details: "Stedsdata", sourceIds: "Kilde-ID-er", openMap: "Åpne på det interaktive kartet", viewPage: "Vis detaljer", snapshot: "Øyeblikksbilde", author: "Forfatter", status: "Status" },
    text: {
      intro: "Et uavhengig atlas med 40 Tesla Charging Passport-merker og 53 kartlagte Supercharger-ladesteder verden over.",
      disclaimer: "Iconic Chargers er uavhengig, ikke tilknyttet eller godkjent av Tesla, og viser ikke tilgjengelighet i sanntid.",
      badgeIntro: "Se alle merkene registrert fra Tesla-appen og Supercharger-ladestedene som er koblet til dem i dette øyeblikksbildet.",
      locationIntro: "Se Supercharger-ladesteder verden over som er knyttet til de registrerte Iconic Charger-merkene.",
      aboutIntro: "Iconic Chargers dokumenterer Tesla Charging Passport-merker og kobler dem til virkelige Supercharger-ladesteder, slik at samlingen kan utforskes, kontrolleres og siteres på det åpne nettet.",
      methodology: "Navnene på merkene ble skrevet av fra Tesla-appen. Stedsopplysningene ble koblet til det offentlige registeret hos Supercharge.info. Ett merke kan tilsvare flere Supercharger-ladesteder.",
      provenance: "Navnene på merkene kommer fra et brukerlevert øyeblikksbilde av Tesla-appen. Adresser, koordinater, ladeplasser, effekt, åpningsdatoer, status og kilde-ID-er kommer fra Supercharge.info.",
      uncertainty: "«Eksakt» betyr at merket og ladestedet er direkte samsvarende, eller at bare ett aktivt ladested passer til landemerket. «Omtrentlig» betyr at prosjektet valgte den beste kandidaten ut fra nærhet fordi Tesla ikke publiserer hele koblingen.",
      dataIntro: "Last ned det kanoniske engelske øyeblikksbildet som JSON, CSV eller GeoJSON.",
      rights: "Lakshman Turlapatis opprinnelige koblinger, utvalg og redaksjonelle tekst er lisensiert under CC BY 4.0. Lisensen omfatter ikke underliggende fakta fra Supercharge.info, Teslas navn eller varemerker eller bakgrunnskartdata."
    }
  },
  nn: {
    labels: { map: "Kart", badges: "Merke", locations: "Ladestader", about: "Om", data: "Data", home: "Heim", source: "Kjeldedokumentasjon", badgeDirectory: "Iconic Charger-merke", locationDirectory: "Supercharger-ladestader", methodology: "Metode", provenance: "Kjelder og opphav", uncertainty: "Uvisse", rights: "Datarettar", downloads: "Nedlastingar", citation: "Slik siterer du", locationsForBadge: "Ladestader for dette merket", badgeForLocation: "Merketilknyting", confidence: "Visse", exact: "Eksakt", approximate: "Omtrentleg", notes: "Merknader", details: "Staddata", sourceIds: "Kjelde-ID-ar", openMap: "Opne på det interaktive kartet", viewPage: "Vis detaljar", snapshot: "Augneblinksbilete", author: "Forfattar", status: "Status" },
    text: {
      intro: "Eit uavhengig atlas med 40 Tesla Charging Passport-merke og 53 kartlagde Supercharger-ladestader verda over.",
      disclaimer: "Iconic Chargers er uavhengig, ikkje knytt til eller godkjent av Tesla, og viser ikkje tilgjenge i sanntid.",
      badgeIntro: "Sjå alle merka registrerte frå Tesla-appen og Supercharger-ladestadene som er kopla til dei i dette augneblinksbiletet.",
      locationIntro: "Sjå Supercharger-ladestader verda over som er knytte til dei registrerte Iconic Charger-merka.",
      aboutIntro: "Iconic Chargers dokumenterer Tesla Charging Passport-merke og koplar dei til verkelege Supercharger-ladestader, slik at samlinga kan utforskast, kontrollerast og siterast på det opne nettet.",
      methodology: "Namn på merka vart skrivne av frå Tesla-appen. Stadopplysningane vart kopla til det offentlege registeret hos Supercharge.info. Eitt merke kan svare til fleire Supercharger-ladestader.",
      provenance: "Namn på merka kjem frå eit brukarinnsendt augneblinksbilete av Tesla-appen. Adresser, koordinatar, ladeplassar, effekt, opningsdatoar, status og kjelde-ID-ar kjem frå Supercharge.info.",
      uncertainty: "«Eksakt» tyder at merket og ladestaden er direkte samsvarande, eller at berre éin aktiv ladestad passar til landemerket. «Omtrentleg» tyder at prosjektet valde den beste kandidaten ut frå nærleik fordi Tesla ikkje publiserer heile koplinga.",
      dataIntro: "Last ned det kanoniske engelske augneblinksbiletet som JSON, CSV eller GeoJSON.",
      rights: "Dei opphavlege koplingane, utvalet og redaksjonelle tekstane til Lakshman Turlapati er lisensierte under CC BY 4.0. Lisensen omfattar ikkje underliggjande fakta frå Supercharge.info, namn eller varemerke frå Tesla eller bakgrunnskartdata."
    }
  },
  it: {
    labels: { map: "Mappa", badges: "Badge", locations: "Siti", about: "Informazioni", data: "Dati", home: "Home", source: "Documentazione delle fonti", badgeDirectory: "Badge Iconic Charger", locationDirectory: "Siti Supercharger", methodology: "Metodologia", provenance: "Fonti e provenienza", uncertainty: "Incertezza", rights: "Diritti sui dati", downloads: "Download", citation: "Come citare", locationsForBadge: "Siti per questo badge", badgeForLocation: "Relazione con il badge", confidence: "Affidabilità", exact: "Esatta", approximate: "Approssimativa", notes: "Note", details: "Dati del sito", sourceIds: "Identificatori fonte", openMap: "Apri sulla mappa interattiva", viewPage: "Vedi dettagli", snapshot: "Istantanea", author: "Autore", status: "Stato" },
    text: {
      intro: "Un atlante indipendente di 40 badge Tesla Charging Passport e 53 siti Supercharger mappati nel mondo.",
      disclaimer: "Iconic Chargers è indipendente, non è affiliato né approvato da Tesla e non mostra la disponibilità in tempo reale.",
      badgeIntro: "Esplora tutti i badge rilevati nell’app Tesla e i siti Supercharger associati in questa istantanea.",
      locationIntro: "Esplora i siti Supercharger nel mondo associati ai badge Iconic Charger registrati.",
      aboutIntro: "Iconic Chargers documenta i badge Tesla Charging Passport e li associa a siti Supercharger reali, affinché la raccolta possa essere esplorata, verificata e citata sul Web aperto.",
      methodology: "I nomi dei badge sono stati trascritti dall’app Tesla. I dati dei siti sono stati collegati al registro pubblico Supercharge.info. Un badge può corrispondere a più siti Supercharger.",
      provenance: "I nomi dei badge provengono da un’istantanea dell’app Tesla fornita da un utente. Indirizzi, coordinate, stalli, potenza, date di apertura, stato e identificatori delle fonti provengono da Supercharge.info.",
      uncertainty: "«Esatta» indica che badge e sito coincidono direttamente, oppure che un solo sito attivo corrisponde al punto di riferimento. «Approssimativa» indica che il progetto ha scelto il candidato migliore in base alla vicinanza, poiché Tesla non pubblica la corrispondenza completa.",
      dataIntro: "Scarica l’istantanea canonica in inglese nei formati JSON, CSV o GeoJSON.",
      rights: "Le associazioni, la selezione e i testi editoriali originali di Lakshman Turlapati sono concessi con licenza CC BY 4.0. La licenza non comprende i dati di fonte Supercharge.info, i nomi o marchi Tesla né i dati della mappa di base."
    }
  },
  es: {
    labels: { map: "Mapa", badges: "Insignias", locations: "Ubicaciones", about: "Acerca de", data: "Datos", home: "Inicio", source: "Documentación de fuentes", badgeDirectory: "Insignias Iconic Charger", locationDirectory: "Ubicaciones Supercharger", methodology: "Metodología", provenance: "Fuentes y procedencia", uncertainty: "Incertidumbre", rights: "Derechos de los datos", downloads: "Descargas", citation: "Cómo citar", locationsForBadge: "Ubicaciones de esta insignia", badgeForLocation: "Relación con la insignia", confidence: "Confianza", exact: "Exacta", approximate: "Aproximada", notes: "Notas", details: "Datos del sitio", sourceIds: "Identificadores de origen", openMap: "Abrir en el mapa interactivo", viewPage: "Ver detalles", snapshot: "Instantánea", author: "Autor", status: "Estado" },
    text: {
      intro: "Un atlas independiente de 40 insignias Tesla Charging Passport y 53 ubicaciones Supercharger cartografiadas en todo el mundo.",
      disclaimer: "Iconic Chargers es independiente, no está afiliado ni respaldado por Tesla y no muestra disponibilidad en tiempo real.",
      badgeIntro: "Explora todas las insignias registradas en la aplicación Tesla y los sitios Supercharger vinculados en esta instantánea.",
      locationIntro: "Explora los sitios Supercharger del mundo asociados a las insignias Iconic Charger registradas.",
      aboutIntro: "Iconic Chargers documenta las insignias Tesla Charging Passport y las vincula con sitios Supercharger reales para que la colección pueda explorarse, comprobarse y citarse en la web abierta.",
      methodology: "Los nombres de las insignias se transcribieron de la aplicación Tesla. Los datos de los sitios se vincularon con el registro público de Supercharge.info. Una insignia puede corresponder a más de un sitio Supercharger.",
      provenance: "Los nombres de las insignias proceden de una instantánea de la aplicación Tesla aportada por un usuario. Las direcciones, coordenadas, puestos, potencia, fechas de apertura, estado e identificadores de origen proceden de Supercharge.info.",
      uncertainty: "«Exacta» significa que la insignia y el sitio coinciden directamente, o que solo un sitio activo encaja con el punto de referencia. «Aproximada» significa que el proyecto eligió el mejor candidato por proximidad, ya que Tesla no publica la correspondencia completa.",
      dataIntro: "Descarga la instantánea canónica en inglés como JSON, CSV o GeoJSON.",
      rights: "Las asociaciones, la selección y los textos editoriales originales de Lakshman Turlapati se ofrecen bajo CC BY 4.0. La licencia no cubre los datos de origen de Supercharge.info, los nombres o marcas de Tesla ni los datos del mapa base."
    }
  },
  tr: {
    labels: { map: "Harita", badges: "Rozetler", locations: "Konumlar", about: "Hakkında", data: "Veri", home: "Ana sayfa", source: "Kaynak belgeleri", badgeDirectory: "Iconic Charger rozetleri", locationDirectory: "Supercharger konumları", methodology: "Yöntem", provenance: "Kaynaklar ve köken", uncertainty: "Belirsizlik", rights: "Veri hakları", downloads: "İndirmeler", citation: "Atıf biçimi", locationsForBadge: "Bu rozetin konumları", badgeForLocation: "Rozet ilişkisi", confidence: "Güven", exact: "Kesin", approximate: "Yaklaşık", notes: "Notlar", details: "Konum bilgileri", sourceIds: "Kaynak kimlikleri", openMap: "Etkileşimli haritada aç", viewPage: "Ayrıntıları gör", snapshot: "Anlık görüntü", author: "Yazar", status: "Durum" },
    text: {
      intro: "Dünya çapında 40 Tesla Charging Passport rozeti ve haritalanmış 53 Supercharger konumundan oluşan bağımsız bir atlas.",
      disclaimer: "Iconic Chargers bağımsızdır, Tesla ile bağlantılı veya Tesla tarafından onaylanmış değildir ve canlı doluluk göstermez.",
      badgeIntro: "Tesla uygulamasından kaydedilen tüm rozetleri ve bu anlık görüntüde eşlenen Supercharger konumlarını inceleyin.",
      locationIntro: "Kaydedilen Iconic Charger rozetleriyle ilişkili dünya çapındaki Supercharger konumlarını inceleyin.",
      aboutIntro: "Iconic Chargers, koleksiyonun açık web’de incelenebilmesi, doğrulanabilmesi ve kaynak gösterilebilmesi için Tesla Charging Passport rozetlerini gerçek Supercharger konumlarıyla eşler.",
      methodology: "Rozet adları Tesla uygulamasından aktarıldı. Konum bilgileri, Supercharge.info’nun herkese açık kaydıyla eşleştirildi. Bir rozet birden fazla Supercharger konumuna karşılık gelebilir.",
      provenance: "Rozet adları, Tesla uygulamasının kullanıcı tarafından sağlanan bir anlık görüntüsünden alınmıştır. Adresler, koordinatlar, şarj noktası sayıları, güç, açılış tarihleri, durum ve kaynak kimlikleri Supercharge.info’dan gelir.",
      uncertainty: "“Kesin”, rozet ile konumun doğrudan eşleştiği veya simge yapıya uyan yalnızca bir faal konum bulunduğu anlamına gelir. “Yaklaşık”, Tesla tam eşleştirmeyi yayımlamadığı için projenin yakınlığa göre en iyi adayı seçtiği anlamına gelir.",
      dataIntro: "Kanonik İngilizce anlık görüntüyü JSON, CSV veya GeoJSON olarak indirin.",
      rights: "Lakshman Turlapati’nin özgün eşleştirmeleri, seçimi ve editoryal metni CC BY 4.0 ile lisanslanmıştır. Bu lisans, Supercharge.info’dan alınan kaynak verileri, Tesla adlarını veya ticari markalarını ya da altlık harita verilerini kapsamaz."
    }
  },
  cs: {
    labels: { map: "Mapa", badges: "Odznaky", locations: "Lokality", about: "O projektu", data: "Data", home: "Domů", source: "Dokumentace zdrojů", badgeDirectory: "Odznaky Iconic Charger", locationDirectory: "Lokality Supercharger", methodology: "Metodika", provenance: "Zdroje a původ", uncertainty: "Nejistota", rights: "Práva k datům", downloads: "Ke stažení", citation: "Jak citovat", locationsForBadge: "Lokality tohoto odznaku", badgeForLocation: "Vztah k odznaku", confidence: "Jistota", exact: "Přesná", approximate: "Přibližná", notes: "Poznámky", details: "Údaje o lokalitě", sourceIds: "Identifikátory zdroje", openMap: "Otevřít na interaktivní mapě", viewPage: "Zobrazit podrobnosti", snapshot: "Snímek", author: "Autor", status: "Stav" },
    text: {
      intro: "Nezávislý atlas 40 odznaků Tesla Charging Passport a 53 zmapovaných lokalit Supercharger po celém světě.",
      disclaimer: "Iconic Chargers je nezávislý projekt, není spojen se společností Tesla ani jí podporován a neukazuje živou dostupnost.",
      badgeIntro: "Projděte si všechny odznaky zaznamenané z aplikace Tesla a lokality Supercharger, které jsou k nim v tomto snímku přiřazeny.",
      locationIntro: "Projděte si světové lokality Supercharger spojené se zaznamenanými odznaky Iconic Charger.",
      aboutIntro: "Iconic Chargers dokumentuje odznaky Tesla Charging Passport a přiřazuje je ke skutečným lokalitám Supercharger, aby bylo možné sbírku na otevřeném webu procházet, kontrolovat a citovat.",
      methodology: "Názvy odznaků byly přepsány z aplikace Tesla. Údaje o lokalitách byly propojeny s veřejným registrem Supercharge.info. Jeden odznak může odpovídat více lokalitám Supercharger.",
      provenance: "Názvy odznaků pocházejí z uživatelem poskytnutého snímku aplikace Tesla. Adresy, souřadnice, počty stojanů, výkon, data otevření, stav a identifikátory zdrojů pocházejí ze Supercharge.info.",
      uncertainty: "„Přesná“ znamená, že odznak a lokalita jsou přímo spárovány nebo že památce odpovídá jediná aktivní lokalita. „Přibližná“ znamená, že projekt vybral podle blízkosti nejlepšího kandidáta, protože Tesla úplné přiřazení nezveřejňuje.",
      dataIntro: "Stáhněte si kanonický anglický snímek ve formátu JSON, CSV nebo GeoJSON.",
      rights: "Původní přiřazení, výběr a redakční texty Lakshmana Turlapatiho jsou licencovány pod CC BY 4.0. Licence se nevztahuje na podkladová fakta ze Supercharge.info, názvy ani ochranné známky společnosti Tesla ani na data podkladové mapy."
    }
  },
  he: {
    labels: { map: "מפה", badges: "תגים", locations: "אתרים", about: "אודות", data: "נתונים", home: "בית", source: "תיעוד המקורות", badgeDirectory: "תגי מטענים איקוניים", locationDirectory: "אתרי סופרצ׳רג׳ר", methodology: "מתודולוגיה", provenance: "מקורות ומוצא הנתונים", uncertainty: "אי־ודאות", rights: "זכויות נתונים", downloads: "הורדות", citation: "כיצד לצטט", locationsForBadge: "אתרים לתג הזה", badgeForLocation: "הקשר לתג", confidence: "רמת ודאות", exact: "מדויק", approximate: "משוער", notes: "הערות", details: "פרטי האתר", sourceIds: "מזהי מקור", openMap: "פתיחה במפה האינטראקטיבית", viewPage: "הצגת פרטים", snapshot: "תמונת מצב", author: "מחבר", status: "מצב" },
    text: {
      intro: "אטלס עצמאי של 40 תגי Tesla Charging Passport ושל 53 אתרי סופרצ׳רג׳ר ממופים ברחבי העולם.",
      disclaimer: "Iconic Chargers הוא מיזם עצמאי, אינו קשור ל‑Tesla או מאושר על ידה ואינו מציג זמינות בזמן אמת.",
      badgeIntro: "עיון בכל התגים שתועדו מאפליקציית Tesla ובאתרי הסופרצ׳רג׳ר ששויכו אליהם בתמונת מצב זו.",
      locationIntro: "עיון באתרי הסופרצ׳רג׳ר ברחבי העולם המשויכים לתגי המטענים האיקוניים שתועדו.",
      aboutIntro: "Iconic Chargers מתעד תגי Tesla Charging Passport וממפה אותם לאתרי סופרצ׳רג׳ר אמיתיים כדי שאפשר יהיה לחקור, לבדוק ולצטט את האוסף ברשת הפתוחה.",
      methodology: "שמות התגים הועתקו מאפליקציית Tesla. נתוני האתרים קושרו למאגר הציבורי של Supercharge.info. תג אחד עשוי להתאים ליותר מאתר סופרצ׳רג׳ר אחד.",
      provenance: "שמות התגים מקורם בתמונת מצב של אפליקציית Tesla שסיפק משתמש. כתובות, קואורדינטות, מספרי עמדות, הספק, תאריכי פתיחה, מצב ומזהי מקור מגיעים מ‑Supercharge.info.",
      uncertainty: "״מדויק״ פירושו שיש התאמה ישירה בין התג לאתר, או שרק אתר פעיל אחד מתאים לציון הדרך. ״משוער״ פירושו שהפרויקט בחר את המועמד הטוב ביותר לפי קרבה, משום ש‑Tesla אינה מפרסמת את המיפוי המלא.",
      dataIntro: "הורדת תמונת המצב הקנונית באנגלית כ‑JSON,‏ CSV או GeoJSON.",
      rights: "המיפויים, הבחירה והטקסטים העריכתיים המקוריים של Lakshman Turlapati מורשים לפי CC BY 4.0. הרישיון אינו חל על עובדות המקור מ‑Supercharge.info, על שמות או סימני מסחר של Tesla או על נתוני מפת הבסיס."
    }
  },
  ar: {
    labels: { map: "الخريطة", badges: "الشارات", locations: "المواقع", about: "حول المشروع", data: "البيانات", home: "الرئيسية", source: "توثيق المصادر", badgeDirectory: "شارات الشواحن الأيقونية", locationDirectory: "مواقع الشواحن الفائقة", methodology: "المنهجية", provenance: "المصادر والمنشأ", uncertainty: "عدم اليقين", rights: "حقوق البيانات", downloads: "التنزيلات", citation: "طريقة الاستشهاد", locationsForBadge: "مواقع هذه الشارة", badgeForLocation: "العلاقة بالشارة", confidence: "الثقة", exact: "دقيق", approximate: "تقريبي", notes: "ملاحظات", details: "بيانات الموقع", sourceIds: "معرّفات المصدر", openMap: "فتح على الخريطة التفاعلية", viewPage: "عرض التفاصيل", snapshot: "لقطة البيانات", author: "المؤلف", status: "الحالة" },
    text: {
      intro: "أطلس مستقل يضم 40 شارة من Tesla Charging Passport و53 موقع Supercharger موثقًا حول العالم.",
      disclaimer: "Iconic Chargers مشروع مستقل، غير تابع لـTesla ولا معتمد منها، ولا يعرض التوفر المباشر للشواحن.",
      badgeIntro: "تصفح جميع الشارات المسجلة من تطبيق Tesla ومواقع Supercharger المرتبطة بها في لقطة البيانات هذه.",
      locationIntro: "تصفح مواقع Supercharger حول العالم المرتبطة بشارات الشواحن الأيقونية المسجلة.",
      aboutIntro: "يوثق Iconic Chargers شارات Tesla Charging Passport ويربطها بمواقع Supercharger حقيقية حتى يمكن استكشاف المجموعة والتحقق منها والاستشهاد بها على الويب المفتوح.",
      methodology: "نُقلت أسماء الشارات من تطبيق Tesla. وربطت بيانات المواقع بالسجل العام لدى Supercharge.info. وقد تقابل الشارة الواحدة أكثر من موقع Supercharger.",
      provenance: "تأتي أسماء الشارات من لقطة لتطبيق Tesla قدّمها مستخدم. أما العناوين والإحداثيات وعدد نقاط الشحن والقدرة وتواريخ الافتتاح والحالة ومعرّفات المصدر فتأتي من Supercharge.info.",
      uncertainty: "تعني «دقيق» أن الشارة والموقع متطابقان مباشرة، أو أن موقعًا عاملًا واحدًا فقط يناسب المعلم. وتعني «تقريبي» أن المشروع اختار أفضل مرشح حسب القرب لأن Tesla لا تنشر الربط الكامل.",
      dataIntro: "نزّل لقطة البيانات الإنجليزية المرجعية بصيغة JSON أو CSV أو GeoJSON.",
      rights: "تُرخّص أعمال Lakshman Turlapati الأصلية في الربط والاختيار والنص التحريري بموجب CC BY 4.0. ولا يشمل الترخيص الحقائق الواردة من Supercharge.info، أو أسماء Tesla وعلاماتها التجارية، أو بيانات خريطة الأساس."
    }
  },
  ja: {
    labels: { map: "地図", badges: "バッジ", locations: "充電地点", about: "このサイトについて", data: "データ", home: "ホーム", source: "出典資料", badgeDirectory: "アイコニックチャージャーのバッジ", locationDirectory: "スーパーチャージャー所在地", methodology: "調査方法", provenance: "出典と来歴", uncertainty: "不確実性", rights: "データの権利", downloads: "ダウンロード", citation: "引用方法", locationsForBadge: "このバッジの充電地点", badgeForLocation: "バッジとの関係", confidence: "確度", exact: "確実", approximate: "推定", notes: "注記", details: "所在地の情報", sourceIds: "出典ID", openMap: "インタラクティブ地図で開く", viewPage: "詳細を見る", snapshot: "スナップショット", author: "作成者", status: "状態" },
    text: {
      intro: "Tesla Charging Passportの40個のバッジと、世界53か所のスーパーチャージャーをまとめた独立系アトラスです。",
      disclaimer: "Iconic Chargersは独立したプロジェクトであり、Teslaとの提携・承認関係はなく、リアルタイムの空き状況は表示しません。",
      badgeIntro: "Teslaアプリから記録したすべてのバッジと、このスナップショットで対応付けたスーパーチャージャー所在地を閲覧できます。",
      locationIntro: "記録されたアイコニックチャージャーのバッジに関連する世界のスーパーチャージャー所在地を閲覧できます。",
      aboutIntro: "Iconic ChargersはTesla Charging Passportのバッジを記録し、実在するスーパーチャージャー所在地に対応付けることで、オープンウェブ上での探索・検証・引用を可能にします。",
      methodology: "バッジ名はTeslaアプリから転記しました。所在地情報は公開されているSupercharge.infoの登録情報と照合しました。1つのバッジが複数のスーパーチャージャー所在地に対応する場合があります。",
      provenance: "バッジ名は、利用者が提供したTeslaアプリのスナップショットに基づきます。住所、座標、充電器数、最大出力、開設日、稼働状況、出典IDはSupercharge.infoに基づきます。",
      uncertainty: "「確実」は、バッジと所在地が直接一致するか、そのランドマークに該当する稼働中の所在地が1か所だけであることを示します。「推定」は、Teslaが完全な対応表を公開していないため、近接性から最適な候補を選んだことを示します。",
      dataIntro: "正本となる英語版スナップショットをJSON、CSV、GeoJSONでダウンロードできます。",
      rights: "Lakshman Turlapatiによる独自の対応付け、選定、編集文はCC BY 4.0で提供されます。このライセンスは、Supercharge.info由来の事実、Teslaの名称・商標、ベースマップのデータには適用されません。"
    }
  },
  ko: {
    labels: { map: "지도", badges: "배지", locations: "충전소", about: "소개", data: "데이터", home: "홈", source: "출처 문서", badgeDirectory: "아이코닉 차저 배지", locationDirectory: "수퍼차저 위치", methodology: "조사 방법", provenance: "출처와 계보", uncertainty: "불확실성", rights: "데이터 권리", downloads: "다운로드", citation: "인용 방법", locationsForBadge: "이 배지의 충전소", badgeForLocation: "배지 관계", confidence: "신뢰도", exact: "정확", approximate: "추정", notes: "참고", details: "충전소 정보", sourceIds: "출처 ID", openMap: "인터랙티브 지도에서 열기", viewPage: "상세 보기", snapshot: "스냅샷", author: "작성자", status: "상태" },
    text: {
      intro: "Tesla Charging Passport 배지 40개와 전 세계 수퍼차저 53곳을 정리한 독립 아틀라스입니다.",
      disclaimer: "Iconic Chargers는 독립 프로젝트이며 Tesla와 제휴하거나 Tesla의 승인을 받지 않았고 실시간 이용 가능 여부를 표시하지 않습니다.",
      badgeIntro: "Tesla 앱에서 기록한 모든 배지와 이 스냅샷에서 연결한 수퍼차저 위치를 살펴보세요.",
      locationIntro: "기록된 아이코닉 차저 배지와 관련된 전 세계 수퍼차저 위치를 살펴보세요.",
      aboutIntro: "Iconic Chargers는 Tesla Charging Passport 배지를 기록하고 실제 수퍼차저 위치에 연결하여 공개 웹에서 컬렉션을 탐색하고 검증하고 인용할 수 있게 합니다.",
      methodology: "배지 이름은 Tesla 앱에서 옮겨 적었습니다. 충전소 정보는 공개된 Supercharge.info 등록부와 연결했습니다. 하나의 배지가 여러 수퍼차저 위치에 해당할 수 있습니다.",
      provenance: "배지 이름은 사용자가 제공한 Tesla 앱 스냅샷에서 가져왔습니다. 주소, 좌표, 충전기 수, 출력, 개장일, 상태, 출처 ID는 Supercharge.info에서 가져왔습니다.",
      uncertainty: "‘정확’은 배지와 위치가 직접 일치하거나 랜드마크에 맞는 운영 중인 위치가 하나뿐임을 뜻합니다. ‘추정’은 Tesla가 전체 연결 정보를 공개하지 않으므로 이 프로젝트가 거리를 기준으로 가장 적합한 후보를 골랐음을 뜻합니다.",
      dataIntro: "기준 영어 스냅샷을 JSON, CSV 또는 GeoJSON으로 다운로드하세요.",
      rights: "Lakshman Turlapati가 독자적으로 작성한 연결 관계, 선정 내용, 편집 문구는 CC BY 4.0으로 이용할 수 있습니다. 이 라이선스는 Supercharge.info의 원천 사실, Tesla의 명칭이나 상표, 기본 지도 데이터에는 적용되지 않습니다."
    }
  },
  "zh-Hans": {
    labels: { map: "地图", badges: "徽章", locations: "站点", about: "关于", data: "数据", home: "首页", source: "来源说明", badgeDirectory: "标志性超级充电站徽章", locationDirectory: "超级充电站位置", methodology: "方法", provenance: "来源与出处", uncertainty: "不确定性", rights: "数据权利", downloads: "下载", citation: "引用方式", locationsForBadge: "此徽章对应的站点", badgeForLocation: "徽章关系", confidence: "置信度", exact: "准确", approximate: "近似", notes: "备注", details: "站点信息", sourceIds: "来源标识符", openMap: "在互动地图中打开", viewPage: "查看详情", snapshot: "数据快照", author: "作者", status: "状态" },
    text: {
      intro: "一个独立图集，收录40枚Tesla Charging Passport徽章和全球53个已标注的超级充电站。",
      disclaimer: "Iconic Chargers为独立项目，与Tesla无隶属或背书关系，也不显示实时可用情况。",
      badgeIntro: "浏览从Tesla应用中记录的全部徽章，以及本次数据快照中与其匹配的超级充电站。",
      locationIntro: "浏览全球与已记录标志性超级充电站徽章相关的超级充电站。",
      aboutIntro: "Iconic Chargers记录Tesla Charging Passport徽章并将其与真实超级充电站相匹配，便于在开放网络上探索、核查和引用。",
      methodology: "徽章名称从Tesla应用中转录。站点数据与Supercharge.info的公开名录相匹配。一枚徽章可能对应多个超级充电站。",
      provenance: "徽章名称来自用户提供的Tesla应用数据快照。地址、坐标、充电桩数量、功率、开放日期、状态和来源标识符均来自Supercharge.info。",
      uncertainty: "“准确”表示徽章与站点直接匹配，或符合该地标且仍在运营的站点只有一个。“近似”表示由于Tesla未公布完整对应关系，本项目根据距离选取了最合适的候选站点。",
      dataIntro: "以JSON、CSV或GeoJSON格式下载作为标准的英文数据快照。",
      rights: "Lakshman Turlapati原创的对应关系、筛选结果和编辑文字采用CC BY 4.0许可。该许可不涵盖Supercharge.info的上游事实、Tesla的名称或商标以及底图数据。"
    }
  },
  "zh-Hant": {
    labels: { map: "地圖", badges: "徽章", locations: "站點", about: "關於", data: "資料", home: "首頁", source: "來源說明", badgeDirectory: "指標性超級充電站徽章", locationDirectory: "超級充電站位置", methodology: "方法", provenance: "來源與出處", uncertainty: "不確定性", rights: "資料權利", downloads: "下載", citation: "引用方式", locationsForBadge: "此徽章對應的站點", badgeForLocation: "徽章關係", confidence: "可信度", exact: "準確", approximate: "近似", notes: "備註", details: "站點資料", sourceIds: "來源識別碼", openMap: "在互動地圖中開啟", viewPage: "查看詳情", snapshot: "資料快照", author: "作者", status: "狀態" },
    text: {
      intro: "一個獨立圖集，收錄40枚Tesla Charging Passport徽章和全球53個已標示的超級充電站。",
      disclaimer: "Iconic Chargers為獨立專案，與Tesla無隸屬或背書關係，也不顯示即時可用情況。",
      badgeIntro: "瀏覽從Tesla應用程式記錄的全部徽章，以及本次資料快照中與其配對的超級充電站。",
      locationIntro: "瀏覽全球與已記錄指標性超級充電站徽章相關的超級充電站。",
      aboutIntro: "Iconic Chargers記錄Tesla Charging Passport徽章並將其與真實超級充電站配對，方便在開放網路上探索、核查和引用。",
      methodology: "徽章名稱從Tesla應用程式轉錄。站點資料與Supercharge.info的公開名錄配對。一枚徽章可能對應多個超級充電站。",
      provenance: "徽章名稱來自使用者提供的Tesla應用程式資料快照。地址、座標、充電樁數量、功率、開放日期、狀態與來源識別碼均來自Supercharge.info。",
      uncertainty: "「準確」表示徽章與站點直接配對，或符合該地標且仍在營運的站點只有一個。「近似」表示由於Tesla未公布完整對應關係，本專案依距離選取了最合適的候選站點。",
      dataIntro: "以JSON、CSV或GeoJSON格式下載作為標準的英文資料快照。",
      rights: "Lakshman Turlapati原創的對應關係、篩選結果與編輯文字採用CC BY 4.0授權。該授權不涵蓋Supercharge.info的上游事實、Tesla的名稱或商標，以及底圖資料。"
    }
  },
  "yue-Hant": {
    labels: { map: "地圖", badges: "徽章", locations: "站點", about: "關於", data: "資料", home: "主頁", source: "來源說明", badgeDirectory: "標誌性超級充電站徽章", locationDirectory: "超級充電站位置", methodology: "方法", provenance: "來源同出處", uncertainty: "不確定性", rights: "資料權利", downloads: "下載", citation: "引用方法", locationsForBadge: "呢個徽章對應嘅站點", badgeForLocation: "徽章關係", confidence: "可信度", exact: "準確", approximate: "大約", notes: "備註", details: "站點資料", sourceIds: "來源識別碼", openMap: "喺互動地圖開啟", viewPage: "睇詳情", snapshot: "資料快照", author: "作者", status: "狀態" },
    text: {
      intro: "一個獨立圖集，收錄40個Tesla Charging Passport徽章同全球53個已標示嘅超級充電站。",
      disclaimer: "Iconic Chargers係獨立專案，同Tesla冇隸屬或背書關係，亦唔顯示即時可用情況。",
      badgeIntro: "瀏覽由Tesla應用程式記錄嘅所有徽章，同今次資料快照入面配對嘅超級充電站。",
      locationIntro: "瀏覽全球同已記錄標誌性超級充電站徽章有關嘅超級充電站。",
      aboutIntro: "Iconic Chargers記錄Tesla Charging Passport徽章，並配對真實超級充電站，方便喺開放網絡探索、核查同引用。",
      methodology: "徽章名稱係由Tesla應用程式轉錄。站點資料就同Supercharge.info嘅公開名錄配對。一個徽章可能對應多個超級充電站。",
      provenance: "徽章名稱來自用戶提供嘅Tesla應用程式資料快照。地址、座標、充電樁數量、功率、開放日期、狀態同來源識別碼都來自Supercharge.info。",
      uncertainty: "「準確」即係徽章同站點直接配對，或者符合該地標而仍然運作嘅站點只有一個。「大約」即係因為Tesla冇公布完整對應關係，本專案按距離揀咗最合適嘅候選站點。",
      dataIntro: "以JSON、CSV或GeoJSON格式下載標準英文資料快照。",
      rights: "Lakshman Turlapati原創嘅對應關係、篩選結果同編輯文字採用CC BY 4.0授權。呢個授權唔包括Supercharge.info嘅上游事實、Tesla嘅名稱或商標，同埋底圖資料。"
    }
  },
  mi: {
    labels: { map: "Mahere", badges: "Tohu", locations: "Wāhi", about: "Mō mātou", data: "Raraunga", home: "Kāinga", source: "Tuhinga pūtake", badgeDirectory: "Ngā tohu Iconic Charger", locationDirectory: "Ngā wāhi Supercharger", methodology: "Tikanga", provenance: "Ngā pūtake me te takenga", uncertainty: "Tūponotanga", rights: "Motika raraunga", downloads: "Tikiake", citation: "Me pēhea te whakahua", locationsForBadge: "Ngā wāhi mō tēnei tohu", badgeForLocation: "Hononga tohu", confidence: "Taumata whakapono", exact: "Tūturu", approximate: "Tata", notes: "Tuhipoka", details: "Mōhiohio wāhi", sourceIds: "Tuakiri pūtake", openMap: "Huakina ki te mahere pāhekoheko", viewPage: "Tirohia ngā taipitopito", snapshot: "Whakaahua raraunga", author: "Kaituhi", status: "Tūnga" },
    text: {
      intro: "He mahere motuhake o ngā tohu Tesla Charging Passport e 40 me ngā wāhi Supercharger e 53 puta noa i te ao.",
      disclaimer: "He kaupapa motuhake a Iconic Chargers, kāore i te hono, i te whakamanahia rānei e Tesla, ā, kāore e whakaatu ana i te wātea tōtika.",
      badgeIntro: "Tirohia ngā tohu katoa i tuhia mai i te taupānga Tesla me ngā wāhi Supercharger i hono ki aua tohu i tēnei whakaahua raraunga.",
      locationIntro: "Tirohia ngā wāhi Supercharger o te ao e hono ana ki ngā tohu Iconic Charger kua tuhia.",
      aboutIntro: "Ka tuhi a Iconic Chargers i ngā tohu Tesla Charging Passport, ka hono hoki ki ngā wāhi Supercharger tūturu kia taea ai te tūhura, te arotake me te whakahua i te kohinga ki te tukutuku tuwhera.",
      methodology: "I tāruatia ngā ingoa tohu mai i te taupānga Tesla. I tūhonotia ngā mōhiohio wāhi ki te rēhita tūmatanui a Supercharge.info. Tērā pea ka hāngai tētahi tohu ki ngā wāhi Supercharger maha.",
      provenance: "Nō tētahi whakaahua o te taupānga Tesla i tukuna mai e tētahi kaiwhakamahi ngā ingoa tohu. Nō Supercharge.info ngā wāhitau, ngā taunga, te maha o ngā wāhi utu, te kaha, ngā rā whakatuwhera, te tūnga me ngā tuakiri pūtake.",
      uncertainty: "Ko te tikanga o «Tūturu», he hāngai tonu te tohu me te wāhi, kotahi noa iho rānei te wāhi tuwhera e rite ana ki te tohu whenua. Ko te tikanga o «Tata», nā te mea kāore a Tesla e whakaputa i te mahere hononga katoa, i kōwhiria e te kaupapa te kaitono tino pai i runga i te tata.",
      dataIntro: "Tikiakehia te whakaahua raraunga Ingarihi matua hei JSON, CSV, GeoJSON rānei.",
      rights: "Kua raihanatia ngā hononga taketake, te kōwhiringa me ngā tuhinga ētita a Lakshman Turlapati i raro i te CC BY 4.0. Kāore taua raihana e kapi i ngā meka taketake a Supercharge.info, ngā ingoa, ngā waitohu hokohoko rānei a Tesla, me ngā raraunga mahere tūāpapa."
    }
  }
};

export function seoCopy(locale) {
  const translated = translations[locale] || {};
  return {
    labels: { ...en.labels, ...(translated.labels || {}) },
    text: { ...en.text, ...(translated.text || {}) }
  };
}

// Exposed for the build verifier so a missing translation cannot silently
// regress a crawlable About/Data page to English through the runtime fallback.
export const seoTranslationCatalog = translations;
export const seoCopyRequirements = {
  labels: Object.keys(en.labels).filter((key) => key !== "github"),
  text: Object.keys(en.text)
};

export const supportedSeoLocales = [
  "en", "fr", "de", "nl", "nb", "nn", "it", "es", "tr", "cs",
  "he", "ar", "ja", "ko", "zh-Hans", "zh-Hant", "yue-Hant", "mi"
];
