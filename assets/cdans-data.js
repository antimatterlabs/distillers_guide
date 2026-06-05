/* =============================================================================
 * CDANS Distillery Guide — Data
 * -----------------------------------------------------------------------------
 * Edit mode can export this full file. Replace assets/cdans-data.js with the
 * copied output so illustrated-map pixel positions stay in sync.
 * ========================================================================== */

window.CDANS_DATA = {
  brand: {
    ocean: "#005166",
    land: "#cdc5b6",
    star: "#b8893f",
    ink: "#1c2b30"
  },

  /* Flat brand basemap (NS silhouette, stars stripped) + natural size. */
  basemap: {
    url: "assets/map-base.svg",
    w: 825,
    h: 311,
    decorations: {
      url: "assets/map-background-icons.svg",
      scale: 1,
      offsetX: 22,
      offsetY: 0,
      opacity: 0.95
    }
  },

  /* slug -> [px, py] pixel position on the basemap (top-left origin) */
  pixels: {
    "boatskeg": [105, 261],
    "still-fired": [143, 150],
    "barrelling-tide": [277, 125],
    "james-roue": [323, 149],
    "cherry-tree": [300, 146],
    "ironworks": [260, 222],
    "compass": [339, 213],
    "coldstream": [391, 131],
    "caldera": [444, 95],
    "steinhart": [513, 132],
    "below-the-salt": [578, 160],
    "glenora": [624, 99],
    "black-harbour": [289, 195],
    "north-mountain": [310, 187],
    "good-robot": [322, 222],
    "raging-crow": [252, 119],
    "ns-spirit": [461, 125]
  },

  /* Distillery nums in driving-tour order. */
  tourOrder: [1, 2, 16, 3, 5, 4, 6, 13, 14, 15, 7, 8, 9, 17, 10, 11, 12],

  distilleries: [
    {
      num: 1, slug: "boatskeg", name: "Boatskeg Distilling Co.",
      lat: 43.639257, lng: -65.800872,
      address: "23 Chemin du Pont du Marais, Lower West Pubnico, NS, B0W 2C0",
      image: "assets/actual-bottles/1.png",
      cardImage: "assets/bottles/boatskeg.png",
      desc: "Just steps from the ocean in West Pubnico, enjoy a locally crafted drink at this boat shop-turned-cocktail bar and patio. The salted caramel vodka is a can't-miss specialty.",
      pois: [
        { name: "Dennis Point Café", cat: "food", lat: 43.617881, lng: -65.788971, mapX: 100, mapY: 281, approx: true, url: "https://www.facebook.com/DennisPointCafe/?locale=fr_FR" },
        { name: "West Pubnico Golf Course", cat: "scenic", lat: 43.626, lng: -65.743, mapX: 89, mapY: 245, approx: true, url: "https://www.westpubnicogolf.com/" },
        { name: "Red Cap Restaurant & Motel", cat: "stay", lat: 43.63, lng: -65.756, mapX: 88, mapY: 262, approx: true, url: "https://redcaprestaurantandmotel.com/" }
      ]
    },
    {
      num: 2, slug: "still-fired", name: "Still Fired Distilleries",
      lat: 44.743, lng: -65.513,
      address: "9548 Nova Scotia Trunk 8, Annapolis Royal, NS, B0S 1A0",
      image: "assets/actual-bottles/2.png",
      cardImage: "assets/bottles/still-fired.png",
      desc: "Crafting small-batch spirits from Nova Scotia's first legally built stills, this Annapolis Royal team creates unique blends with local ingredients. Come in for a free sample and leave with a bottle.",
      pois: [
        { name: "Whiskey Teller (next to Fortview Golf)", cat: "food", lat: 44.74534, lng: -65.518727, mapX: 163, mapY: 144, approx: true, url: null },
        { name: "Mickey Hill Provincial Park Trail", cat: "hike", lat: 44.6222, lng: -65.3621, mapX: 147, mapY: 183, approx: true, url: "https://novascotia.com/listing/mickey-hill-provincial-park/" },
        { name: "Fort Anne National Historic Site", cat: "scenic", lat: 44.741395, lng: -65.518791, mapX: 124, mapY: 159, approx: true, url: "https://novascotia.com/listing/fort-anne-national-historic-site/" }
      ]
    },
    {
      num: 3, slug: "barrelling-tide", name: "Barrelling Tide Distillery",
      lat: 45.097746, lng: -64.404153,
      address: "1164 Parkway Drive, Port Williams, NS, B0P 1T0",
      image: "assets/actual-bottles/3.png",
      cardImage: "assets/bottles/barrelling-tide.png",
      desc: "Award-winning small-batch spirits and liqueurs crafted with local ingredients and thoughtful craftsmanship — where every tide has a story. Book a tour, enjoy a complimentary tasting, or try a cocktail flight!",
      pois: [
        { name: "Fox Hill Cheese House", cat: "food", lat: 45.103, lng: -64.417, mapX: 291, mapY: 125, approx: true, url: "https://www.foxhillcheesehouse.com/" },
        { name: "Blomidon Provincial Park", cat: "hike", lat: 45.28406, lng: -64.33416, mapX: 296, mapY: 112, approx: true, url: "https://parks.novascotia.ca/park/blomidon" },
        { name: "Old Orchard Inn | Terroir Restaurant", cat: "stay", lat: 45.07397, lng: -64.402399, mapX: 284, mapY: 135, approx: true, url: "https://oldorchardinn.com/" }
      ]
    },
    {
      num: 4, slug: "james-roue", name: "James Roué Beverage Co.",
      lat: 44.993428, lng: -64.140293,
      address: "201 Water Street, Windsor, NS, B0N 2T0",
      image: "assets/actual-bottles/4.png",
      cardImage: "assets/bottles/james-roue.png",
      desc: "Blending tradition with innovation, Atlantic Canada's largest craft rum distillery delivers complex, layered flavours. Stop in for a tasting and discover their flagship Rum-Nova.",
      pois: [
        { name: "Walkers Restaurant", cat: "food", lat: 44.988, lng: -64.136, mapX: 324, mapY: 158, approx: true, url: "https://www.walkersrestaurant.ca/" },
        { name: "Clifton Museum Park Circular", cat: "scenic", lat: 44.988311, lng: -64.141849, mapX: 333, mapY: 156, approx: true, url: "https://clifton.novascotia.ca/" },
        { name: "Birthplace of Hockey Museum", cat: "scenic", lat: 44.988867, lng: -64.142448, mapX: 316, mapY: 156, approx: true, url: "https://birthplaceofhockey.ca/" }
      ]
    },
    {
      num: 5, slug: "cherry-tree", name: "Cherry Tree Distillery",
      lat: 44.994004, lng: -64.136016,
      address: "163 Gerrish Street, Windsor, NS, B0N 2T0",
      image: "assets/actual-bottles/5.png",
      cardImage: "assets/bottles/cherry-tree.png",
      desc: "With a vintage speakeasy vibe, this micro distillery and intimate tasting bar in Windsor features a variety of spirits and mixers. Try mini cocktail flights and enjoy a relaxed, jazz-filled atmosphere.",
      pois: [
        { name: "Gerrish & Gray Café", cat: "food", lat: 44.99, lng: -64.139, mapX: 302, mapY: 155, approx: true, url: "https://www.gerrishandgray.ca/" },
        { name: "Lake Pisiquid Loop", cat: "hike", lat: 44.994524, lng: -64.143993, mapX: 285, mapY: 141, approx: true, url: null },
        { name: "Geldert Guest House B&B", cat: "stay", lat: 44.995, lng: -64.142, mapX: 289, mapY: 152, approx: true, url: "https://geldertguesthouse.com/" }
      ]
    },
    {
      num: 6, slug: "ironworks", name: "Ironworks Distillery",
      lat: 44.376117, lng: -64.305738,
      address: "2 Kempt Street, Lunenburg, NS, B0J 2C0",
      image: "assets/actual-bottles/6.png",
      cardImage: "assets/bottles/ironworks.png",
      desc: "Step inside Atlantic Canada's very first artisan distillery, founded in 2010 and located in an historic blacksmith shop overlooking Lunenburg's harbour. Come for a tour, stay for a tasting and see how our award-winning spirits are crafted.",
      pois: [
        { name: "The Grand Banker", cat: "food", lat: 44.376, lng: -64.315, mapX: 249, mapY: 221, approx: true, url: "https://grandbanker.com/" },
        { name: "Lunenburg Walking Tours", cat: "scenic", lat: 44.380098, lng: -64.313498, mapX: 264, mapY: 230, approx: true, url: "https://www.lunenburgwalkingtours.com/" },
        { name: "Bluenose II", cat: "scenic", lat: 44.375, lng: -64.314, mapX: 254, mapY: 231, approx: true, url: "https://bluenose.novascotia.ca/" }
      ]
    },
    {
      num: 7, slug: "compass", name: "Compass Distillers",
      lat: 44.654755, lng: -63.592316,
      address: "2533 Agricola Street, Halifax, NS, B3K 4C4",
      image: "assets/actual-bottles/7.png",
      cardImage: "assets/bottles/compass.png",
      desc: "In Halifax's North End, a state-of-the-art distillery, cocktail bar, and Airbnb. Come meet Tess, our amazing still, and taste world-class spirits.",
      pois: [
        { name: "Fort Needham Memorial Park", cat: "scenic", lat: 44.664833, lng: -63.600625, mapX: 349, mapY: 208, approx: true, url: "https://novascotia.com/listing/fort-needham-memorial-park/" },
        { name: "Compass Tower Airbnb", cat: "stay", lat: 44.654755, lng: -63.592316, mapX: 350, mapY: 198, approx: true, url: "https://www.airbnb.ca/rooms/17407394" }
      ]
    },
    {
      num: 8, slug: "coldstream", name: "Coldstream Clear Distillery",
      lat: 45.367625, lng: -63.315391,
      address: "54 Robie Street, Truro, NS, B2N 1K9",
      image: "assets/actual-bottles/8.png",
      cardImage: "assets/bottles/coldstream.png",
      desc: "Known for approachable, flavour-forward drinks, this family-owned brand offers tasting rooms at four locations with free samples and creative cocktail flights. Peach iced tea is a must-try.",
      pois: [
        { name: "John Crawford Trail (Stewiacke)", cat: "hike", lat: 45.143, lng: -63.349, mapX: 392, mapY: 162, approx: true, url: "https://www.stewiacke.net/trails.html" }
      ]
    },
    {
      num: 9, slug: "caldera", name: "Caldera Distilling Inc.",
      lat: 45.761532, lng: -63.041539,
      address: "65 River John Road, River John, NS, B0K 1N0",
      image: "assets/actual-bottles/9.png",
      cardImage: "assets/bottles/caldera.png",
      desc: "Rooted in River John's shipbuilding heritage, this farm-to-bottle producer crafts small-batch rye whisky using grains grown on site. Meet the makers, explore the fields and settle in for a tasting.",
      pois: [
        { name: "Megs Cove Beach Trail", cat: "hike", lat: 45.78, lng: -63.05, mapX: 432, mapY: 108, approx: true, url: null }
      ]
    },
    {
      num: 10, slug: "steinhart", name: "Steinhart Distillery",
      lat: 45.749004, lng: -62.17977,
      address: "5963 Highway 245, Arisaig, NS, B2G 2L1",
      image: "assets/actual-bottles/10.png",
      cardImage: "assets/bottles/steinhart.png",
      desc: "Crafted with real ingredients, these spirits reflect European tradition and local flavour. Visit for tastings and tours, or book the Ginstitute experience to create a gin uniquely your own.",
      pois: [
        { name: "Keppoch Mountain Trail System", cat: "hike", lat: 45.499128, lng: -62.122193, mapX: 512, mapY: 153, approx: true, url: "https://www.thekeppoch.ca/" }
      ]
    },
    {
      num: 11, slug: "below-the-salt", name: "Below the Salt Distillery",
      lat: 45.67457, lng: -61.469548,
      address: "13605 Highway 4, Aulds Cove, NS, B0H 1P0",
      image: "assets/actual-bottles/11.png",
      cardImage: "assets/bottles/below-the-salt.png",
      desc: "Tiny in size but big on character, Captain Gregg Distiller and First Mate Vicki serve up world-class spirits. Come for a taste, stay for the view, and leave with stories in a bottle.",
      pois: [
        { name: "GH Smith & Sons General Store", cat: "food", lat: 45.62, lng: -61.36, mapX: 608, mapY: 153, approx: true, url: "https://www.facebook.com/p/Smith-G-H-Son-General-Store-100020686196817/" },
        { name: "Port Hawkesbury Community Trails", cat: "hike", lat: 45.618085, lng: -61.357459, mapX: 591, mapY: 165, approx: true, url: "https://novascotia.com/listing/port-hawkesbury-community-trails/" },
        { name: "Canso Causeway", cat: "scenic", lat: 45.647395, lng: -61.412923, mapX: 580, mapY: 169, approx: true, url: null }
      ]
    },
    {
      num: 12, slug: "glenora", name: "Glenora Inn & Distillery",
      lat: 46.152707, lng: -61.322469,
      address: "13727 Route 19, Glenville, NS, B0E 1X0",
      image: "assets/actual-bottles/12.png",
      cardImage: "assets/bottles/glenora.png",
      desc: "Discover North America's first single malt whisky, rooted in Scottish tradition. Tour the site, sample the spirits and experience Cape Breton's rich Gaelic culture and Highland surroundings.",
      pois: [
        { name: "MacKinnons Brook Trail", cat: "hike", lat: 46.13, lng: -61.42, mapX: 684, mapY: 50, approx: true, url: null }
      ]
    },
    {
      num: 13, slug: "black-harbour", name: "Black Harbour Distillers",
      lat: 44.62059, lng: -64.059093,
      address: "419 Highway 329, Fox Point, NS, B0J 1T0",
      image: "assets/actual-bottles/13.png",
      cardImage: "assets/bottles/black-harbour.png",
      desc: "Bringing new life to a century-old schoolhouse in Hubbards, this distillery offers tastings, cocktails and lively patio events. Try out their lobster vodka, an unexpected local favourite.",
      pois: [
        { name: "Hubbards Barn Farmers' Market", cat: "food", lat: 44.636027, lng: -64.068789, mapX: 298, mapY: 189, approx: true, url: "https://hubbardsbarn.org/" },
        { name: "Aspotogan Golf Course", cat: "scenic", lat: 44.592452, lng: -64.084685, mapX: 280, mapY: 200, approx: true, url: "https://aspotoganridge.com/" },
        { name: "The Tuna Blue Inn & Restaurant", cat: "stay", lat: 44.632, lng: -64.066, mapX: 297, mapY: 201, approx: true, url: "https://www.tunablue.ca/" }
      ]
    },
    {
      num: 14, slug: "north-mountain", name: "North Mountain Distilling",
      lat: 44.738944, lng: -63.799864,
      address: "32 Calypso Way, Hammonds Plains, NS, B4B 2J2",
      image: "assets/actual-bottles/14.png",
      cardImage: "assets/bottles/north-mountain.png",
      desc: "Using traditional methods and modern touches, this family-run operation makes small-batch moonshine and spirits best enjoyed with friends. Swing by the store for a free sample.",
      pois: [
        { name: "Pockwock Falls Trail", cat: "hike", lat: 44.7905, lng: -63.8422, mapX: 299, mapY: 178, approx: true, url: null }
      ]
    },
    {
      num: 15, slug: "good-robot", name: "Good Robot Brewing Co.",
      lat: 44.656539, lng: -63.597847,
      address: "2736 Robie Street, Halifax, NS, B3K 4P2",
      image: "assets/actual-bottles/15.png",
      cardImage: "assets/bottles/good-robot.png",
      desc: "This iconic brewery (six-time winner of Best Craft Brewery) put Nova Scotia on the canned cocktail map with standout drinks like their agave-based Lil Devil (Jalapeño-Lime Hard Soda). Start your vacation off right at their Robie Street Pub & Beer Garden.",
      pois: [
        { name: "Chain Yard Cider", cat: "food", lat: 44.655451, lng: -63.593937, mapX: 311, mapY: 214, approx: true, url: "https://www.chainyardcider.com/" },
        { name: "Halifax Common", cat: "scenic", lat: 44.649293, lng: -63.589097, mapX: 318, mapY: 231, approx: true, url: "https://discoverhalifaxns.com/venues/halifax-commons/" },
        { name: "Brewery Park Hotel", cat: "stay", lat: 44.659013, lng: -63.598441, mapX: 333, mapY: 226, approx: true, url: "https://brewerypark.ca/" }
      ]
    },
    {
      num: 16, slug: "raging-crow", name: "Raging Crow Distillery",
      lat: 45.162, lng: -64.413,
      address: "969 Seminary Avenue, Canning, NS, B0P 1H0",
      image: "assets/actual-bottles/16.png",
      cardImage: "assets/bottles/raging-crow.png",
      desc: "This distillery showcases local ingredients in creative, small-batch spirits. Down-to-earth and proudly inclusive, it's a place to discover new flavours and feel right at home.",
      pois: [
        { name: "The Long Table Social Club", cat: "food", lat: 45.162, lng: -64.413, mapX: 263, mapY: 130, approx: true, url: "https://www.thelongtablesocialclub.com/" },
        { name: "Where It's At Tours", cat: "scenic", lat: 45.164, lng: -64.415, mapX: 249, mapY: 134, approx: true, mapQuery: "Wolfville, Nova Scotia", url: "https://www.whereitsattours.com/" },
        { name: "Two Planks and a Passion", cat: "scenic", lat: 45.18, lng: -64.42, mapX: 235, mapY: 128, approx: true, url: "https://artscentre.ca/two-planks/" }
      ]
    },
    {
      num: 17, slug: "ns-spirit", name: "Nova Scotia Spirit Co.",
      lat: 45.552876, lng: -62.662068,
      address: "230 S Foord Street, Stellarton, NS, B0K 1S0",
      image: "assets/actual-bottles/17.png",
      cardImage: "assets/bottles/ns-spirit.png",
      desc: "Small-town maritime culture shines through every sip, from their line of spirits to their popular Blue Lobster Lemon Lime Vodka Soda. Visit the Blue Lobster Public House for cocktails and local eats.",
      pois: [
        { name: "Albion Trail", cat: "hike", lat: 45.566851, lng: -62.656847, mapX: 461, mapY: 135, approx: true, url: "https://novascotia.com/listing/albion-trail/" }
      ]
    }
  ]
};
