/**
 * FAQs page accordion strings (questions in HTML; answers wired via hidden SSR block).
 * Merged into locale-data.js as faq.page.q* and faq.b*.
 */
const pairs = [
  {
    q: "What is Zyflow?",
    a: "Zyflow is a route planning app built for e-bike riders. It plans cycling routes with automatic charging stop suggestions, factoring in your battery range, elevation, wind, and temperature so you can ride further with confidence.",
    qSl: "Kaj je Zyflow?",
    aSl: "Zyflow je aplikacija za načrtovanje poti, zasnovana za kolesarje z e-kolesi. Načrtuje kolesarske poti s samodejnimi predlogi polnilnih postank in upošteva doseg baterije, nadmorsko višino, veter in temperaturo, da lahko voziš dlje z več zanesljivosti.",
  },
  {
    q: "What bike types does Zyflow support?",
    a: "Zyflow supports e-bikes, road bikes, gravel bikes, touring bikes, and mountain bikes. When setting up your profile, you select your bike type and enter your e-bike's range on a full charge. Zyflow uses this to calculate battery estimates along your route.",
    qSl: "Katere tipe koles podpira Zyflow?",
    aSl: "Zyflow podpira e-kolesa, cestna, gravel, turistična in gorska kolesa. Pri nastavitvi profila izbereš tip kolesa in vpišeš doseg e-kolesa ob polni bateriji. Zyflow to uporabi za oceno baterije vzdolž poti.",
  },
  {
    q: "Is Zyflow free to use?",
    a: "Zyflow is free to download and use.",
    qSl: "Ali je Zyflow brezplačen?",
    aSl: "Zyflow je brezplačen za prenos in uporabo.",
  },
  {
    q: "Which platforms is Zyflow available on?",
    a: "Zyflow is available on iOS and will be available also on Android.",
    qSl: "Na katerih platformah je Zyflow na voljo?",
    aSl: "Zyflow je na voljo na iOS, kmalu pa tudi na Androidu.",
  },
  {
    q: "How does Zyflow calculate my route?",
    a: "Zyflow sends your start point, destination, and any waypoints to a cycling router. The result is a cycling-optimized route that accounts for roads, paths, and elevation.",
    qSl: "Kako Zyflow izračuna mojo pot?",
    aSl: "Zyflow pošlje začetno točko, cilj in morebitne vmesne točke kolesarskemu routerju. Rezultat je optimizirana kolesarska pot z upoštevanjem cest, poti in nadmorske višine.",
  },
  {
    q: "How does Zyflow estimate my battery along the route?",
    a: "Battery estimation uses your entered e-bike range combined with real physics: elevation gain, headwind or tailwind, temperature, and your rider weight. Weather data is fetched live so the estimate reflects actual conditions on the day of your ride. For rides longer than three hours, Zyflow also considers the weather forecast at your estimated arrival time.",
    qSl: "Kako Zyflow oceni baterijo vzdolž poti?",
    aSl: "Ocena baterije uporabi vneseni doseg e-kolesa in dejansko fiziko: vzpon, protiveter ali vetern v hrbtno stran, temperaturo in težo kolesarja. Vremenske podatke pridobiva v živo, zato ocena odraža razmere na dan vožnje. Pri vožnjah daljših od treh ur Zyflow upošteva tudi vremensko napoved ob predvidenem času prihoda.",
  },
  {
    q: "How does Zyflow decide where to place charging stops?",
    a: "Zyflow finds charging stations within a corridor along your route (5 km either side by default), clusters nearby options, and picks the best stop using a scoring system that penalizes large detours. If a stop requires rebuilding the route geometry, Zyflow re-routes through the charger and stitches the segments back together. You can also add or remove charging stops manually.",
    qSl: "Kako Zyflow izbere, kam postaviti polnilne postaje?",
    aSl: "Zyflow poišče polnilnice v pasu ob poti (privzeto 5 km na vsako stran), združi bližnje možnosti in izbere najboljšo postajo z ocenjevanjem, ki kaznuje velike obvoze. Če je treba spremeniti geometrijo poti, Zyflow ponovno usmeri skozi polnilnico in združi odseke. Polnilne postaje lahko dodajaš ali odstranjuješ tudi ročno.",
  },
  {
    q: "Can I adjust how far off-route Zyflow looks for chargers?",
    a: "Yes. The corridor width is set by your maximum detour preference in your bike settings. The default is 5 km either side of your route.",
    qSl: "Ali lahko prilagodim, kako daleč od poti Zyflow išče polnilnice?",
    aSl: "Da. Širino pasu določa tvoja nastavitev največjega obvoza v nastavitvah kolesa. Privzeto je 5 km na vsako stran poti.",
  },
  {
    q: "Can I add my own stops or waypoints?",
    a: "Yes. You can add charging stops manually during planning. GPX route import is also supported if you want to follow a pre-planned path.",
    qSl: "Ali lahko dodam svoje postanke ali vmesne točke?",
    aSl: "Da. Med načrtovanjem lahko ročno dodajaš polnilne postaje. Podprt je tudi uvoz GPX poti, če želiš slediti vnaprej načrtovani poti.",
  },
  {
    q: "Where does Zyflow get its charger data?",
    a: "Charger data comes from our partners and is stored in Zyflow's own database. Information includes operator, network, available sockets, fees, access type, and opening hours where available.",
    qSl: "Od kod Zyflow pridobiva podatke o polnilnicah?",
    aSl: "Podatke o polnilnicah pridobivamo od partnerjev in shranjujemo v lastno bazo Zyflow. Vključujejo operaterja, omrežje, razpoložljive priključke, cene, tip dostopa in odpiralni čas, kjer je na voljo.",
  },
  {
    q: "Does Zyflow show real-time charger availability?",
    a: "No. Zyflow does not currently show live occupancy or real-time status. We recommend verifying availability directly with the charger operator before relying on a specific stop.",
    qSl: "Ali Zyflow prikazuje razpoložljivost polnilnic v živo?",
    aSl: "Ne. Zyflow trenutno ne prikazuje zasedenosti ali statusa v realnem času. Pred uporabo določene postaje priporočamo preverjanje pri operaterju polnilnice.",
  },
  {
    q: "Can I filter chargers by connector type or charging speed?",
    a: "Not during route planning. Connector type and power details are shown on each charger's detail screen when available. You can also report connector information when submitting a missing charger.",
    qSl: "Ali lahko filtriram polnilnice po tipu priključka ali hitrosti?",
    aSl: "Med načrtovanjem poti ne. Tip priključka in moč sta prikazana na podrobnostih posamezne polnilnice, kjer so podatki na voljo. Informacije o priključku lahko sporočiš tudi pri prijavi manjkajoče polnilnice.",
  },
  {
    q: "Can I report a missing charger?",
    a: 'Yes. Use the "Add a charger" option in the app to submit a missing charging station, including connector type and other details.',
    qSl: "Ali lahko prijavim manjkajočo polnilnico?",
    aSl: "Da. V aplikaciji uporabi možnost »Dodaj polnilnico« in oddaj manjkajočo postajo, vključno s tipom priključka in drugimi podatki.",
  },
  {
    q: "Does Zyflow work offline?",
    a: "No. An active internet connection is required for route planning, battery estimation, and loading charger and POI data. The app will show a warning if you lose connectivity.",
    qSl: "Ali Zyflow deluje brez povezave?",
    aSl: "Ne. Za načrtovanje poti, oceno baterije in nalaganje polnilnic ter POI je potrebna internetna povezava. Aplikacija opozori, če povezava izpade.",
  },
  {
    q: "Does Zyflow support turn-by-turn navigation?",
    a: "Not currently. Zyflow is a route planner and visualizer. You plan your route in the app and follow it on the map, but there is no turn-by-turn guidance.",
    qSl: "Ali Zyflow podpira turn-by-turn navigacijo?",
    aSl: "Trenutno ne. Zyflow je načrtovalnik in vizualizator poti. Pot načrtuješ v aplikaciji in jo spremljaš na zemljevidu, brez navodil po korakih.",
  },
  {
    q: "Can I import or export GPX files?",
    a: "Yes, both are supported. You can import a GPX file to follow an existing route, and export any planned route as a GPX file to use in other apps. Zyflow can also open GPX files shared directly from other apps on your device.",
    qSl: "Ali lahko uvozim ali izvozim GPX datoteke?",
    aSl: "Da, oboje je podprto. GPX lahko uvoziš za sledenje obstoječi poti ali izvoziš načrtovano pot za druge aplikacije. Zyflow odpre tudi GPX, ki ga deliš neposredno iz drugih aplikacij.",
  },
  {
    q: "Do I need an account to use Zyflow?",
    a: "Yes. An account is required to use the app. Sign-up takes just a moment and supports Apple Sign-In on iOS.",
    qSl: "Ali potrebujem račun za uporabo Zyflow?",
    aSl: "Da. Za uporabo aplikacije je potreben račun. Registracija traja le trenutek in na iOS podpira Apple Sign-In.",
  },
  {
    q: "What is saved to my account?",
    a: "Your saved routes and saved places are stored in your account and synced across devices. Your name is also stored in your profile. Bike preferences (range, weight, detour settings) are currently stored locally on your device only.",
    qSl: "Kaj je shranjeno v mojem računu?",
    aSl: "Shranjene poti in kraji so v računu in se sinhronizirajo med napravami. Ime je shranjeno v profilu. Nastavitve kolesa (doseg, teža, obvoz) so trenutno samo lokalno na napravi.",
  },
  {
    q: "Can I delete my account?",
    a: "Account deletion is not yet available directly in the app. To request deletion of your account and data, please contact us at support@zyflow.eu. We will process the request within 30 days.",
    qSl: "Ali lahko izbrišem svoj račun?",
    aSl: "Brisanje računa v aplikaciji še ni na voljo. Za izbris računa in podatkov piši na support@zyflow.eu. Zahtevo obdelamo v 30 dneh.",
  },
  {
    q: "My battery estimate seems off. Why?",
    a: "Make sure your e-bike range is set correctly in your bike preferences. The estimate is based on your entered range adjusted for the actual elevation, wind, and temperature of your route. Very aggressive riding or extremely cold conditions can push real-world consumption beyond the estimate.",
    qSl: "Ocena baterije se zdi napačna. Zakaj?",
    aSl: "Preveri, ali je doseg e-kolesa pravilno nastavljen v nastavitvah kolesa. Ocena temelji na vnesenem dosegu z upoštevanjem dejanske višine, vetra in temperature na poti. Zelo agresivna vožnja ali ekstremna mrzlica lahko porabo presežeta oceno.",
  },
  {
    q: "Zyflow is not finding chargers along my route.",
    a: 'Try widening your maximum detour distance in bike settings. If chargers are genuinely missing in your area, you can submit them directly in the app using the "Add a charger" option.',
    qSl: "Zyflow ne najde polnilnic ob moji poti.",
    aSl: "Poskusi povečati največji obvoz v nastavitvah kolesa. Če v območju res manjkajo polnilnice, jih lahko prijaviš v aplikaciji z možnostjo »Dodaj polnilnico«.",
  },
  {
    q: "The route looks wrong or takes an unexpected path.",
    a: "Check that your bike type is set correctly, as this affects which roads and paths the router considers. If the issue persists, please get in touch and share the route details so we can investigate.",
    qSl: "Pot je videti napačna ali poteka nepričakovano.",
    aSl: "Preveri, ali je tip kolesa pravilno nastavljen, ker to vpliva na izbiro cest in poti. Če težava ostane, stopi v stik in deli podrobnosti poti, da lahko preverimo.",
  },
  {
    q: "The app is not working and I have no internet connection.",
    a: "Zyflow requires an internet connection for route planning and live data. Check your connection and try again.",
    qSl: "Aplikacija ne deluje in nimam internetne povezave.",
    aSl: "Zyflow potrebuje internetno povezavo za načrtovanje poti in podatke v živo. Preveri povezavo in poskusi znova.",
  },
];

function buildLocaleBlock(prefixQ, prefixB) {
  const en = {};
  const sl = {};
  pairs.forEach((p, i) => {
    const n = i + 1;
    en[`${prefixQ}${n}`] = p.q;
    en[`${prefixB}${n}`] = p.a;
    sl[`${prefixQ}${n}`] = p.qSl;
    sl[`${prefixB}${n}`] = p.aSl;
  });
  return { en, sl };
}

const faqPage = buildLocaleBlock("faq.page.q", "faq.b");
faqPage.en["faq.page.cta"] =
  "Didn\u2019t find what you\u2019re looking for?";
faqPage.sl["faq.page.cta"] = "Niste našli, kar iščete?";

module.exports = faqPage;
