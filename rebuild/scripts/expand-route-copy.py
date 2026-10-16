#!/usr/bin/env python3
"""Expand route detail copy into sections[] for tour body template. Run from repo root."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EN = ROOT / "locales" / "en.json"
SL = ROOT / "locales" / "sl.json"


def S(title, body, body2=""):
 return {"title": title, "body": body, "body2": body2}


# Full EN + SL narrative packs keyed by slug
COPY = {
 "kamnicanka": {
 "en": {
 "lede": "The gentlest petal of the Kranjska roža: seventy kilometres of valley touring past castles, churches and Arboretum Volčji Potok, with barely 250 m of climbing.",
 "intro": "Kamničanka is the route you give someone on their first day in Gorenjska. It leaves Kranj on quiet roads, crosses Slovenia’s only motorway bike bridge near Vokle, and threads heritage stops all the way to Kamnik before a soft return through forest gravel and the Sava plain. Distance without drama, and still a full day that feels like a real tour.",
 "sections": [
 S(
 "From Kranj across the plain",
 "Roll out through Šenčur toward Adergas, where the Church of the Annunciation sits in open fields. The Češnjevek ponds and Strmol Castle follow soon after, then Grad near Cerklje, a string of stops that never forces a hard climb.",
 "Komenda’s oak woodland brings you to the edge of Kamnik. The old town is the natural lunch stop: short alleys, cafés, and enough shade to reset before the arboretum leg.",
 ),
 S(
 "Arboretum, gravel and home",
 "From Šmarca the path reaches Arboretum Volčji Potok. Give it time, the park is one of the best mid-ride pauses in the flower network. Then Radomlje and Mengeš lead toward Vodice.",
 "The stretch from Vodice toward Voglje turns to good gravel under forest canopy. Back into Kranj the road flattens again: tidy asphalt, easy spinning, and a finish that still has battery to spare on an e-bike.",
 ),
 S(
 "How to ride it with Zyflow",
 "Mark a charger and a long lunch in Kamnik before you leave. If you want coffee with a view of bikes parked properly, filter for bike-friendly places along the loop.",
 "At 70 km and only 254 m of climbing this is the safest warm-up before Blejčanka or the Tržič alpine days. Save the GPX, then open the same line in Zyflow when you are ready to navigate.",
 ),
 ],
 },
 "sl": {
 "lede": "Najblažji cvet Kranjske rože: 70 km dolinske ture mimo gradov, cerkva in Arboretuma Volčji Potok, z komaj 250 m vzpona.",
 "intro": "Kamničanka je pot, ki jo daste nekomu na prvi dan na Gorenjskem. Iz Kranja pelje po mirnih cestah, čez edini kolesarski most nad avtocesto pri Voklah, in poveže dediščinske postanke do Kamnika, nato pa mehko nazaj skozi gozdni makadam in savsko ravnino. Razdalja brez drame, in še vedno cel dan prave ture.",
 "sections": [
 S(
 "Iz Kranja čez ravnino",
 "Skozi Šenčur proti Adergasu, kjer stoji cerkev Marijinega oznanjenja sredi polj. Kmalu sledijo jezerca Češnjevek in grad Strmol, nato Grad pri Cerkljah, niz postankov brez težkega vzpona.",
 "Komendska dobrava vas pripelje do roba Kamnika. Staro mestno jedro je naravni kosilni postanek: ozke ulice, kavarne in dovolj sence pred arboretumskim delom.",
 ),
 S(
 "Arboretum, makadam in domov",
 "Od Šmarce pot doseže Arboretum Volčji Potok. Vzemite si čas, to je eden najboljših vmesnih postankov v mreži Kranjske rože. Nato Radomlje in Mengeš proti Vodicam.",
 "Od Vodic proti Voglam se podlaga spremeni v dober makadam pod krošnjami. Nazaj v Kranj cesta spet splohni: urejen asfalt, lahka vožnja in zaključek, kjer na e-kolesu še ostane baterije.",
 ),
 S(
 "Kako z Zyflow",
 "Pred odhodom označite polnilnico in daljše kosilo v Kamniku. Če želite kavo pri kraju, ki ima urejeno parkiranje za kolesa, filtrirajte kolesarju prijazna mesta vzdolž zanke.",
 "Pri 70 km in le 254 m vzpona je to najvarnejši ogrevalni dan pred Blejčanko ali alpskimi turami iz Tržiča. Shranite GPX in isto linijo odprite v Zyflow, ko ste pripravljeni na navigacijo.",
 ),
 ],
 },
 },
 "blejcanka": {
 "en": {
 "lede": "Kranj’s western petal to Lake Bled: nearly 80 km, close to 1,000 m of climbing, and the classic Gorenjska postcard, Kropa, the lake, and Radovljica’s square.",
 "intro": "Blejčanka is the beauty day of the Kranjska roža. You leave the Sava plain, climb toward Jamnik until the Karawanks open, drop into Kropa’s ironworking streets, then arrive at Bled’s castle rock and shoreline before swinging through Radovljica on the way home. It is long enough to matter and scenic enough to justify every metre.",
 "sections": [
 S(
 "Climb toward the Karawanks",
 "From central Kranj the road tilts up toward Jamnik. After a few kilometres of honest climbing the ridge views appear, a clear signal you have left the flat petal routes behind.",
 "Kropa follows: narrow lanes, forge heritage, and one of the most atmospheric villages on any of the flower rides. Pause here before the landscape opens fully toward the lake.",
 ),
 S(
 "Bled, then Radovljica",
 "Bled is the emotional peak of the day, island church, castle, and the shoreline loop that every visitor recognises. Ride it with traffic awareness; the reward is the postcard you came for.",
 "Radovljica’s baroque square is the cultural cool-down before the return toward Kranj. By then the climbing is largely behind you, but the legs will feel the full 944 m.",
 ),
 S(
 "How to ride it with Zyflow",
 "This is an e-bike sweet spot: almost 80 km and nearly a vertical kilometre. Pin chargers near Bled and a lunch stop in Kropa or Radovljica before you roll out.",
 "Check wind on the exposed sections and save an early café in Kranj for the finish. Open the route in Zyflow when you want navigation plus bike-friendly places on the same map.",
 ),
 ],
 },
 "sl": {
 "lede": "Zahodni cvet Kranjske rože do Blejskega jezera: skoraj 80 km, blizu 1.000 m vzpona in klasika Gorenjske, Kropa, jezero in trg Radovljice.",
 "intro": "Blejčanka je lepota dneva Kranjske rože. Zapustite savsko ravnino, se vzpnete proti Jamniku, dokler se ne odprejo Karavanke, nato v kovaške ulice Krope in do blejskega gradu ter obale, pred povratkom še skozi Radovljico. Dovolj dolgo, da šteje, in dovolj razgledno, da se izplača vsak meter.",
 "sections": [
 S(
 "Vzpon proti Karavankam",
 "Iz središča Kranja se cesta nagne proti Jamniku. Po nekaj kilometrih poštenega vzpona se odprejo grebenski razgledi, znak, da ste zapustili ravninske cvetove.",
 "Sledi Kropa: ozke ulice, kovaška dediščina in ena najbolj atmosferičnih vasi v vsej roži. Ustavitve si zasluži, preden se krajina povsem odpre proti jezeru.",
 ),
 S(
 "Bled, nato Radovljica",
 "Bled je čustveni vrhunec dneva, otok, grad in obala, ki jo prepozna vsak. Vozite previdno zaradi prometa; nagrada je razglednica, zaradi katere ste prišli.",
 "Baročni trg Radovljice je kulturni iztek pred povratkom proti Kranju. Vzponi so večinoma za vami, noge pa začutijo vseh 944 m.",
 ),
 S(
 "Kako z Zyflow",
 "To je sladka točka za e-kolo: skoraj 80 km in skoraj tisoč višincev. Pred odhodom označite polnilnice pri Bledu in kosilo v Kropi ali Radovljici.",
 "Preverite veter na izpostavljenih odsekih in si za zaključek shranite zgodnjo kavarno v Kranju. Pot odprite v Zyflow, ko želite navigacijo in kolesarju prijazna mesta na istem zemljevidu.",
 ),
 ],
 },
 },
 "jezerjanka": {
 "en": {
 "lede": "North from Kranj along the Kokra into Slovenia’s first Mountain Village, glacier valleys, alpine farms and a quieter rhythm than the lake circuits.",
 "intro": "Jezerjanka is the alpine petal of the Kranjska roža. Instead of postcard lakes you get working high farms, sudden rock walls and the wide green bowl of Jezersko under the Kamnik–Savinja Alps. At 76 km with around 600 m of climbing it is committing without becoming a race.",
 "sections": [
 S(
 "Up the Kokra",
 "Leave Kranj and settle into the valley road through Preddvor. The Kokra narrows gradually; traffic thins; the peaks start to stack ahead of you.",
 "This is where the day changes character, from town touring into mountain valley riding. Keep snacks handy; services grow thinner the higher you go.",
 ),
 S(
 "Into Jezersko",
 "Jezersko opens as a glacial amphitheatre: meadows, farmhouses and ridges that earned the village its Mountain Village status. Ride the valley floor, then decide whether to add a short local loop if legs allow.",
 "The return follows the same corridor south. Descend with room for hikers and farm traffic, and save a café stop in Preddvor if you skipped lunch higher up.",
 ),
 S(
 "How to ride it with Zyflow",
 "Map water and food before you leave Kranj, the middle stretch is lean. A charger near the valley mouth is insurance on an e-bike day.",
 "Pair Jezerjanka with a quieter Jezersko half-day (Mali vrh or Ravenska Kočna) if you overnight. Open the main line in Zyflow for navigation and place filters.",
 ),
 ],
 },
 "sl": {
 "lede": "Iz Kranja ob Kokri v prvo slovensko gorniško vas, ledeniške doline, planine in mirnejši ritem kot ob jezerih.",
 "intro": "Jezerjanka je alpski cvet Kranjske rože. Namesto razglednic dobite delujoče planine, ostre stene in zeleno skledo Jezerskega pod Kamniško-Savinjskimi Alpami. Pri 76 km in okoli 600 m vzpona je zavezujoča, a ne dirkaška.",
 "sections": [
 S(
 "Ob Kokri navzgor",
 "Iz Kranja se ustalite na dolinski cesti skozi Preddvor. Kokra se postopoma zoži, prometa je manj, vrhovi se zložijo pred vami.",
 "Tu dan spremeni značaj, iz mestne ture v gorsko dolinsko vožnjo. Imate pri roki prigrizke; storitev je višje vse manj.",
 ),
 S(
 "V Jezersko",
 "Jezersko se odpre kot ledeniški amfiteater: trate, kmetije in grebeni, zaradi katerih je vas dobila status gorniške. Peljite dno doline, nato po želji dodajte kratko lokalno zanko.",
 "Povratek gre po istem koridorju proti jugu. Spuščajte se s prostorom za pohodnike in kmečki promet ter si shranite kavarno v Preddvoru, če ste višje izpustili kosilo.",
 ),
 S(
 "Kako z Zyflow",
 "Vodo in hrano označite pred odhodom iz Kranja, srednji del je reven. Polnilnica pri ustju doline je zavarovanje na e-kolesu.",
 "Jezerjanko lahko povežete s krajšim jezerskim poldnevom (Mali vrh ali Ravenska Kočna), če ostanete čez noč. Glavno linijo odprite v Zyflow za navigacijo in filtre mest.",
 ),
 ],
 },
 },
 "ljubljancanka": {
 "en": {
 "lede": "South from Kranj to the capital: countryside connectors, Smlednik Castle, then Tivoli and Ljubljana Castle as the urban climax of the day.",
 "intro": "Ljubljančanka is the city petal of the flower network, enough rural kilometres to feel like a tour, then a clear arrival in Ljubljana. At about 70 km it suits riders who want heritage and café density without alpine grades.",
 "sections": [
 S(
 "Countryside approach",
 "Leave Kranj on valley roads that gradually trade Gorenjska fields for the Ljubljana basin. Smlednik Castle is the landmark on the approach, a good photo and stretch stop.",
 "Keep an eye on busier connectors as you near the city. The ride is not technical; the challenge is attention in mixed traffic.",
 ),
 S(
 "Into Ljubljana",
 "Tivoli offers a green entry, then the climb or walk up to Ljubljana Castle for the classic finish frame. Old-town streets below are dense with bike-friendly cafés if you filter for them.",
 "Return north the way you came, or rail-assist one direction if you prefer a one-way day. Either way, save battery for the urban segment.",
 ),
 S(
 "How to ride it with Zyflow",
 "Pin a lunch spot near the castle hill and a charger before the return. City traffic rewards a calm pace and clear routing.",
 "Open Ljubljančanka in Zyflow to keep navigation and place layers together, especially useful when streets get busy around the centre.",
 ),
 ],
 },
 "sl": {
 "lede": "Iz Kranja proti prestolnici: podeželske povezave, grad Smlednik, nato Tivoli in Ljubljanski grad kot mestni vrhunec dneva.",
 "intro": "Ljubljančanka je mestni cvet mreže, dovolj podeželskih kilometrov za občutek ture, nato jasen prihod v Ljubljano. Okoli 70 km ustreza tistim, ki hočejo dediščino in gostoto kavarn brez alpskih naklonov.",
 "sections": [
 S(
 "Podeželski pristop",
 "Iz Kranja po dolinskih cestah, ki postopoma zamenjajo gorenjska polja z ljubljansko kotlino. Grad Smlednik je znamenitost v pristopu, dober foto in raztezni postanek.",
 "Blizu mesta bodite pozorni na prometnejše povezave. Vožnja ni tehnična; izziv je pozornost v mešanem prometu.",
 ),
 S(
 "V Ljubljano",
 "Tivoli ponudi zelen vstop, nato vzpon ali sprehod do Ljubljanskega gradu za klasični zaključek. Spodaj je staro mestno jedro polno kavarn, filtrirajte kolesarju prijazne.",
 "Nazaj proti severu po isti poti ali z vlakom v eno smer, če želite enosmerni dan. V vsakem primeru prihranite baterijo za mestni del.",
 ),
 S(
 "Kako z Zyflow",
 "Označite kosilo pri grajskem hribu in polnilnico pred povratkom. Mestni promet nagradi miren tempo in jasno vodenje.",
 "Ljubljančanko odprite v Zyflow, da imate navigacijo in plasti mest skupaj, posebej koristno, ko se okoli središča zgosti promet.",
 ),
 ],
 },
 },
 "locanka": {
 "en": {
 "lede": "Kranj to Škofja Loka: stone bridges, castle hill and Crngrob on one of the flower’s prettiest heritage days.",
 "intro": "Ločanka is the heritage favourite of the Kranjska roža, slightly shorter than Blejčanka, denser in old-town atmosphere. You ride into a medieval basin that still feels painted, with Capuchin bridges and a castle above the confluence.",
 "sections": [
 S(
 "Toward the Loka basin",
 "Leave Kranj on rolling connectors that tip you into the Škofja Loka landscape. The castle hill appears before the streets do, a useful landmark for pacing the day.",
 "Traffic is manageable if you keep to the signed cycling links. Save energy for wandering once you reach the centre.",
 ),
 S(
 "Old town and Crngrob",
 "Škofja Loka’s twin bridges and lanes are the main event. Walk sections if crowds are thick; the point is the place, not average speed.",
 "A short detour to Crngrob adds the frescoed church many riders miss. Then turn for Kranj with a café stop still in the bag.",
 ),
 S(
 "How to ride it with Zyflow",
 "Pin a long lunch in the old town and a quieter return road. At around 64 km this fits neatly between a recovery spin and a full mountain day.",
 "Open Ločanka in Zyflow to navigate the approach and keep bike-friendly cafés visible when you arrive.",
 ),
 ],
 },
 "sl": {
 "lede": "Kranj–Škofja Loka: kamniti mostovi, grajski hrib in Crngrob na enem najlepših dediščinskih dni Kranjske rože.",
 "intro": "Ločanka je ljubljenka dediščine v Kranjski roži, nekoliko krajša od Blejčanke, gostejša v atmosferi starega mestnega jedra. Peljete v srednjeveško kotlino, ki je še vedno kot slika, s kapucinskima mostovoma in gradom nad sotočjem.",
 "sections": [
 S(
 "Proti loški kotlini",
 "Iz Kranja po valovitih povezavah, ki vas nagnejo v loško krajino. Grajski hrib se pokaže, še preden ulice, uporaben orientir za ritem dneva.",
 "Promet je obvladljiv, če ostanete na označenih kolesarskih povezavah. Energijo prihranite za sprehod po jedru.",
 ),
 S(
 "Staro jedro in Crngrob",
 "Mostova in ulice Škofje Loke so glavni dogodek. Če je gneča, dele peš, gre za kraj, ne za povprečno hitrost.",
 "Kratek ovinek v Crngrob doda freskirano cerkev, ki jo mnogi izpustijo. Nato proti Kranju z še enim kavarniškim postankom v rezervi.",
 ),
 S(
 "Kako z Zyflow",
 "Označite daljše kosilo v starem jedru in mirnejšo pot nazaj. Okoli 64 km se lepo usede med regeneracijo in poln gorski dan.",
 "Ločanko odprite v Zyflow za vodenje pristopa in vidnost kolesarju prijaznih kavarn ob prihodu.",
 ),
 ],
 },
 },
 "trzicanka": {
 "en": {
 "lede": "Kranj’s northern petal into Tržič, old-town streets, Kamen Castle ruins and the gateway to Ljubelj, Košuta and Udin boršt.",
 "intro": "Tržičanka connects the Kranj flower to the Tržič alpine catalogue. Ride it as a destination day into a historic basin under the Karawanks, or as the approach before a harder pass the next morning.",
 "sections": [
 S(
 "North into the basin",
 "Valley riding from Kranj builds toward Tržič’s gateway feel. The landscape tightens; the town’s historic core and factory heritage sit under steep forest walls.",
 "Kamen Castle’s ruins are the classic spur stop, a short climb for a wide view back over the valley.",
 ),
 S(
 "Tržič as a hub",
 "Once in town you stand at the start of K35 Ljubelj, the Košuta pastures and the softer Udin boršt gravel days. Use Tržičanka to arrive fresh enough to explore the centre.",
 "Cafés and supplies are denser here than on the high routes. Stock up before you commit to anything steeper.",
 ),
 S(
 "How to ride it with Zyflow",
 "Save Tržičanka as a transfer day, then chain K35 or K52 from the same map. Pin a charger in town if you are on an e-bike.",
 "Open the route in Zyflow for the approach navigation, then browse nearby alpine lines without leaving the app.",
 ),
 ],
 },
 "sl": {
 "lede": "Severni cvet Kranjske rože v Tržič, staro jedro, razvaline gradu Kamen in predprostor Ljubelja, Košute ter Udin boršta.",
 "intro": "Tržičanka poveže kranjsko rožo s tržiškim alpskim katalogom. Kot ciljni dan v zgodovinsko kotlino pod Karavankami ali kot pristop pred težjim prelazom naslednje jutro.",
 "sections": [
 S(
 "Proti severu v kotlino",
 "Dolinska vožnja iz Kranja gradi občutek vhoda v Tržič. Krajina se zoži; zgodovinsko jedro in industrijska dediščina ležita pod strmimi gozdnimi stenami.",
 "Razvaline gradu Kamen so klasični stranski postanek, kratek vzpon za širok razgled nazaj po dolini.",
 ),
 S(
 "Tržič kot vozlišče",
 "V mestu stojite na začetku K35 Ljubelj, planin pod Košuto in mehkejših gravel dni po Udin borštu. S Tržičanko pridete dovolj sveži, da raziščete središče.",
 "Kavarn in oskrbe je tu več kot na visokih poteh. Zaloge napolnite, preden se zavežete čemur koli strmejšemu.",
 ),
 S(
 "Kako z Zyflow",
 "Tržičanko shranite kot prenosni dan, nato z istega zemljevida povežite K35 ali K52. V mestu si označite polnilnico, če ste na e-kolesu.",
 "Pot odprite v Zyflow za vodenje pristopa, nato brskajte po bližnjih alpskih linijah, ne da bi zapustili aplikacijo.",
 ),
 ],
 },
 },
 "k35-prelaz-ljubelj": {
 "en": {
 "lede": "Tržič’s signature pass: thirteen hairpins on Europe’s oldest road pass, mostly car-free, with a hut at 1,370 m and about 900 m of climbing.",
 "intro": "K35 is the ride people mean when they say “Ljubelj by bike.” From the bus station in Tržič you climb through Podljubelj, share a careful stretch of main road, then take the historic pass that is closed to cars most of the year. The last 300 vertical metres are steep; the hut and the view into Austria are the payoff.",
 "sections": [
 S(
 "Tržič to Podljubelj",
 "Start opposite the bus station and ride north through the old town toward Podljubelj. Village streets give way to the valley approach; parking and services are still close if you need a last stop.",
 "Beyond the village, a gravel link runs beside the main road toward Ljubelj before you briefly join the tunnel approach. Traffic here is real, ride assertively and predictably.",
 ),
 S(
 "The old pass",
 "Before the tunnel, peel right onto the historic road. Thirteen hairpins and raw gradient remain. This is the section shared with hikers and, one September Sunday, vintage race cars, the rest of the year it belongs to legs and lungs.",
 "The pass hut is the turnaround. Eat, look into Austria, then descend the same way with cool brakes and eyes up for oncoming riders.",
 ),
 S(
 "How to ride it with Zyflow",
 "Budget about three hours and 26 km out-and-back. Pin the hut opening and a recovery café in Tržič before you start the steep finale.",
 "Open K35 in Zyflow for navigation on the mixed surfaces, and keep a weather eye on the saddle, it turns quickly at 1,370 m.",
 ),
 ],
 },
 "sl": {
 "lede": "Podpisni prelaz Tržiča: trinajst serpentin na najstarejšem cestnem prelazu v Evropi, večinoma brez avtov, koča na 1.370 m in okoli 900 m vzpona.",
 "intro": "K35 je tura, ki jo ljudje mislijo, ko rečejo »Ljubelj s kolesom«. Od avtobusne postaje v Tržiču skozi Podljubelj, previdno po odseku glavne ceste, nato na zgodovinski prelaz, ki je večino leta zaprt za avte. Zadnjih 300 višincev je strmih; koča in razgled v Avstrijo sta nagrada.",
 "sections": [
 S(
 "Tržič–Podljubelj",
 "Začnite nasproti avtobusne postaje in proti severu skozi staro jedro proti Podljubelju. Vaške ulice preidejo v dolinski pristop; storitve so še blizu za zadnji postanek.",
 "Za vasjo makadamska povezava teče ob glavni cesti proti Ljubelju, nato na kratko na pristop k predoru. Promet je resničen, vozite predvidljivo in odločno.",
 ),
 S(
 "Stari prelaz",
 "Pred predorom desno na zgodovinsko cesto. Ostane trinajst serpentin in surov naklon. Odsek delite s pohodniki in, eno septembrsko nedeljo, s starodobniki; sicer pripada nogam in pljučem.",
 "Koča na prelazu je obrat. Jejte, poglejte v Avstrijo, nato isti spust s hladnimi zavorami in očmi za nasprotne kolesarje.",
 ),
 S(
 "Kako z Zyflow",
 "Računajte na približno tri ure in 26 km tja in nazaj. Pred strmim zaključkom označite odprtost koče in regeneracijsko kavarno v Tržiču.",
 "K35 odprite v Zyflow za vodenje po mešanih podlagah in spremljajte vreme na sedlu, na 1.370 m se hitro obrne.",
 ),
 ],
 },
 },
 "k11-planine-pod-kosuto": {
 "en": {
 "lede": "Tržič’s alpine flagship: forest roads and pasture shelves under Košuta’s long white wall, big climbing, bigger views.",
 "intro": "K11 is the high signature of the Tržič network. You leave town for steep forest approaches that open onto a chain of planine under Košuta, with views that stretch toward Austria. This is a full mountain day, not a café loop.",
 "sections": [
 S(
 "Into the Karawanks foothills",
 "Climb out of Tržič as the asphalt thins and the forest takes over. Gradients come in waves; shade helps, but the elevation keeps coming.",
 "Early turnaround options exist if weather shifts. The higher pastures reward those who keep a reserve for the last shelves.",
 ),
 S(
 "Pastures under Košuta",
 "The limestone ridge of Košuta stays in view once you clear the trees. Alpine huts and meadow tracks define the middle of the day, shared with hikers, cattle and silence.",
 "Descend with discipline. Forest roads cut speed slowly; loose sections punish late braking.",
 ),
 S(
 "How to ride it with Zyflow",
 "Confirm hut openings and water before you commit. Pin an emergency descent and a town café for the finish.",
 "Open K11 in Zyflow when you want the line on the map with weather and place context, this is not a route to improvise hungry.",
 ),
 ],
 },
 "sl": {
 "lede": "Alpska zastavonoša Tržiča: gozdne ceste in police planin pod belo steno Košute, veliko vzpona, še več razgleda.",
 "intro": "K11 je visoki podpis tržiške mreže. Iz mesta v strme gozdne pristope, ki se odprejo v verigo planin pod Košuto, z razgledi proti Avstriji. To je poln gorski dan, ne kavarniška zanka.",
 "sections": [
 S(
 "V podnožje Karavank",
 "Iz Tržiča, ko asfalt redči in prevzame gozd. Nakloni prihajajo v valovih; senca pomaga, višinci pa ne ponehajo.",
 "Zgodnji obrati obstajajo, če se vreme spremeni. Višje planine nagradijo tiste, ki si prihranijo rezervo za zadnje police.",
 ),
 S(
 "Planine pod Košuto",
 "Apnenčasti greben Košute ostane v vidnem polju, ko zapustite drevje. Alpske koče in travnate sledi določajo sredino dneva, skupaj s pohodniki, živino in tišino.",
 "Spust z disciplino. Gozdne ceste hitrost znižujejo počasi; sipki odseki kaznujejo pozno zaviranje.",
 ),
 S(
 "Kako z Zyflow",
 "Pred zavezo preverite odprtost koč in vodo. Označite zasilni spust in mestno kavarno za zaključek.",
 "K11 odprite v Zyflow, ko hočete linijo na zemljevidu z vremennom in kontekstom mest, to ni pot za improvizacijo na prazno.",
 ),
 ],
 },
 },
 "k16-trzic-jezersko": {
 "en": {
 "lede": "A linking alpine day from Tržič’s Karawanks flank across to the glacier bowl of Jezersko, valley to valley, sustained climbing.",
 "intro": "K16 is the bridge in the Tržič shortlist: fewer postcard stops, more committed mountain kilometres, and a true change of valley when you finally drop toward Jezersko.",
 "sections": [
 S(
 "Leaving Tržič",
 "Climb away from town into forest that keeps gaining. The early kilometres set the tone, this is a transfer with teeth, not a scenic meander.",
 "Carry more food than you think. Services in the middle are thin compared with the lake petals out of Kranj.",
 ),
 S(
 "Into Jezersko",
 "The high traverse eventually tips you toward Jezersko’s open meadows and glacial walls. The contrast with Tržič’s industrial gateway is the point of the ride.",
 "Decide in advance whether Jezersko is the finish (overnight) or a turnaround. Both work; only one should be improvised.",
 ),
 S(
 "How to ride it with Zyflow",
 "Plan charging and meals at both ends. Mark a bail-out if weather closes the high section.",
 "Open K16 in Zyflow to keep the full corridor visible and to browse Jezersko’s shorter loops for the next morning.",
 ),
 ],
 },
 "sl": {
 "lede": "Povezovalni alpski dan s tržiške strani Karavank v ledeniško skledo Jezerskega, iz doline v dolino, vztrajen vzpon.",
 "intro": "K16 je most v tržiškem naboru: manj razglednic, več zavezujočih gorskih kilometrov in prava menjava doline, ko se končno spustite proti Jezerskemu.",
 "sections": [
 S(
 "Iz Tržiča",
 "Iz mesta v gozd, ki vseeno nenehno pridobiva. Zgodnji kilometri dajo ton, to je prenos z zobmi, ne sprehod.",
 "Vzemite več hrane, kot mislite. V sredini je storitev manj kot na jezerskih cvetovih iz Kranja.",
 ),
 S(
 "V Jezersko",
 "Visoki prehod vas naposled nagne proti odprtim tratam in ledeniškim stenam Jezerskega. Kontrast s tržiškim industrijskim vhodom je smisel ture.",
 "Vnaprej se odločite, ali je Jezersko cilj (prenočitev) ali obrat. Oboje deluje; improvizirati sme samo eno.",
 ),
 S(
 "Kako z Zyflow",
 "Polnjenje in obroke načrtujte na obeh koncih. Označite zasilni izhod, če se visoki del zapre zaradi vremena.",
 "K16 odprite v Zyflow, da vidite ves koridor, in brskajte po krajših jezerskih zankah za naslednje jutro.",
 ),
 ],
 },
 },
 "k21-dom-pod-storzicem": {
 "en": {
 "lede": "A focused hut day from Tržič toward Dom pod Storžičem, forest gradients, mountain air and a clear turnaround under Storžič’s pyramid.",
 "intro": "K21 is built around one goal: reach the hut under Storžič, eat, then descend with fresh attention for Tržič’s streets. It is shorter than Košuta or Ljubelj in spirit, still honestly alpine.",
 "sections": [
 S(
 "Forest approach",
 "Climb from town into trees that frame glimpses of the summit. The gradient is steady rather than theatrical, good rhythm riding.",
 "Shared tracks mean courtesy. Announce passes and expect hikers near the hut.",
 ),
 S(
 "Hut and descent",
 "Dom pod Storžičem is the pause that defines the day. Check opening times; a closed hut turns a celebration into a cold sandwich stop.",
 "Descend the way you came. Brake early on loose corners and save a café in Tržič for the emotional finish.",
 ),
 S(
 "How to ride it with Zyflow",
 "Pin hut hours and a downhill coffee before you leave. Weather under Storžič can shift while you climb.",
 "Open K21 in Zyflow for the approach line and to keep the hut location obvious when the forest closes in.",
 ),
 ],
 },
 "sl": {
 "lede": "Zbran dan h koči iz Tržiča proti Domu pod Storžičem, gozdni nakloni, gorski zrak in jasen obrat pod piramido Storžiča.",
 "intro": "K21 ima en cilj: koča pod Storžičem, hrana, nato spust s svežo pozornostjo v tržiške ulice. V duhu krajša od Košute ali Ljubelja, še vedno pošteno alpska.",
 "sections": [
 S(
 "Gozdni pristop",
 "Iz mesta v drevje z utrinki vrha. Naklon je enakomeren, ne teatralen, dobra ritmična vožnja.",
 "Skupne poti pomenijo vljudnost. Napovejte prehitevanja in pričakujte pohodnike pri koči.",
 ),
 S(
 "Koča in spust",
 "Dom pod Storžičem je postanek, ki opredeli dan. Preverite odpiralni čas; zaprta koča proslavo spremeni v mrzel sendvič.",
 "Spust po isti poti. Zgodaj zavirajte v sipkih ovinkih in si za čustveni zaključek shranite kavarno v Tržiču.",
 ),
 S(
 "Kako z Zyflow",
 "Pred odhodom označite ure koče in kavo ob spustu. Vreme pod Storžičem se lahko obrne med vzponom.",
 "K21 odprite v Zyflow za linijo pristopa in jasno lokacijo koče, ko se gozd zgosti.",
 ),
 ],
 },
 },
 "k42-roznovenska": {
 "en": {
 "lede": "Tržič’s culture-forward loop toward Brezje, pilgrimage landmarks, valley towns and touring pace without a high pass.",
 "intro": "K42 is for mixed groups and heritage days: quieter roads, churches and villages, and enough distance to feel complete without Košuta’s commitment.",
 "sections": [
 S(
 "Valley heritage",
 "Link Tržič with the Brezje side of the valley. Café density is kinder than on the alpine set; photo stops come naturally.",
 "Gradients stay friendly. This is the day you bring someone who loves places more than watts.",
 ),
 S(
 "Pace and pauses",
 "Do not rush the squares and churches, they are the point. Ride assertively on busier connectors, then slow again in village cores.",
 "A bakery stop on the return seals the tone of the route.",
 ),
 S(
 "How to ride it with Zyflow",
 "Save lunch pins along the corridor and treat K42 as a warm-up before harder Tržič days.",
 "Open the route in Zyflow to keep cultural stops and navigation on one map.",
 ),
 ],
 },
 "sl": {
 "lede": "Kulturna zanka iz Tržiča proti Brezjam, romarske točke, doline in turistični ritem brez visokega prelaza.",
 "intro": "K42 je za mešane skupine in dediščinske dni: mirnejše ceste, cerkve in vasi ter dovolj razdalje, da se počuti celovito, brez zaveze Košute.",
 "sections": [
 S(
 "Dediščina doline",
 "Povežite Tržič z brezjansko stranjo doline. Kavarn je več kot na alpskem naboru; foto postanki pridejo sami.",
 "Nakloni ostanejo prijazni. To je dan za nekoga, ki ljubi kraje bolj kot vate.",
 ),
 S(
 "Ritem in postanki",
 "Ne hitite skozi trge in cerkve, to je smisel. Na prometnejših povezavah odločno, v vaških jedrih spet počasi.",
 "Pekarna na povratku zapečati ton poti.",
 ),
 S(
 "Kako z Zyflow",
 "Shranite kosila vzdolž koridorja in K42 uporabite kot ogrevanje pred težjimi tržiškimi dnevi.",
 "Pot odprite v Zyflow, da imate kulturne postanke in navigacijo na istem zemljevidu.",
 ),
 ],
 },
 },
 "k43-dobrca": {
 "en": {
 "lede": "A serious alpine day from Tržič toward Dobrča, long climbs, ridge air and the feeling of riding the Karawanks rather than around them.",
 "intro": "K43 sits with the harder Tržič alpine set: sustained climbing, thinner traffic higher up, and panoramas that justify an early start.",
 "sections": [
 S(
 "Toward the ridge",
 "Climb out of town into forest roads that refuse to flatten. Patience matters more than peak power.",
 "Pack layers. Exposure increases as trees thin and the ridge wind finds you.",
 ),
 S(
 "Dobrča rewards",
 "Wide Karawanks views are the payment for the morning’s work. Turn around with time for a careful descent.",
 "This is not a café-hopping loop, carry food and respect weather windows.",
 ),
 S(
 "How to ride it with Zyflow",
 "Mark emergency descents and a recovery stop in Tržič. Check conditions before the final push.",
 "Open K43 in Zyflow so the line and bail-outs stay visible when fog or fatigue set in.",
 ),
 ],
 },
 "sl": {
 "lede": "Zaresen alpski dan iz Tržiča proti Dobrči, dolgi vzponi, grebenski zrak in občutek, da kolesariš Karavanke, ne mimo njih.",
 "intro": "K43 sodi med težje tržiške alpske ture: dolgotrajen vzpon, višje manj prometa in panorame, zaradi katerih vstanete zgodaj.",
 "sections": [
 S(
 "Proti grebenu",
 "Iz mesta v gozdne ceste, ki nočejo splohniti. Pomembnejša je potrpežljivost kot vrhunska moč.",
 "Vzemite plastenje. Izpostavljenost raste, ko redči drevje in vas najde grebenski veter.",
 ),
 S(
 "Nagrada Dobrče",
 "Široki razgledi na Karavanke so plačilo za jutranje delo. Obrnite z dovolj časa za previden spust.",
 "To ni kavarniška zanka, nosite hrano in spoštujte vremenska okna.",
 ),
 S(
 "Kako z Zyflow",
 "Označite zasilne spuste in regeneracijo v Tržiču. Pred zadnjim pritiskom preverite razmere.",
 "K43 odprite v Zyflow, da ostaneta linija in izhodi vidna, ko prideta megla ali utrujenost.",
 ),
 ],
 },
 },
 "k51-udin-borst": {
 "en": {
 "lede": "Foothill gravel around Udin boršt, forest tracks, gentle rollers and adventure without a high pass.",
 "intro": "K51 is the confident gravel day of the Tržič shortlist: more dirt than asphalt, still close enough to town that a café finish is easy.",
 "sections": [
 S(
 "Forest edge riding",
 "Mix valley approaches with tracks through the boršt. Expect roots, soft patches after rain and the pleasure of canopy shade.",
 "Keep tyre pressure honest. Slick clay turns playful into careful.",
 ),
 S(
 "Turn back when you like",
 "The beauty of this loop family is flexibility, extend into the reserve or shorten toward asphalt whenever energy dips.",
 "Shared paths mean modest speeds near walkers.",
 ),
 S(
 "How to ride it with Zyflow",
 "Pin a café return in Tržič and an exit to asphalt if the forest turns muddy.",
 "Open K51 in Zyflow to see the gravel corridor beside the easier K52 bells loop.",
 ),
 ],
 },
 "sl": {
 "lede": "Predalpski gravel okoli Udin boršta, gozdne sledi, blagi valovi in pustolovščina brez visokega prelaza.",
 "intro": "K51 je samozavestni gravel dan tržiškega nabora: več makedama kot asfalta, še vedno dovolj blizu mesta, da je kavarniški zaključek lahek.",
 "sections": [
 S(
 "Ob gozdnem robu",
 "Zmešajte dolinske pristope s potmi skozi boršt. Pričakujte korenine, mehke zaplate po dežju in užitek sence pod krošnjami.",
 "Pritisk v pnevmatikah naj bo pošten. Spolzka glina iz igrivega naredi previdno.",
 ),
 S(
 "Obrat po želji",
 "Lepota te družine zank je prilagodljivost, podaljšajte v rezervat ali skrajšajte na asfalt, ko energija pade.",
 "Skupne poti pomenijo umirjene hitrosti pri sprehajalcih.",
 ),
 S(
 "Kako z Zyflow",
 "Označite kavarniški povratek v Tržič in izhod na asfalt, če se gozd zablati.",
 "K51 odprite v Zyflow, da vidite gravel koridor poleg lažje zanke K52.",
 ),
 ],
 },
 },
 "k52-pot-treh-zvonov": {
 "en": {
 "lede": "The easy family loop of the Tržič set, gentle terrain, village bells and a rhythm that works for mixed abilities.",
 "intro": "K52 is the gateway ride: approachable distance and gradient, still unmistakably Gorenjska countryside around Tržič. Bring kids, recovery legs or anyone new to the local roads.",
 "sections": [
 S(
 "Bells and villages",
 "Quiet roads and short connectors pass churches and hamlets. The “three bells” idea is the cultural thread, stop, listen, keep rolling.",
 "Surfaces stay friendly. This is gravel-lite at most, not a mud-fest.",
 ),
 S(
 "A first local day",
 "Use K52 to learn the basin before you attempt Ljubelj. Landmarks stick; confidence builds.",
 "Ice cream and water stops are part of the design, do not optimise them away.",
 ),
 S(
 "How to ride it with Zyflow",
 "Save family-friendly pins before you roll out. Keep the map zoomed for short decisions.",
 "Open K52 in Zyflow as the soft entry to the Tržič catalogue.",
 ),
 ],
 },
 "sl": {
 "lede": "Lahka družinska zanka tržiškega nabora, blag teren, vaški zvonovi in ritem za različne zmožnosti.",
 "intro": "K52 je vhodna tura: prijazna razdalja in naklon, a še vedno prava gorenjska pokrajina okoli Tržiča. Vzemite otroke, regeneracijske noge ali nekoga novega na lokalnih cestah.",
 "sections": [
 S(
 "Zvonovi in vasi",
 "Mirne ceste in kratke povezave mimo cerkva in zaselkov. »Trije zvonovi« so kulturna nit, ustavite se, poslušajte, peljite naprej.",
 "Podlage ostanejo prijazne. To je kvečjemu lahek gravel, ne blatna pustolovščina.",
 ),
 S(
 "Prvi lokalni dan",
 "Z K52 spoznate kotlino, preden poskusite Ljubelj. Znamenitosti se usedejo; samozavest raste.",
 "Sladoled in voda sta del zasnove, ne optimizirajte ju stran.",
 ),
 S(
 "Kako z Zyflow",
 "Pred odhodom shranite družinam prijazne pinne. Zemljevid držite približan za hitre odločitve.",
 "K52 odprite v Zyflow kot mehki vstop v tržiški katalog.",
 ),
 ],
 },
 },
 "k53-kriva-jelka": {
 "en": {
 "lede": "Into the Udin boršt nature reserve toward the crooked fir, shaded tracks and a landmark finish in the forest.",
 "intro": "K53 targets one of the area’s best-known forest landmarks. Expect soft ground after rain and a calmer alternative to the high alpine days above Tržič.",
 "sections": [
 S(
 "Reserve tracks",
 "Enter Udin boršt and follow forest roads toward Kriva jelka. The canopy keeps the day cool; the landmark gives the ride a story.",
 "Share space with walkers. Announce yourself and keep speeds modest near the tree.",
 ),
 S(
 "Nature-first riding",
 "This is not about elevation bragging rights. It is about quiet kilometres and a destination that locals name with a smile.",
 "If trails are saturated, divert to firmer connectors, the reserve prefers restraint.",
 ),
 S(
 "How to ride it with Zyflow",
 "Pin an asphalt exit and a town café. Pair with K51 or K52 for a gravel weekend without alpine weather risk.",
 "Open K53 in Zyflow to keep the reserve line obvious among similar forest tracks.",
 ),
 ],
 },
 "sl": {
 "lede": "V naravni rezervat Udin boršt do Krive jelke, senčne sledi in znamenit zaključek v gozdu.",
 "intro": "K53 cilja na eno najbolj znanih gozdnih znamenitosti. Po dežju mehka tla in mirnejša alternativa visokim alpskim dnem nad Tržičem.",
 "sections": [
 S(
 "Sledi rezervata",
 "Vstopite v Udin boršt in sledite gozdnim cestam do Krive jelke. Krošnje držijo dan hladen; znamenitost da turi zgodbo.",
 "Prostor delite s sprehajalci. Napovejte se in pri drevesu umirite tempo.",
 ),
 S(
 "Najprej narava",
 "Tu ne gre za hvalisanje z višinci. Gre za tihe kilometre in cilj, ki ga domačini imenujejo z nasmehom.",
 "Če so poti razmočene, izberite trdnejše povezave, rezervat ima raje zadržanost.",
 ),
 S(
 "Kako z Zyflow",
 "Označite izhod na asfalt in mestno kavarno. Povežite s K51 ali K52 za gravel vikend brez alpskega vremenskega tveganja.",
 "K53 odprite v Zyflow, da ostane linija rezervata jasna med podobnimi gozdnimi sledmi.",
 ),
 ],
 },
 },
 "k55-gozd-udin-borst": {
 "en": {
 "lede": "A varied foothill loop linking Gozd with Udin boršt, more climbing than the family routes, still short of alpine grades.",
 "intro": "K55 sits between easy bells and hard passes: useful when you want sweat without committing to Ljubelj or Košuta.",
 "sections": [
 S(
 "Gozd to the boršt",
 "Link the Gozd side with Udin boršt tracks. Expect mixed surfaces and short punches rather than one long climb.",
 "Navigation matters, similar junctions repeat. A saved line prevents accidental extras.",
 ),
 S(
 "Training without drama",
 "Use this as a midweek spin or a bridge day between culture and alpine plans. Elevation adds up without exposure.",
 "After rain, choose the firmer options; clay sections get ugly fast.",
 ),
 S(
 "How to ride it with Zyflow",
 "Pin a bakery return to Tržič and keep K55 beside K51/K52 on your map for mix-and-match weekends.",
 "Open the route in Zyflow so the foothill corridor stays clear.",
 ),
 ],
 },
 "sl": {
 "lede": "Raznolika predalpska zanka med Gozdom in Udin borštom, več vzpona kot družinske, še vedno pod alpskimi nakloni.",
 "intro": "K55 je med lahkimi zvonovi in težkimi prelazi, ko hočete znoj, a ne Ljubelja ali Košute.",
 "sections": [
 S(
 "Iz Gozda v boršt",
 "Povežite stran Gozda s sledmi Udin boršta. Mešane podlage in kratki sunki namesto enega dolgega vzpona.",
 "Navigacija šteje, podobna križišča se ponavljajo. Shranjena linija prepreči nenamerne ekstra kilometre.",
 ),
 S(
 "Trening brez drame",
 "Uporabite kot sredin tedna ali most med kulturo in alpskimi načrti. Višinci se naberejo brez izpostavljenosti.",
 "Po dežju izberite trdnejše možnosti; glinasti odseki hitro postanejo grdi.",
 ),
 S(
 "Kako z Zyflow",
 "Označite pekarno nazaj v Tržič in K55 držite ob K51/K52 na zemljevidu za vikende po meri.",
 "Pot odprite v Zyflow, da ostane predalpski koridor jasen.",
 ),
 ],
 },
 },
 "mali-vrh": {
 "en": {
 "lede": "A calm Jezersko half-day on forest road to the Mali vrh lookout, Virnikov Grintovec, Košuta and Storžič in one panoramic out-and-back.",
 "intro": "Mali vrh is the gentle panorama of the Jezersko set. From the TIC in Zgornje Jezersko you cross a wooden bridge toward Makekova Kočna, climb kindly on forest road, pause at the built lookout, then continue to a bench at the end of the road above the Kokra.",
 "sections": [
 S(
 "Toward Makekova Kočna",
 "Orient at the panoramic board near the TIC, then take the asphalt toward Makekova Kočna until the fork for the farm. Stay straight onto the forest road that rises without drama.",
 "After roughly four kilometres the arranged lookout under Mali vrh appears on a sharp left bend, the first big view toward Virnikov Grintovec, Komatevra, Stegovnik, Storžič and the Košuta ridge.",
 ),
 S(
 "End bench and return",
 "Continue on the same easy forest grade to the end of the road. The bench overlooks the Kokra and Jezerska Kočna, a quiet turnaround.",
 "Retrace the same line. Share space with hikers and keep speeds down on the shaded descent.",
 ),
 S(
 "How to ride it with Zyflow",
 "About 17.3 km and 596 m with roughly three hours on the clock. Pin the TIC and a valley café for afterwards.",
 "Open Mali vrh in Zyflow when you want this short alpine spin beside Ravenska Kočna or Jezerski vrh for a multi-day Jezersko stay.",
 ),
 ],
 },
 "sl": {
 "lede": "Miren jezerski poldan po gozdni cesti do razgledišča Mali vrh, Virnikov Grintovec, Košuta in Storžič v eni panoramski vožnji tja in nazaj.",
 "intro": "Mali vrh je blaga panorama jezerskega nabora. Od TIC-a v Zgornjem Jezerskem čez lesen most proti Makekovi Kočni, blago po gozdni cesti, postanek na urejenem razgledišču, nato do klopi na koncu ceste nad Kokro.",
 "sections": [
 S(
 "Proti Makekovi Kočni",
 "Orientirajte se pri panoramski tabli pri TIC-u, nato asfalt proti Makekovi Kočni do odcepa za domačijo. Naravnost naprej po gozdni cesti, ki se vzpenja brez drame.",
 "Po približno štirih kilometrih se na ostrem levem ovinku pojavi urejeno razgledišče pod Malim vrhom, prvi veliki pogled proti Virnikovemu Grintovcu, Komatevri, Stegovniku, Storžiču in grebenu Košute.",
 ),
 S(
 "Končna klop in povratek",
 "Nadaljujte po isti lahki gozdni cesti do konca. Klop gleda na Kokro in Jezersko Kočno, tih obrat.",
 "Nazaj po isti liniji. Prostor delite s pohodniki in na senčnem spustu umirite tempo.",
 ),
 S(
 "Kako z Zyflow",
 "Okoli 17,3 km in 596 m ter približno tri ure. Označite TIC in kavarnico v dolini za potem.",
 "Mali vrh odprite v Zyflow, ko hočete to kratko alpsko vožnjo poleg Ravenske Kočne ali Jezerskega vrha za večdnevno bivanje na Jezerskem.",
 ),
 ],
 },
 },
 "ravenska-kocna": {
 "en": {
 "lede": "Past Planšarsko jezero into Ravenska Kočna and up to Štularjeva planina, cirque walls, a cargo cableway and one of Jezersko’s most photogenic half-days.",
 "intro": "Ravenska Kočna is the postcard alpine loop of the valley: lake at the mouth, glacial walls ahead, and a final climb to Štularjeva planina facing Skuta. About 16.6 km and 408 m keep it ambitious but approachable.",
 "sections": [
 S(
 "Lake into the valley",
 "From the TIC ride to Planšarsko jezero and skirt it on the right. At the Pod Turni hunting lodge the barrier allows cyclists through into Ravenska Kočna.",
 "Asphalt becomes gravel past Ancel farm. Follow past the thematic path rest area and the car park to the lower station of the cargo cableway for Češka koča.",
 ),
 S(
 "Štularjeva planina",
 "Turn right for the last two kilometres of climbing. On the pasture, take time for the cirque toward Skuta and the surrounding peaks to Goli vrh.",
 "Descend the same way with hikers in mind. Pause again at the lake, it earns a slow finish in every season.",
 ),
 S(
 "How to ride it with Zyflow",
 "Roughly 2 hours 15 minutes if you ride steadily. Pin the lake café options and respect shared trail etiquette.",
 "Open Ravenska Kočna in Zyflow beside Mali vrh for a two-loop Jezersko day with a swim or coffee between.",
 ),
 ],
 },
 "sl": {
 "lede": "Mimo Planšarskega jezera v Ravensko Kočno in na Štularjevo planino, zatrep, tovorna žičnica in eden najbolj fotogeničnih jezerskih poldnevov.",
 "intro": "Ravenska Kočna je razgledniška alpska zanka doline: jezero na ustju, ledeniške stene naprej in zaključni vzpon na Štularjevo planino proti Skuti. Okoli 16,6 km in 408 m jo držita ambiciozno, a še dosegljivo.",
 "sections": [
 S(
 "Z jezera v dolino",
 "Od TIC-a do Planšarskega jezera in obidite po desni. Pri lovskem domu Pod Turni imajo kolesarji prost prehod v Ravensko Kočno.",
 "Pri kmetiji Ancel asfalt preide v makadam. Mimo počivališča tematske poti in parkirišča do spodnje postaje tovorne žičnice za Češko kočo.",
 ),
 S(
 "Štularjeva planina",
 "Desno še dobra dva kilometra vzpona. Na planini si vzemite čas za zatrep proti Skuti in vrhovom do Golega vrha.",
 "Spust po isti poti s pohodniki v mislih. Spet se ustavite ob jezeru, zasluži si počasen zaključek v vsakem letnem času.",
 ),
 S(
 "Kako z Zyflow",
 "Približno 2 uri 15 minut ob enakomerni vožnji. Označite možnosti ob jezeru in spoštujte skupne poti.",
 "Ravensko Kočno odprite v Zyflow poleg Malega vrha za dan z dvema zankama in kavo ali kopanjem vmes.",
 ),
 ],
 },
 },
 "jezerski-vrh": {
 "en": {
 "lede": "Climb to the former border crossing, then on to Ankova planina for a full panorama of Ravenska Kočna and the Kamnik Alps.",
 "intro": "Jezerski vrh is the classic Jezersko panorama ride: mineral spring at the start, border saddle in the middle, meadow lookout at the end. About 18.2 km and 457 m fit in roughly two and a half hours.",
 "sections": [
 S(
 "From slatina to the saddle",
 "Share the early road with road cyclists aiming for the border. Fill a little Jezerska slatina at the organised point, a sip is enough; save more for the return bag.",
 "Climb to the former border crossing. Between the Slovenian and Austrian buildings, turn left for the steeper finish.",
 ),
 S(
 "Ankova planina",
 "Views open fast: Ravenska Kočna, the Kamnik–Savinja wall, then the whole Jezersko valley with Veliki vrh, Kozji vrh and Storžič. Continue on easier road to Ankova planina and the old military post.",
 "Return the same way. Detour to St Andrew’s church and Šenkova domačija on the way down if time allows.",
 ),
 S(
 "How to ride it with Zyflow",
 "Weather turns fast on the saddle, check shelter options before the last climb. Pin the slatina and a valley lunch.",
 "Open Jezerski vrh in Zyflow as the bigger-view sibling to Mali vrh on a Jezersko weekend.",
 ),
 ],
 },
 "sl": {
 "lede": "Vzpon na nekdanji mejni prehod in naprej do Ankove planine, panorama Ravenske Kočne in Kamniških Alp.",
 "intro": "Jezerski vrh je klasična jezerska razgledna tura: slatina na začetku, sedlo na meji na sredini, planina na koncu. Okoli 18,2 km in 457 m v približno dveh urah in pol.",
 "sections": [
 S(
 "Od slatine do sedla",
 "Zgodnjo cesto delite s cestnimi kolesarji proti meji. Natočite malo Jezerske slatine na urejeni točki, požirek zadošča; več shranite za povratek.",
 "Vzpon do nekdanjega mejnega prehoda. Med slovenskim in avstrijskim objektom levo za strmejši zaključek.",
 ),
 S(
 "Ankova planina",
 "Razgledi se odprejo hitro: Ravenska Kočna, stena Kamniško-Savinjskih Alp, nato vsa jezerska dolina z Velikim vrhom, Kozjim vrhom in Storžičem. Nadaljujte po položnejši cesti do Ankove planine in nekdanje vojaške karavle.",
 "Nazaj po isti poti. Ob spustu po želji še cerkev sv. Andreja in Šenkova domačija.",
 ),
 S(
 "Kako z Zyflow",
 "Na sedlu se vreme hitro obrne, pred zadnjim vzponom preverite zavetje. Označite slatino in kosilo v dolini.",
 "Jezerski vrh odprite v Zyflow kot večji razgledni brat Malega vrha za vikend na Jezerskem.",
 ),
 ],
 },
 },
 "spodnji-virnik": {
 "en": {
 "lede": "The shortest Jezersko ride: Kehnjak tufa quarry, an active rock-forming spring and Spodnji Virnik farm with dairy worth packing out.",
 "intro": "Spodnji Virnik is the curiosity loop, geology you can watch happening, one steep pitch you may walk, and an organic farm finish with Grintovci views. About 9.4 km and 304 m in roughly ninety minutes.",
 "sections": [
 S(
 "Into the Kokra side valley",
 "Drop from Zgornje Jezersko to Spodnji Kraj and turn toward the upper Kokra. Virnikov Grintovec appears on the right as you roll the valley floor.",
 "Past the first rise you reach tufa stacks and the active spring where calcium carbonate is still depositing rock. It is the educational heart of the ride.",
 ),
 S(
 "Farm and spring walk",
 "After the stream crossing a short steep climb leads toward Spodnji Virnik. Leave the bike and walk minutes to the spring; then taste cheeses, yogurt and skuta at the farm if they are offering.",
 "Descend the gravel to the main road and spin home. One punchy pitch is walkable, still an easy win among short rides.",
 ),
 S(
 "How to ride it with Zyflow",
 "Bring a backpack for dairy. Pin the farm and the TIC so the short loop never feels lost.",
 "Open Spodnji Virnik in Zyflow as the rest-day or evening spin beside the bigger Jezersko panoramas.",
 ),
 ],
 },
 "sl": {
 "lede": "Najkrajša jezerska tura: kamnolom lehnjaka Kehnjak, aktivni izvir in kmetija Spodnji Virnik z mlečnimi izdelki, ki jih velja odnesti.",
 "intro": "Spodnji Virnik je zanka radovednosti, geologija, ki se dogaja pred vami, en strm odsek, ki ga lahko prehodite, in ekološka kmetija z razgledom na Grintovce. Okoli 9,4 km in 304 m v približno 90 minutah.",
 "sections": [
 S(
 "V stransko dolino Kokre",
 "Iz Zgornjega Jezerskega v Spodnji Kraj in proti zgornji dolini Kokre. Desno se odpre Virnikov Grintovec, medtem ko peljete dno doline.",
 "Po prvem vzponu pridete do skladov lehnjaka in aktivnega izvira, kjer se kalcijev karbonat še vedno odlaga. To je poučno srce ture.",
 ),
 S(
 "Kmetija in sprehod do izvira",
 "Po prečkanju potoka kratek strm vzpon proti Spodnjemu Virniku. Kolo pustite in peš do izvira; nato na kmetiji po želji siri, jogurt in skuta.",
 "Po makadamu na glavno cesto in domov. En sunkovit odsek je prehodljiv, še vedno lahka zmaga med kratkimi turami.",
 ),
 S(
 "Kako z Zyflow",
 "Vzemite nahrbtnik za mlečne izdelke. Označite kmetijo in TIC, da kratka zanka ne deluje izgubljeno.",
 "Spodnji Virnik odprite v Zyflow kot počitniški ali večerni spin poleg večjih jezerskih panoram.",
 ),
 ],
 },
 },
}


def apply_lang(data: dict, lang: str) -> None:
 for slug, pack in COPY.items():
 if slug not in data["routes"]:
 raise SystemExit(f"missing route {slug}")
 block = pack[lang]
 route = data["routes"][slug]
 route["lede"] = block["lede"]
 route["intro"] = block["intro"]
 route["sections"] = block["sections"]
 # Drop legacy flat keys so parity stays clean
 for k in (
 "section1Title",
 "section1Body",
 "section2Title",
 "section2Body",
 ):
 route.pop(k, None)
 data["routes"][slug] = route


def main() -> None:
 missing = []
 for path, lang in ((EN, "en"), (SL, "sl")):
 data = json.loads(path.read_text())
 apply_lang(data, lang)
 for slug in data["routes"]:
 if slug not in COPY:
 missing.append(slug)
 path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
 # stats
 chars = sum(
 len(data["routes"][s]["intro"])
 + sum(
 len(sec["body"]) + len(sec.get("body2", ""))
 for sec in data["routes"][s]["sections"]
 )
 for s in data["routes"]
 )
 print(f"{path.name}: avg body chars ~{chars // len(data['routes'])}")
 if missing:
 raise SystemExit(f"no expanded copy for {sorted(set(missing))}")

 # parity
 en = json.loads(EN.read_text())
 sl = json.loads(SL.read_text())

 def keys(obj, prefix=""):
 out = set()
 if isinstance(obj, dict):
 for k, v in obj.items():
 p = f"{prefix}.{k}" if prefix else k
 out.add(p)
 out |= keys(v, p)
 elif isinstance(obj, list):
 for i, v in enumerate(obj):
 p = f"{prefix}[{i}]"
 out.add(p)
 out |= keys(v, p)
 return out

 diff = keys(en) ^ keys(sl)
 if diff:
 raise SystemExit(f"parity broken: {sorted(list(diff))[:20]}")
 print("parity ok, routes", len(COPY))


if __name__ == "__main__":
 main()
