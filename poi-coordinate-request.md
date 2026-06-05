# CDANS Map POI Coordinate Request

We need illustrated map coordinates for the nearby stop icons.

The distillery bottle/star locations already have map coordinates. The nearby stops below currently use approximate real-world latitude/longitude plus a temporary visual fan layout, which is why some icons can land in the ocean. Please provide `mapX` and `mapY` for each stop.

## Coordinate Format

- Use pixel coordinates on the current illustrated map.
- Map file: `assets/map-base.svg`
- Natural map size: `825 x 311`
- Origin: top-left corner of the map.
- `mapX`: increases left to right.
- `mapY`: increases top to bottom.
- Whole numbers are best.
- Place the coordinate at the center of the nearby-stop icon, preferably on land or near the relevant road/town.

Example:

```txt
Dennis Point Cafe: mapX=72, mapY=258
```

If you also know that any current latitude/longitude is wrong, please include corrected `lat` and `lng`, but the main thing needed for the visual map is `mapX` and `mapY`.

## Stops Needing Map Coordinates

| Distillery # | Distillery | Nearby stop | Category | Current approx lat | Current approx lng | mapX | mapY | Notes |
|---:|---|---|---|---:|---:|---:|---:|---|
| 1 | Boatskeg Distilling Co. | Dennis Point Cafe | Food | 43.5940 | -65.7560 |  |  |  |
| 1 | Boatskeg Distilling Co. | West Pubnico Golf Course | Sightseeing | 43.6260 | -65.7430 |  |  |  |
| 1 | Boatskeg Distilling Co. | Red Cap Restaurant & Motel | Stay | 43.6300 | -65.7560 |  |  |  |
| 2 | Still Fired Distilleries | Whiskey Teller (next to Fortview Golf) | Food | 44.7480 | -65.5200 |  |  |  |
| 2 | Still Fired Distilleries | Mickey Hill Provincial Park Trail | Trail | 44.6900 | -65.2000 |  |  |  |
| 2 | Still Fired Distilleries | Fort Anne National Historic Site | Sightseeing | 44.7420 | -65.5180 |  |  |  |
| 3 | Barrelling Tide Distillery | Fox Hill Cheese House | Food | 45.1030 | -64.4170 |  |  |  |
| 3 | Barrelling Tide Distillery | Blomidon Provincial Park | Trail | 45.2580 | -64.3490 |  |  |  |
| 3 | Barrelling Tide Distillery | Old Orchard Inn / Terroir Restaurant | Stay | 45.0930 | -64.3270 |  |  |  |
| 4 | James Roue Beverage Co. | Walkers Restaurant | Food | 44.9880 | -64.1360 |  |  |  |
| 4 | James Roue Beverage Co. | Clifton Museum Park Circular | Sightseeing | 44.9930 | -64.1450 |  |  |  |
| 4 | James Roue Beverage Co. | Birthplace of Hockey Museum | Sightseeing | 44.9870 | -64.1390 |  |  |  |
| 5 | Cherry Tree Distillery | Gerrish & Gray Cafe | Food | 44.9900 | -64.1390 |  |  |  |
| 5 | Cherry Tree Distillery | Lake Pisiquid Loop | Trail | 44.9820 | -64.1310 |  |  |  |
| 5 | Cherry Tree Distillery | Geldert Guest House B&B | Stay | 44.9950 | -64.1420 |  |  |  |
| 6 | Ironworks Distillery | The Grand Banker | Food | 44.3760 | -64.3150 |  |  |  |
| 6 | Ironworks Distillery | Lunenburg Walking Tours | Sightseeing | 44.3770 | -64.3170 |  |  |  |
| 6 | Ironworks Distillery | Bluenose II | Sightseeing | 44.3750 | -64.3140 |  |  |  |
| 7 | Compass Distillers | Fort Needham Memorial Park | Sightseeing | 44.6620 | -63.5980 |  |  |  |
| 7 | Compass Distillers | Compass Tower Airbnb | Stay | 44.6578 | -63.5938 |  |  |  |
| 8 | Coldstream Clear Distillery | John Crawford Trail (Stewiacke) | Trail | 45.1430 | -63.3490 |  |  |  |
| 9 | Caldera Distilling Inc. | Megs Cove Beach Trail | Trail | 45.7800 | -63.0500 |  |  |  |
| 10 | Steinhart Distillery | Keppoch Mountain Trail System | Trail | 45.5630 | -62.0190 |  |  |  |
| 11 | Below the Salt Distillery | GH Smith & Sons General Store | Food | 45.6200 | -61.3600 |  |  |  |
| 11 | Below the Salt Distillery | Port Hawkesbury Community Trails | Trail | 45.6080 | -61.3580 |  |  |  |
| 11 | Below the Salt Distillery | Canso Causeway | Sightseeing | 45.6470 | -61.4180 |  |  |  |
| 12 | Glenora Inn & Distillery | MacKinnons Brook Trail | Trail | 46.1300 | -61.4200 |  |  |  |
| 13 | Black Harbour Distillers | Hubbards Barn Farmers' Market | Food | 44.6360 | -64.0640 |  |  |  |
| 13 | Black Harbour Distillers | Aspotogan Golf Course | Sightseeing | 44.6050 | -64.0290 |  |  |  |
| 13 | Black Harbour Distillers | The Tuna Blue Inn & Restaurant | Stay | 44.6320 | -64.0660 |  |  |  |
| 14 | North Mountain Distilling | Pockwock Falls Trail | Trail | 44.8000 | -63.8600 |  |  |  |
| 15 | Good Robot Brewing Co. | Chain Yard Cider | Food | 44.6580 | -63.5870 |  |  |  |
| 15 | Good Robot Brewing Co. | Halifax Common | Sightseeing | 44.6510 | -63.5870 |  |  |  |
| 15 | Good Robot Brewing Co. | Brewery Park Hotel | Stay | 44.6470 | -63.5760 |  |  |  |
| 16 | Raging Crow Distillery | The Long Table Social Club | Food | 45.1620 | -64.4130 |  |  |  |
| 16 | Raging Crow Distillery | Where It's At Tours | Sightseeing | 45.1640 | -64.4150 |  |  |  |
| 16 | Raging Crow Distillery | Two Planks and a Passion | Sightseeing | 45.1800 | -64.4200 |  |  |  |
| 17 | Nova Scotia Spirit Co. | Albion Trail | Trail | 45.5560 | -62.6660 |  |  |  |

## Optional Review Items

These are not required for icon placement, but helpful if anyone is checking the data:

- Confirm any approximate latitude/longitude values that are noticeably wrong.
- Confirm whether stops with no public URL should stay as-is or be replaced.
- Confirm if any category should change: `Trail`, `Stay`, `Sightseeing`, or `Food`.

