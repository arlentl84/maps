# Local Amenities Map Generator

Web application to locate points of interest (POI) around an imported subject site using Google Maps and Google Places. Upload a JSON file to position the reference location, pick relevant business categories, and review interactive results inside a configurable radius.

## 🔑 Configuración de API Keys

### Requisitos previos

Necesitas activar las siguientes APIs en [Google Cloud Console](https://console.cloud.google.com/):

1. **Maps JavaScript API** - Para mostrar el mapa interactivo
2. **Places API** - Para buscar puntos de interés
3. **Geocoding API** - Para convertir direcciones en coordenadas

### Configuración inicial

1. **Copia el archivo de ejemplo:**
   ```bash
   cp config.example.js config.js
   ```

2. **Edita `config.js` con tu API key:**
   ```javascript
   const CONFIG = {
       GOOGLE_MAPS_API_KEY: 'TU_API_KEY_AQUI',
       DEFAULT_ZOOM: 12,
       DEFAULT_RADIUS: 1000
   };
   ```

3. **IMPORTANTE:** El archivo `config.js` está en `.gitignore` y NO debe subirse a Git por seguridad.

### Obtener tu API Key

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea o selecciona un proyecto
3. Ve a **APIs & Services > Credentials**
4. Crea una nueva API key o usa una existente
5. Configura restricciones de seguridad:
   - **Application restrictions:** HTTP referrers
   - **API restrictions:** Restringe a las 3 APIs mencionadas arriba

## Description

The interface currently supports:

- Importing a JSON file with subject site details to place the **Subject Site** automatically
- Reviewing the imported address, province, and city in read-only fields for quick verification
- Selecting one or more POI categories (bank, pharmacy, food and drink, park, liquor stores, grocer, retailers, transit, sport/recreation)
- Adjusting the search radius between 100 m and 50 km
- Rendering results with category icons and an exportable legend
- Inspecting basic POI details such as name and address

Searches run through Google Maps JavaScript API and Google Places API. Map exports are generated as PNG images with html2canvas for easy reporting and sharing.

## Features

- **JSON import workflow**: Upload subject site data to position the map and marker automatically
- **Read-only location fields**: Imported address, province, and city stay locked for auditing
- **Accessible multi-select**: Custom dropdown with multi-selection and select-all support
- **Configurable radius**: Numeric input from 100 to 50,000 meters
- **Category styling**: Custom icons per POI type plus a legend for exports
- **POI info windows**: Marker popups with name and address details
- **PNG export**: Capture the current map view and legend for distribution

### New Rental Comps View (`new-rental-comps.html`)

This auxiliary view lets you upload a JSON array of address entries (either simple strings or objects shaped like `{"No": 1, "Value": "123 Main St, City"}`) and geocode up to 20 of them, placing numbered markers on a hybrid Google Map.

Additional specifics:
- **JSON parsing flexibility**: Accepts an array of strings or objects; falls back to sequential numbering if `No` is absent.
- **Sequential geocoding**: Reduces quota burst failures and surfaces partial errors in a status message.
- **Clear list control**: Hover the addresses panel to reveal a button for clearing uploaded entries and markers.
- **Map PNG export**: Uses `html2canvas` to attempt a direct capture of the rendered map with markers. If browser/Google Maps cross-origin restrictions block tile rendering, it gracefully falls back to a Google Static Maps API URL (note: Static Maps supports only single-character marker labels, so multi-digit numbers are truncated in that fallback image).
- **Hybrid basemap**: Default map type set to `hybrid` for aerial + labels context.

Usage steps (Rental Comps):
1. Click "Choose JSON" and select your address file.
2. Review parsed addresses in the side list.
3. Click "Draw Pins" to geocode and place markers.
4. (Optional) Click on a marker to view its info window.
5. Click "Export Map as PNG".
    - If the live capture succeeds, a PNG downloads immediately.
    - If blocked, a new tab opens with a static map image you can save (labels may be truncated).

Example JSON inputs:
```json
[
   {"No":1, "Value":"100 King St W, Waterloo, ON"},
   {"No":2, "Value":"200 Erb St W, Waterloo, ON"},
   "300 Caroline St N, Waterloo, ON"
]
```
Or simply:
```json
[
   "100 King St W, Waterloo, ON",
   "200 Erb St W, Waterloo, ON"
]
```

## How to Run

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (required for Google Maps API)

### Running the Application

1. **Download or Clone** the repository to your local machine

2. **Open the HTML file** in your web browser:
   - Navigate to the project folder
   - Double-click on `index.html`, or
   - Right-click on `index.html` and select "Open with" → your preferred browser

### Usage Instructions

1. **Import the subject site**:
   - Click *Import Subject Site*
   - Select a JSON file containing `Subject site address`, `Subject site city`, and `Subject site province`
   - The address, province, and city fields will populate and remain read-only

2. **Review the imported data**:
   - Confirm the *Imported Address* matches expectations
   - Verify the locked *Province/State* and *City* values

3. **Configure the POI search**:
   - Update the radius in meters as needed
   - Open *Select POI types* and mark one or more categories (or use *Select all*)

4. **Run the search**:
   - Click *Search Nearby POI*
   - Category markers will appear; select a marker to view name and address

5. **Clear or export**:
   - Use *Clear Results* to remove all POI markers
   - Click *Export Map as PNG* to download the current map view with its legend

## Project Structure

```
report-map-poi/
├── index.html          # Main HTML file
├── README.md          # This file
└── assets/
    ├── css/
    │   └── styles.css # Application styles
    └── js/
        └── app.js     # Main JavaScript application logic
```

## Technical Details

- **Frontend**: Vanilla HTML, CSS, and JavaScript
- **Map Service**: Google Maps JavaScript API
- **Places Service**: Google Places API
- **Export**: html2canvas to create PNG files
- **Default Location**: Waterloo, Ontario, Canada
- **Supported POI Types**: 9 categorías con iconografía personalizada

### Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
