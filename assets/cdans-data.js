/* =============================================================================
 * CDANS Distillery Guide — Data
 * -----------------------------------------------------------------------------
 * 17 certified Nova Scotia distilleries (numbered to match the printed map),
 * each with a description (OCR'd from the print guide), street address,
 * product/bottle image, and "associate member" branch spots (POIs) that link
 * out from the guide.
 *
 * COORDINATES NOTE: distillery coords are derived from their street address and
 * are accurate to the town/block. POI coords are best-estimate placements and
 * are flagged `approx:true`. Use the built-in Editor mode (button in the
 * sidebar header) to drag any marker and copy back exact coords.
 *
 * POI categories drive the legend + icons:
 *   hike   = trail / park / nature       (hiking icon)
 *   stay   = hotel / inn / B&B / Airbnb  (bed icon)
 *   scenic = lookoff / museum / landmark (camera icon)
 *   food   = cafe / restaurant / market  (cup icon)
 * ========================================================================== */

window.CDANS_DATA = {
  brand: { ocean: "#005166", land: "#cdc5b6", star: "#b8893f", ink: "#1c2b30" },

  /* Flat brand basemap (NS silhouette, stars stripped) + its natural size.
   * Markers are positioned in image-pixel space (px,py from top-left) so they
   * sit exactly where the printed map's numbered stars were. */
  basemap: {
    url: "assets/map-base.svg",
    w: 825,
    h: 311,
    decorations: { url: "assets/map-background-icons.svg", scale: 1, offsetX: 22, offsetY: 0, opacity: 0.95 }
  },

  /* slug -> [px, py] pixel position on the basemap (top-left origin) */
  pixels: {
    "boatskeg": [90, 267], "still-fired": [140, 148], "barrelling-tide": [284, 124],
    "james-roue": [317, 147], "cherry-tree": [300, 146], "ironworks": [260, 222],
    "compass": [339, 213], "coldstream": [391, 131], "caldera": [444, 95],
    "steinhart": [515, 132], "below-the-salt": [578, 160], "glenora": [619, 95],
    "black-harbour": [281, 202], "north-mountain": [306, 193], "good-robot": [322, 222],
    "raging-crow": [485, 134], "ns-spirit": [477, 134]
  },

  distilleries: [
    {
      num: 1, slug: "boatskeg", name: "Boatskeg Distilling Co.",
      lat: 43.6035, lng: -65.7615,
      address: "23 Chemin du Pont du Marais, Lower West Pubnico, NS, B0W 2C0",
      image: "assets/actual-bottles/1.png",
      cardImage: "assets/bottles/boatskeg.png",
      desc: "Just steps from the ocean in West Pubnico, enjoy a locally crafted drink at this boat shop-turned-cocktail bar and patio. The salted caramel vodka is a can't-miss specialty.",
      pois: [
        { name: "Dennis Point Café", cat: "food", lat: 43.5940, lng: -65.7560, mapX: 72, mapY: 258, approx: true, url: "https://www.facebook.com/DennisPointCafe/?locale=fr_FR" },
        { name: "West Pubnico Golf Course", cat: "scenic", lat: 43.6260, lng: -65.7430, mapX: 74, mapY: 256, approx: true, url: "https://www.westpubnicogolf.com/" },
        { name: "Red Cap Restaurant & Motel", cat: "stay", lat: 43.6300, lng: -65.7560, mapX: 72, mapY: 255, approx: true, url: "https://redcaprestaurantandmotel.com/" }
      ]
    },
    {
      num: 2, slug: "still-fired", name: "Still Fired Distilleries",
      lat: 44.7430, lng: -65.5130,
      address: "9548 Nova Scotia Trunk 8, Annapolis Royal, NS, B0S 1A0",
      image: "assets/actual-bottles/2.png",
      cardImage: "assets/bottles/still-fired.png",
      desc: "Crafting small-batch spirits from Nova Scotia's first legally built stills, this Annapolis Royal team creates unique blends with local ingredients. Come in for a free sample and leave with a bottle.",
      pois: [
        { name: "Whiskey Teller (next to Fortview Golf)", cat: "food", lat: 44.7480, lng: -65.5200, mapX: 111, mapY: 175, approx: true, url: null },
        { name: "Mickey Hill Provincial Park Trail", cat: "hike", lat: 44.6222, lng: -65.3621, mapX: 138, mapY: 184, approx: true, url: "https://novascotia.com/listing/mickey-hill-provincial-park/" },
        { name: "Fort Anne National Historic Site", cat: "scenic", lat: 44.7420, lng: -65.5180, mapX: 111, mapY: 176, approx: true, url: "https://novascotia.com/listing/fort-anne-national-historic-site/" }
      ]
    },
    {
      num: 3, slug: "barrelling-tide", name: "Barrelling Tide Distillery",
      lat: 45.1010, lng: -64.4190,
      address: "1164 Parkway Drive, Port Williams, NS, B0P 1T0",
      image: "assets/actual-bottles/3.png",
      cardImage: "assets/bottles/barrelling-tide.png",
      desc: "Award-winning small-batch spirits and liqueurs crafted with local ingredients and thoughtful craftsmanship — where every tide has a story. Book a tour, enjoy a complimentary tasting, or try a cocktail flight!",
      pois: [
        { name: "Fox Hill Cheese House", cat: "food", lat: 45.1030, lng: -64.4170, mapX: 295, mapY: 150, approx: true, url: "https://www.foxhillcheesehouse.com/" },
        { name: "Blomidon Provincial Park", cat: "hike", lat: 45.2580, lng: -64.3490, mapX: 306, mapY: 139, approx: true, url: "https://parks.novascotia.ca/park/blomidon" },
        { name: "Old Orchard Inn | Terroir Restaurant", cat: "stay", lat: 45.0930, lng: -64.3270, mapX: 310, mapY: 151, approx: true, url: "https://oldorchardinn.com/" }
      ]
    },
    {
      num: 4, slug: "james-roue", name: "James Roué Beverage Co.",
      lat: 44.9890, lng: -64.1370,
      address: "201 Water Street, Windsor, NS, B0N 2T0",
      image: "assets/actual-bottles/4.png",
      cardImage: "assets/bottles/james-roue.png",
      desc: "Blending tradition with innovation, Atlantic Canada's largest craft rum distillery delivers complex, layered flavours. Stop in for a tasting and discover their flagship Rum-Nova.",
      pois: [
        { name: "Walkers Restaurant", cat: "food", lat: 44.9880, lng: -64.1360, mapX: 342, mapY: 158, approx: true, url: "https://www.walkersrestaurant.ca/" },
        { name: "Clifton Museum Park Circular", cat: "scenic", lat: 44.9930, lng: -64.1450, mapX: 340, mapY: 158, approx: true, url: "https://clifton.novascotia.ca/" },
        { name: "Birthplace of Hockey Museum", cat: "scenic", lat: 44.9870, lng: -64.1390, mapX: 341, mapY: 158, approx: true, url: "https://birthplaceofhockey.ca/" }
      ]
    },
    {
      num: 5, slug: "cherry-tree", name: "Cherry Tree Distillery",
      lat: 44.9905, lng: -64.1395,
      address: "163 Gerrish Street, Windsor, NS, B0N 2T0",
      image: "assets/actual-bottles/5.png",
      cardImage: "assets/bottles/cherry-tree.png",
      desc: "With a vintage speakeasy vibe, this micro distillery and intimate tasting bar in Windsor features a variety of spirits and mixers. Try mini cocktail flights and enjoy a relaxed, jazz-filled atmosphere.",
      pois: [
        { name: "Gerrish & Gray Café", cat: "food", lat: 44.9900, lng: -64.1390, mapX: 341, mapY: 158, approx: true, url: "https://www.gerrishandgray.ca/" },
        { name: "Lake Pisiquid Loop", cat: "hike", lat: 44.9820, lng: -64.1310, mapX: 343, mapY: 159, approx: true, url: null },
        { name: "Geldert Guest House B&B", cat: "stay", lat: 44.9950, lng: -64.1420, mapX: 341, mapY: 158, approx: true, url: "https://geldertguesthouse.com/" }
      ]
    },
    {
      num: 6, slug: "ironworks", name: "Ironworks Distillery",
      lat: 44.3765, lng: -64.3160,
      address: "2 Kempt Street, Lunenburg, NS, B0J 2C0",
      image: "assets/actual-bottles/6.png",
      cardImage: "assets/bottles/ironworks.png",
      desc: "Step inside Atlantic Canada's very first artisan distillery, founded in 2010 and located in an historic blacksmith shop overlooking Lunenburg's harbour. Come for a tour, stay for a tasting and see how our award-winning spirits are crafted.",
      pois: [
        { name: "The Grand Banker", cat: "food", lat: 44.3760, lng: -64.3150, mapX: 312, mapY: 202, calloutAngle: 145, calloutRadius: 46, approx: true, url: "https://grandbanker.com/" },
        { name: "Lunenburg Walking Tours", cat: "scenic", lat: 44.3770, lng: -64.3170, mapX: 312, mapY: 202, calloutAngle: 250, calloutRadius: 48, approx: true, url: "https://www.lunenburgwalkingtours.com/" },
        { name: "Bluenose II", cat: "scenic", lat: 44.3750, lng: -64.3140, mapX: 312, mapY: 202, calloutAngle: 205, calloutRadius: 66, approx: true, url: "https://bluenose.novascotia.ca/" }
      ]
    },
    {
      num: 7, slug: "compass", name: "Compass Distillers",
      lat: 44.6575, lng: -63.5935,
      address: "2533 Agricola Street, Halifax, NS, B3K 4C4",
      image: "assets/actual-bottles/7.png",
      cardImage: "assets/bottles/compass.png",
      desc: "In Halifax's North End, a state-of-the-art distillery, cocktail bar, and Airbnb. Come meet Tess, our amazing still, and taste world-class spirits.",
      pois: [
        { name: "Fort Needham Memorial Park", cat: "scenic", lat: 44.6620, lng: -63.5980, mapX: 432, mapY: 181, approx: true, url: "https://novascotia.com/listing/fort-needham-memorial-park/" },
        { name: "Compass Tower Airbnb", cat: "stay", lat: 44.6578, lng: -63.5938, mapX: 433, mapY: 182, approx: true, url: "https://www.airbnb.ca/rooms/17407394" }
      ]
    },
    {
      num: 8, slug: "coldstream", name: "Coldstream Clear Distillery",
      lat: 45.3660, lng: -63.2810,
      address: "54 Robie Street, Truro, NS, B2N 1K9",
      image: "assets/actual-bottles/8.png",
      cardImage: "assets/bottles/coldstream.png",
      desc: "Known for approachable, flavour-forward drinks, this family-owned brand offers tasting rooms at four locations with free samples and creative cocktail flights. Peach iced tea is a must-try.",
      pois: [
        { name: "John Crawford Trail (Stewiacke)", cat: "hike", lat: 45.1430, lng: -63.3490, mapX: 473, mapY: 147, approx: true, url: "https://www.stewiacke.net/trails.html" }
      ]
    },
    {
      num: 9, slug: "caldera", name: "Caldera Distilling Inc.",
      lat: 45.7560, lng: -63.0640,
      address: "65 River John Road, River John, NS, B0K 1N0",
      image: "assets/actual-bottles/9.png",
      cardImage: "assets/bottles/caldera.png",
      desc: "Rooted in River John's shipbuilding heritage, this farm-to-bottle producer crafts small-batch rye whisky using grains grown on site. Meet the makers, explore the fields and settle in for a tasting.",
      pois: [
        { name: "Megs Cove Beach Trail", cat: "hike", lat: 45.7800, lng: -63.0500, mapX: 523, mapY: 102, approx: true, url: null }
      ]
    },
    {
      num: 10, slug: "steinhart", name: "Steinhart Distillery",
      lat: 45.7560, lng: -62.1760,
      address: "5963 Highway 245, Arisaig, NS, B2G 2L1",
      image: "assets/actual-bottles/10.png",
      cardImage: "assets/bottles/steinhart.png",
      desc: "Crafted with real ingredients, these spirits reflect European tradition and local flavour. Visit for tastings and tours, or book the Ginstitute experience to create a gin uniquely your own.",
      pois: [
        { name: "Keppoch Mountain Trail System", cat: "hike", lat: 45.5630, lng: -62.0190, mapX: 695, mapY: 118, approx: true, url: "https://www.thekeppoch.ca/" }
      ]
    },
    {
      num: 11, slug: "below-the-salt", name: "Below the Salt Distillery",
      lat: 45.6280, lng: -61.4180,
      address: "13605 Highway 4, Aulds Cove, NS, B0H 1P0",
      image: "assets/actual-bottles/11.png",
      cardImage: "assets/bottles/below-the-salt.png",
      desc: "Tiny in size but big on character, Captain Gregg Distiller and First Mate Vicki serve up world-class spirits. Come for a taste, stay for the view, and leave with stories in a bottle.",
      pois: [
        { name: "GH Smith & Sons General Store", cat: "food", lat: 45.6200, lng: -61.3600, mapX: 805, mapY: 114, approx: true, url: "https://www.facebook.com/p/Smith-G-H-Son-General-Store-100020686196817/" },
        { name: "Port Hawkesbury Community Trails", cat: "hike", lat: 45.6080, lng: -61.3580, mapX: 805, mapY: 115, approx: true, url: "https://novascotia.com/listing/port-hawkesbury-community-trails/" },
        { name: "Canso Causeway", cat: "scenic", lat: 45.6470, lng: -61.4180, mapX: 796, mapY: 112, approx: true, url: null }
      ]
    },
    {
      num: 12, slug: "glenora", name: "Glenora Inn & Distillery",
      lat: 46.1527, lng: -61.3238,
      address: "13727 Route 19, Glenville, NS, B0E 1X0",
      image: "assets/actual-bottles/12.png",
      cardImage: "assets/bottles/glenora.png",
      desc: "Discover North America's first single malt whisky, rooted in Scottish tradition. Tour the site, sample the spirits and experience Cape Breton's rich Gaelic culture and Highland surroundings.",
      pois: [
        { name: "MacKinnons Brook Trail", cat: "hike", lat: 46.1300, lng: -61.4200, mapX: 795, mapY: 78, approx: true, url: null }
      ]
    },
    {
      num: 13, slug: "black-harbour", name: "Black Harbour Distillers",
      lat: 44.6490, lng: -64.0210,
      address: "419 Highway 329, Fox Point, NS, B0J 1T0",
      image: "assets/actual-bottles/13.png",
      cardImage: "assets/bottles/black-harbour.png",
      desc: "Bringing new life to a century-old schoolhouse in Hubbards, this distillery offers tastings, cocktails and lively patio events. Try out their lobster vodka, an unexpected local favourite.",
      pois: [
        { name: "Hubbards Barn Farmers' Market", cat: "food", lat: 44.6360, lng: -64.0640, mapX: 354, mapY: 183, approx: true, url: "https://hubbardsbarn.org/" },
        { name: "Aspotogan Golf Course", cat: "scenic", lat: 44.6050, lng: -64.0290, mapX: 360, mapY: 185, approx: true, url: "https://aspotoganridge.com/" },
        { name: "The Tuna Blue Inn & Restaurant", cat: "stay", lat: 44.6320, lng: -64.0660, mapX: 354, mapY: 183, approx: true, url: "https://www.tunablue.ca/" }
      ]
    },
    {
      num: 14, slug: "north-mountain", name: "North Mountain Distilling",
      lat: 44.7560, lng: -63.8240,
      address: "32 Calypso Way, Hammonds Plains, NS, B4B 2J2",
      image: "assets/actual-bottles/14.png",
      cardImage: "assets/bottles/north-mountain.png",
      desc: "Using traditional methods and modern touches, this family-run operation makes small-batch moonshine and spirits best enjoyed with friends. Swing by the store for a free sample.",
      pois: [
        { name: "Pockwock Falls Trail", cat: "hike", lat: 44.7905, lng: -63.8422, mapX: 391, mapY: 172, calloutAngle: 195, calloutRadius: 60, approx: true, url: null }
      ]
    },
    {
      num: 15, slug: "good-robot", name: "Good Robot Brewing Co.",
      lat: 44.6540, lng: -63.5965,
      address: "2736 Robie Street, Halifax, NS, B3K 4P2",
      image: "assets/actual-bottles/15.png",
      cardImage: "assets/bottles/good-robot.png",
      desc: "This iconic brewery (six-time winner of Best Craft Brewery) put Nova Scotia on the canned cocktail map with standout drinks like their agave-based Lil Devil (Jalapeño-Lime Hard Soda). Start your vacation off right at their Robie Street Pub & Beer Garden.",
      pois: [
        { name: "Chain Yard Cider", cat: "food", lat: 44.6580, lng: -63.5870, mapX: 434, mapY: 182, approx: true, url: "https://www.chainyardcider.com/" },
        { name: "Halifax Common", cat: "scenic", lat: 44.6510, lng: -63.5870, mapX: 434, mapY: 182, approx: true, url: "https://discoverhalifaxns.com/venues/halifax-commons/" },
        { name: "Brewery Park Hotel", cat: "stay", lat: 44.6470, lng: -63.5760, mapX: 436, mapY: 182, approx: true, url: "https://brewerypark.ca/" }
      ]
    },
    {
      num: 16, slug: "raging-crow", name: "Raging Crow Distillery",
      lat: 45.4346, lng: -63.2660,
      address: "592 Highway 311, North River, NS, B6L 6G7",
      image: "assets/actual-bottles/16.png",
      cardImage: "assets/bottles/raging-crow.png",
      desc: "This distillery showcases local ingredients in creative, small-batch spirits. Down-to-earth and proudly inclusive, it's a place to discover new flavours and feel right at home.",
      pois: [
        { name: "The Long Table Social Club", cat: "food", lat: 45.1620, lng: -64.4130, mapX: 295, mapY: 146, approx: true, url: "https://www.thelongtablesocialclub.com/" },
        { name: "Where It's At Tours", cat: "scenic", lat: 45.1640, lng: -64.4150, mapX: 295, mapY: 146, approx: true, url: "https://www.whereitsattours.com/" },
        { name: "Two Planks and a Passion", cat: "scenic", lat: 45.1800, lng: -64.4200, mapX: 294, mapY: 145, approx: true, url: "https://artscentre.ca/two-planks/" }
      ]
    },
    {
      num: 17, slug: "ns-spirit", name: "Nova Scotia Spirit Co.",
      lat: 45.5510, lng: -62.6620,
      address: "230 S Foord Street, Stellarton, NS, B0K 1S0",
      image: "assets/actual-bottles/17.png",
      cardImage: "assets/bottles/ns-spirit.png",
      desc: "Small-town maritime culture shines through every sip, from their line of spirits to their popular Blue Lobster Lemon Lime Vodka Soda. Visit the Blue Lobster Public House for cocktails and local eats.",
      pois: [
        { name: "Albion Trail", cat: "hike", lat: 45.5560, lng: -62.6660, mapX: 587, mapY: 118, approx: true, url: "https://novascotia.com/listing/albion-trail/" }
      ]
    }
  ]
};
