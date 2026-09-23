const PRIMARY_DISTRICTS = new Set([
  "Kasaragod","Kannur","Wayanad","Kozhikode","Malappuram","Palakkad",
  "Thrissur","Idukki","Alappuzha","Pathanamthitta","Kollam","Thiruvananthapuram"
]);

export function districtAttractionVisitId(district, attraction, index = 0) {
  if (index === 0 && PRIMARY_DISTRICTS.has(district)) return "district-landmark:" + district;
  return "district-attraction:" + district + ":" + attraction.id;
}

const DISTRICT_CONTENT = [
  {
    district:"Kasaragod", city:"Kasaragod Town", market:"Kasaragod Market", cafe:"Bekal Cafe",
    secondary:"Bekal Road", neighbourhood:"Kanhangad Link", environment:"coastal", landscape:"Northern coast & backwaters",
    culture:{
      identity:"A multilingual meeting point of northern Kerala and Tulunadu, with a long coastline and historic forts.",
      language:"Malayalam, Tulu, Kannada and other languages shape everyday life across the district.",
      arts:"Theyyam, Yakshagana and Poorakkali are important regional performance traditions.",
      food:"Malabar seafood, local rice dishes and coastal snacks.",
      foodShort:"SEAFOOD · RICE · MALABAR FLAVOURS",
      festivals:"Theyyam performances follow local shrine calendars; Bekal hosts a beach festival.",
      crafts:"Handloom weaving and coir work connect local craft and livelihoods.",
      placard:"THEYYAM · YAKSHAGANA · COASTAL FOOD"
    },
    attractions:[
      {id:"bekal-fort",name:"Bekal Fort",kind:"fort",icon:"F",x:50,z:45,description:"Walk the laterite ramparts and look out over the Arabian Sea."},
      {id:"ananthapura-lake-temple",name:"Ananthapura Lake Temple",kind:"temple",icon:"T",x:-78,z:42,description:"A temple on a small island in a lake near Kumbla."},
      {id:"valiyaparamba-backwaters",name:"Valiyaparamba Backwaters",kind:"backwater",icon:"B",x:72,z:12,description:"Explore a quiet backwater network edged by coconut groves and fishing villages."},
      {id:"madhur-temple",name:"Madhur Temple",kind:"temple",icon:"T",x:-78,z:-36,description:"See the distinctive temple architecture beside the Madhuvahini River."}
    ]
  },
  {
    district:"Kannur", city:"Kannur Town", market:"Fort Road Market", cafe:"Payyambalam Cafe",
    secondary:"Payyambalam", neighbourhood:"Thavakkara", environment:"coastal", landscape:"Malabar coast & river inlets",
    culture:{
      identity:"A Malabar port district known for coastal landscapes, handloom communities and living ritual arts.",
      language:"Malayalam is spoken alongside regional Mappila and northern Malabar speech traditions.",
      arts:"Theyyam, Kalaripayattu and Mappila songs are strongly associated with Kannur.",
      food:"Malabar biryani, pathiri and freshly prepared coastal seafood.",
      foodShort:"BIRYANI · PATHIRI · SEAFOOD",
      festivals:"Theyyam performances are seasonal and tied to individual shrines and communities.",
      crafts:"Kannur handloom and the crafts of Kunhimangalam are part of the district's heritage.",
      placard:"THEYYAM · KALARIPAYATTU · HANDLOOM"
    },
    attractions:[
      {id:"st-angelo-fort",name:"St. Angelo Fort",kind:"fort",icon:"F",x:50,z:45,description:"Explore the Portuguese-built sea fort and its later colonial layers."},
      {id:"payyambalam-beach",name:"Payyambalam Beach",kind:"beach",icon:"B",x:-78,z:42,description:"A broad city beach used for evening walks and sunset views."},
      {id:"muzhappilangad-beach",name:"Muzhappilangad Drive-in Beach",kind:"beach",icon:"B",x:72,z:12,description:"A long, firm shoreline known for its drive-in beach stretch."},
      {id:"arakkal-museum",name:"Arakkal Museum",kind:"museum",icon:"M",x:-78,z:-36,description:"Visit the museum in the former palace of Kerala's Arakkal royal family."}
    ]
  },
  {
    district:"Wayanad", city:"Kalpetta Town", market:"Kalpetta Market", cafe:"Hill View Cafe",
    secondary:"Meppadi Road", neighbourhood:"Meppadi", environment:"highland", landscape:"Western Ghats highlands",
    culture:{
      identity:"A highland district of forest edges, coffee and spice-growing areas, paddy fields and distinct Indigenous communities.",
      language:"Malayalam is widely used; Wayanad is home to communities with their own languages and traditions.",
      arts:"Community-specific Indigenous arts and seasonal temple and harvest traditions are locally rooted.",
      food:"Wayanadan rice, bamboo-shoot dishes, coffee and spice-rich local cooking.",
      foodShort:"WAYANADAN RICE · COFFEE · SPICES",
      festivals:"Local temple, harvest and community festivals vary by place and season.",
      crafts:"Coffee, pepper, cardamom and small-scale farming shape local livelihoods.",
      placard:"HIGHLAND FARMS · COFFEE · SPICE"
    },
    attractions:[
      {id:"edakkal-caves",name:"Edakkal Caves",kind:"cave",icon:"C",x:50,z:45,description:"Follow the rocky ascent to the caves and their prehistoric engravings."},
      {id:"pookode-lake",name:"Pookode Lake",kind:"lake",icon:"L",x:-78,z:42,description:"A forest-fringed freshwater lake near Vythiri."},
      {id:"chembra-peak",name:"Chembra Peak",kind:"peak",icon:"H",x:72,z:12,description:"Reach the highland viewpoint above Meppadi's tea and forest slopes."},
      {id:"thirunelli-temple",name:"Thirunelli Temple",kind:"temple",icon:"T",x:-78,z:-36,description:"Visit the ancient temple setting in the Brahmagiri hills."}
    ]
  },
  {
    district:"Kozhikode", city:"Kozhikode City", market:"SM Street Market", cafe:"Beach Road Cafe",
    secondary:"Beach Road", neighbourhood:"Mananchira", environment:"coastal", landscape:"Malabar city & shoreline",
    culture:{
      identity:"A historic Malabar port city where maritime trade, literature, food and craft traditions meet.",
      language:"Malayalam and Mappila cultural traditions are prominent in the city's public life.",
      arts:"Mappila songs and the ritual performance Poorakkali are part of the wider Malabar arts landscape.",
      food:"Kozhikodan halwa, Malabar biryani and seafood from the coast.",
      foodShort:"HALWA · BIRYANI · SEAFOOD",
      festivals:"Beypore's water festival and local temple festivals bring activity to the coast.",
      crafts:"Beypore's uru shipbuilding and regional handloom work are notable craft traditions.",
      placard:"BEYPORE URU · HALWA · MAPPILA FOOD"
    },
    attractions:[
      {id:"kozhikode-beach",name:"Kozhikode Beach",kind:"beach",icon:"B",x:50,z:45,description:"A lively waterfront promenade with views of the Arabian Sea."},
      {id:"beypore-uru-yard",name:"Beypore Uru Yard",kind:"shipyard",icon:"S",x:-78,z:42,description:"See the traditional wooden dhow-building heritage of Beypore."},
      {id:"sm-street",name:"SM Street",kind:"market",icon:"M",x:72,z:12,description:"Walk the busy Sweet Meat Street, known for shops and Kozhikodan halwa."},
      {id:"kappad-beach",name:"Kappad Beach",kind:"beach",icon:"B",x:-78,z:-36,description:"Visit the calm coastal stretch north of Kozhikode city."}
    ]
  },
  {
    district:"Malappuram", city:"Malappuram Town", market:"Malappuram Market", cafe:"Malabar Cafe",
    secondary:"Kottakkunnu Road", neighbourhood:"Up Hill", environment:"highland", landscape:"Malabar hills & river plains",
    culture:{
      identity:"A district of Malabar literary memory, river towns, hill viewpoints and strong community life.",
      language:"Malayalam is widely spoken, with Mappila and Arabi-Malayalam histories part of the region's heritage.",
      arts:"Mappila pattu and storytelling traditions are part of the district's cultural history.",
      food:"Malabar biryani, pathiri and regional tea-shop snacks.",
      foodShort:"MALABAR BIRYANI · PATHIRI",
      festivals:"The Mamankam heritage site at Tirunavaya and local festivals mark a layered history.",
      crafts:"Nilambur's teak heritage and local woodcraft connect culture with the forest economy.",
      placard:"MAPPILA PATTU · MALABAR FOOD"
    },
    attractions:[
      {id:"kottakkunnu",name:"Kottakkunnu",kind:"hill",icon:"H",x:50,z:45,description:"Take in the hilltop park and town views from Malappuram."},
      {id:"thunchan-parambu",name:"Thunchan Parambu",kind:"heritage",icon:"H",x:-78,z:42,description:"Visit the memorial garden associated with Malayalam poet Thunchath Ezhuthachan."},
      {id:"nilambur-teak-museum",name:"Nilambur Teak Museum",kind:"museum",icon:"M",x:72,z:12,description:"Explore exhibits on teak, forests and the Nilambur region."},
      {id:"kadalundi-bird-sanctuary",name:"Kadalundi Bird Sanctuary",kind:"sanctuary",icon:"W",x:-78,z:-36,description:"Look across the estuary and mangroves used by resident and migratory birds."}
    ]
  },
  {
    district:"Palakkad", city:"Palakkad Town", market:"Fort Market", cafe:"Fort Gate Cafe",
    secondary:"Fort Road", neighbourhood:"Sultanpet", environment:"plains", landscape:"Palakkad Gap & paddy plains",
    culture:{
      identity:"An inland gateway through the Palakkad Gap, with paddy country, forts and Tamil–Malayalam cultural exchange.",
      language:"Malayalam and Tamil-speaking communities meet across the gap and nearby border towns.",
      arts:"Kalpathy's agraharam traditions and Carnatic music are distinctive parts of Palakkad's heritage.",
      food:"Palakkadan matta rice, traditional vegetarian meals and snacks.",
      foodShort:"PALAKKADAN MATTA RICE · SADYA",
      festivals:"Kalpathy Ratholsavam is a major annual chariot festival in the heritage village.",
      crafts:"Handloom, rice farming and traditional music remain important local livelihoods and skills.",
      placard:"KALPATHY · MATTA RICE · PALAKKAD GAP"
    },
    attractions:[
      {id:"palakkad-fort",name:"Palakkad Fort",kind:"fort",icon:"F",x:50,z:45,description:"Walk around the well-preserved fort moat and ramparts in Palakkad town."},
      {id:"malampuzha-garden",name:"Malampuzha Garden & Dam",kind:"garden",icon:"G",x:-78,z:42,description:"Visit the dam-side gardens and reservoir below the Western Ghats."},
      {id:"kalpathy-heritage-village",name:"Kalpathy Heritage Village",kind:"temple",icon:"H",x:72,z:12,description:"Explore the historic agraharam streets and temple setting."},
      {id:"nelliyampathy-viewpoint",name:"Nelliyampathy Hills",kind:"peak",icon:"H",x:-78,z:-36,description:"Climb toward viewpoints over the forested hill ranges and plains."}
    ]
  },
  {
    district:"Thrissur", city:"Thrissur Round", market:"Sakthan Market", cafe:"Round Cafe",
    secondary:"Swaraj Round", neighbourhood:"East Fort", environment:"urban-park", landscape:"Temple town & cultural centre",
    culture:{
      identity:"Often called Kerala's cultural capital, Thrissur combines temple heritage, performance arts and a busy town centre.",
      language:"Malayalam is the everyday language; many classical and folk performance traditions are practised here.",
      arts:"Thrissur Pooram percussion, Pulikali and classical performing arts are prominent.",
      food:"Thrissur-style meals, local snacks and festival payasam.",
      foodShort:"THRISSUR MEALS · SNACKS · PAYASAM",
      festivals:"Thrissur Pooram fills Thekkinkadu Maidan with percussion and processions each year.",
      crafts:"Temple mural painting and bell-metal work are among the region's heritage crafts.",
      placard:"POORAM · PULIKALI · PERCUSSION"
    },
    attractions:[
      {id:"thekkinkadu-maidan",name:"Thekkinkadu Maidan",kind:"park",icon:"P",x:50,z:45,description:"The open green at the centre of Thrissur's temple town and Pooram celebrations."},
      {id:"vadakkunnathan-temple",name:"Vadakkunnathan Temple",kind:"temple",icon:"T",x:-78,z:42,description:"A historic temple complex surrounded by Thekkinkadu Maidan."},
      {id:"shakthan-palace",name:"Shakthan Thampuran Palace",kind:"palace",icon:"P",x:72,z:12,description:"Visit the palace museum associated with the Cochin royal family."},
      {id:"athirappilly-waterfalls",name:"Athirappilly Waterfalls",kind:"waterfall",icon:"W",x:-78,z:-36,description:"See the wide waterfall on the Chalakudy River in the forested high ranges."}
    ]
  },
  {
    district:"Ernakulam", city:"Kochi City", market:"Broadway Market", cafe:"Fort Kochi Cafe",
    secondary:"Marine Drive", neighbourhood:"Mattancherry", environment:"coastal", landscape:"Kochi harbour & island coast",
    culture:{
      identity:"Kochi's port, island and historic neighbourhoods reflect centuries of trade and cultural exchange.",
      language:"Malayalam is widely spoken, alongside the many languages used by Kochi's port and trading communities.",
      arts:"Kathakali, Kalaripayattu and the Kochi-Muziris Biennale all have visible places in the wider city.",
      food:"Karimeen pollichathu, seafood, kappa and coastal Kerala meals.",
      foodShort:"SEAFOOD · KARIMEEN · KAPPA",
      festivals:"Thrippunithura's Athachamayam parade opens Kerala's Onam celebrations.",
      crafts:"Spice trading, coir and the craft markets of Mattancherry and Fort Kochi.",
      placard:"KOCHI HARBOUR · SPICE TRADE · SEAFOOD"
    },
    attractions:[
      {id:"mattancherry-palace",name:"Mattancherry Palace",kind:"palace",icon:"P",x:-10,z:23,description:"Explore the palace museum and its Kerala murals in historic Mattancherry."},
      {id:"fort-kochi-waterfront",name:"Fort Kochi & Chinese Fishing Nets",kind:"waterfront",icon:"W",x:-78,z:60,description:"Walk the waterfront past the Chinese fishing nets and colonial-era streets."},
      {id:"cherai-beach",name:"Cherai Beach",kind:"beach",icon:"B",x:78,z:58,description:"Visit the sandy coast on Vypin Island, where backwaters meet the sea."},
      {id:"kumbalangi-village",name:"Kumbalangi Tourism Village",kind:"backwater",icon:"B",x:-78,z:-65,description:"See a working fishing village among Kochi's backwaters and mangroves."}
    ]
  },
  {
    district:"Idukki", city:"Painavu Town", market:"Hill Market", cafe:"Dam View Cafe",
    secondary:"Dam Road", neighbourhood:"Cheruthoni", environment:"highland", landscape:"High ranges, tea & spice country",
    culture:{
      identity:"A high-range district shaped by forests, reservoirs, tea estates and spice-growing settlements.",
      language:"Malayalam is widely spoken; the district's hill communities have varied local histories and traditions.",
      arts:"Temple and harvest celebrations follow local calendars across the high ranges.",
      food:"Spice-rich high-range cooking, locally grown tea, cardamom and pepper.",
      foodShort:"HIGH-RANGE SPICES · TEA · PEPPER",
      festivals:"Local temple and harvest events vary between the hill towns and settlements.",
      crafts:"Tea, cardamom and pepper farming shape much of the district's work and landscape.",
      placard:"TEA HILLS · CARDAMOM · HIGH RANGES"
    },
    attractions:[
      {id:"idukki-arch-dam",name:"Idukki Arch Dam",kind:"dam",icon:"D",x:50,z:45,description:"View the arch dam set between the Kuravan and Kurathi hills."},
      {id:"munnar-tea-gardens",name:"Munnar Tea Gardens",kind:"tea",icon:"H",x:-78,z:42,description:"Drive among the rolling tea slopes and plantation roads around Munnar."},
      {id:"eravikulam-national-park",name:"Eravikulam National Park",kind:"sanctuary",icon:"W",x:72,z:12,description:"Explore high-altitude grasslands and shola forest near Rajamalai."},
      {id:"periyar-lake",name:"Periyar Lake & Tiger Reserve",kind:"lake",icon:"L",x:-78,z:-36,description:"See the forest reservoir and wildlife landscape around Thekkady."}
    ]
  },
  {
    district:"Alappuzha", city:"Alappuzha Town", market:"Canal Market", cafe:"Boat Jetty Cafe",
    secondary:"Canal Road", neighbourhood:"Mullakkal", environment:"backwater", landscape:"Canals, polders & Arabian Sea",
    culture:{
      identity:"A water-shaped district of canals, coir-making villages, below-sea-level farming and boat-race traditions.",
      language:"Malayalam is spoken across the town and the backwater villages.",
      arts:"Vallamkali boat songs and synchronized rowing carry a strong local tradition.",
      food:"Kuttanadan duck curry, karimeen pollichathu and fresh backwater fish.",
      foodShort:"KUTTANADAN DUCK · KARIMEEN",
      festivals:"The Nehru Trophy Snake Boat Race is held on Punnamada Lake.",
      crafts:"Coir rope-making and boat building are closely tied to local waterways.",
      placard:"VALLAMKALI · COIR · KUTTANADAN FOOD"
    },
    attractions:[
      {id:"alappuzha-backwaters",name:"Alappuzha Backwaters",kind:"backwater",icon:"B",x:50,z:45,description:"Follow the canal-side routes through the town's backwater network."},
      {id:"kuttanad-polders",name:"Kuttanad Rice Fields",kind:"ricefield",icon:"R",x:-78,z:42,description:"See low-lying paddy fields and canals in Kerala's rice-bowl region."},
      {id:"punnamada-lake",name:"Punnamada Lake",kind:"lake",icon:"L",x:72,z:12,description:"Visit the lake where the Nehru Trophy Snake Boat Race takes place."},
      {id:"ambalappuzha-temple",name:"Ambalappuzha Sri Krishna Temple",kind:"temple",icon:"T",x:-78,z:-36,description:"Explore the historic temple known for its Kerala-style architecture and payasam."}
    ]
  },
  {
    district:"Kottayam", city:"Kottayam Town", market:"Kottayam Market", cafe:"Vembanad Cafe",
    secondary:"Kumarakom Road", neighbourhood:"Kumarakom", environment:"backwater", landscape:"Vembanad lake, rubber hills & town",
    culture:{
      identity:"A district of publishing and education, rubber-growing country and the Vembanad backwater shore.",
      language:"Malayalam is the main language; Kottayam also has long-standing publishing and literary communities.",
      arts:"Literary, church and temple traditions sit alongside the boat and birdlife culture of Kumarakom.",
      food:"Freshwater fish, duck dishes and local tapioca and rice meals.",
      foodShort:"FRESHWATER FISH · DUCK · TAPIOCA",
      festivals:"Vaikom's temple festival and local boat events bring nearby communities together.",
      crafts:"Rubber cultivation, printing and book publishing are part of Kottayam's working identity.",
      placard:"PUBLISHING · RUBBER · VEMBANAD"
    },
    attractions:[
      {id:"kumarakom-bird-sanctuary",name:"Kumarakom Bird Sanctuary",kind:"sanctuary",icon:"W",x:-72,z:42,description:"Walk the wooded shore path beside Vembanad Lake and its bird habitat."},
      {id:"vaikom-mahadeva-temple",name:"Vaikom Mahadeva Temple",kind:"temple",icon:"T",x:72,z:12,description:"Visit one of Kerala's historic Shiva temples and its town surroundings."},
      {id:"illikkal-kallu",name:"Illikkal Kallu",kind:"peak",icon:"H",x:-72,z:-36,description:"Travel into the highland landscape for the rocky Illikkal Kallu viewpoint."},
      {id:"thirunakkara-temple",name:"Thirunakkara Mahadeva Temple",kind:"temple",icon:"T",x:50,z:45,description:"Explore the central Kottayam temple and its murals and festival setting."}
    ]
  },
  {
    district:"Pathanamthitta", city:"Pathanamthitta Town", market:"Central Market", cafe:"River View Cafe",
    secondary:"Konni Road", neighbourhood:"Central Junction", environment:"highland", landscape:"Pilgrimage routes, rivers & forest",
    culture:{
      identity:"A river-and-forest district known for pilgrimage routes, Aranmula heritage and craft traditions.",
      language:"Malayalam is widely spoken, with seasonal visitors adding many languages to the pilgrimage routes.",
      arts:"Aranmula's metal mirror craft and the songs of the boat-race tradition are distinctive.",
      food:"Aranmula Vallasadya and traditional Kerala vegetarian meals.",
      foodShort:"VALLASADYA · KERALA MEALS",
      festivals:"Aranmula Uthrittathi boat race and the Sabarimala pilgrimage season shape the calendar.",
      crafts:"Aranmula Kannadi mirrors are handmade using a closely guarded local metal-alloy technique.",
      placard:"ARANMULA BOATS · KANNADI · PILGRIMAGE"
    },
    attractions:[
      {id:"konni-elephant-training-centre",name:"Konni Elephant Training Centre",kind:"sanctuary",icon:"W",x:50,z:45,description:"Visit the forest-edge elephant heritage centre near Konni."},
      {id:"aranmula-temple",name:"Aranmula Parthasarathy Temple",kind:"temple",icon:"T",x:-78,z:42,description:"Explore the river-side temple connected with Aranmula's boat-race tradition."},
      {id:"gavi-eco-tourism",name:"Gavi Eco-tourism",kind:"forest",icon:"W",x:72,z:12,description:"Travel into the forest landscape of Gavi in the Western Ghats."},
      {id:"perunthenaruvi-falls",name:"Perunthenaruvi Falls",kind:"waterfall",icon:"W",x:-78,z:-36,description:"Follow the forest road to the waterfall on the Pamba River."}
    ]
  },
  {
    district:"Kollam", city:"Kollam City", market:"Chinnakada Market", cafe:"Lake View Cafe",
    secondary:"Ashtamudi Road", neighbourhood:"Kadappakada", environment:"backwater", landscape:"Ashtamudi lake, coast & cashew country",
    culture:{
      identity:"A historic port and cashew centre beside Ashtamudi Lake, with island villages and a long coast.",
      language:"Malayalam is the everyday language across the city, lakeshore and coastal communities.",
      arts:"The Kallada Boat Race and lakeside boat traditions are part of Kollam's cultural calendar.",
      food:"Ashtamudi fish, coastal seafood and Kollam-style cashew sweets.",
      foodShort:"ASHTAMUDI FISH · CASHEW · SEAFOOD",
      festivals:"The Kallada Boat Race brings longboat teams to the region's waterways.",
      crafts:"Cashew processing, coir and fishing remain visible parts of the local economy.",
      placard:"ASHTAMUDI · CASHEW · BOAT RACES"
    },
    attractions:[
      {id:"ashtamudi-lake",name:"Ashtamudi Lake",kind:"backwater",icon:"L",x:50,z:45,description:"Follow the broad lake and its palm-lined waterways near Kollam."},
      {id:"munroe-island",name:"Munroe Island",kind:"backwater",icon:"B",x:-78,z:42,description:"Explore the narrow canals and village islands where Ashtamudi meets the Kallada River."},
      {id:"thangassery-lighthouse",name:"Thangassery Lighthouse",kind:"lighthouse",icon:"L",x:72,z:12,description:"See the coastal lighthouse and historic harbour-side neighbourhood."},
      {id:"jatayu-earth-centre",name:"Jatayu Earth's Center",kind:"hill",icon:"H",x:-78,z:-36,description:"Reach the hilltop landscape and sculpture park at Chadayamangalam."}
    ]
  },
  {
    district:"Thiruvananthapuram", city:"Thiruvananthapuram City", market:"Chalai Market", cafe:"Museum Cafe",
    secondary:"Kanakakkunnu Road", neighbourhood:"Palayam", environment:"coastal", landscape:"Capital city, heritage & south coast",
    culture:{
      identity:"Kerala's capital blends Travancore-era heritage, public museums, pilgrimage places and a southern coastline.",
      language:"Malayalam is the main language; the capital also brings together people from across Kerala and India.",
      arts:"Kathakali, classical music and the city's museum and palace collections are part of its cultural life.",
      food:"Travancore-style meals, appam and stew, and coastal seafood.",
      foodShort:"TRAVANCORE MEALS · SEAFOOD",
      festivals:"Attukal Pongala is one of the city's best-known annual festivals; Onam is celebrated statewide.",
      crafts:"Wood carving, mural painting and coir work feature in the wider Travancore craft tradition.",
      placard:"TRAVANCORE HERITAGE · ARTS · COAST"
    },
    attractions:[
      {id:"padmanabhaswamy-temple",name:"Sree Padmanabhaswamy Temple",kind:"temple",icon:"T",x:50,z:45,description:"Visit the historic temple at the heart of the old Travancore capital."},
      {id:"kovalam-beach",name:"Kovalam Beach",kind:"beach",icon:"B",x:-78,z:42,description:"Explore the crescent bays and lighthouse headland south of the city."},
      {id:"napier-museum",name:"Napier Museum",kind:"museum",icon:"M",x:72,z:12,description:"See the museum's distinctive Indo-Saracenic architecture and collections."},
      {id:"varkala-cliff",name:"Varkala Cliff",kind:"coast",icon:"C",x:-78,z:-36,description:"Walk the laterite cliff above the Arabian Sea at Varkala."}
    ]
  }
];

export const KERALA_DISTRICT_ATLAS = Object.freeze(Object.fromEntries(DISTRICT_CONTENT.map(entry => {
  const attractions = Object.freeze(entry.attractions.map((spot,index) => Object.freeze({
    ...spot,
    visitRadius: 8,
    landmarkId: districtAttractionVisitId(entry.district, spot, index)
  })));
  return [entry.district, Object.freeze({
    ...entry,
    culture: Object.freeze(entry.culture),
    attractions
  })];
})));


