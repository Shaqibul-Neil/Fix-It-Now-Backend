// Service titles grouped by category slug. A technician only ever sells inside
// their own trade, so the catalog is keyed the same way the categories are.

export interface CatalogItem {
  title: string;
  description: string;
  price: number;
  estimatedDuration: number; // minutes
}

export const SERVICE_CATALOG: Record<string, CatalogItem[]> = {
  plumbing: [
    { title: "Pipe leak repair", description: "Locate and seal leaking supply or drain pipes.", price: 800, estimatedDuration: 60 },
    { title: "Basin fitting", description: "Install or replace a wash basin with fittings.", price: 1200, estimatedDuration: 90 },
    { title: "Water tank cleaning", description: "Full drain, scrub and disinfect of a rooftop tank.", price: 1800, estimatedDuration: 120 },
    { title: "Tap replacement", description: "Swap a worn tap or mixer, washer included.", price: 600, estimatedDuration: 30 },
    { title: "Toilet flush repair", description: "Fix or replace a faulty flush mechanism.", price: 900, estimatedDuration: 45 },
    { title: "Drain unclogging", description: "Clear blocked kitchen or bathroom drains.", price: 1000, estimatedDuration: 60 },
  ],
  electrical: [
    { title: "Ceiling fan install", description: "Mount and wire a new ceiling fan with regulator.", price: 700, estimatedDuration: 45 },
    { title: "Wiring fault fix", description: "Trace and repair short circuits or dead lines.", price: 1500, estimatedDuration: 120 },
    { title: "Switchboard rewiring", description: "Rebuild an old switchboard to current safety norms.", price: 2200, estimatedDuration: 150 },
    { title: "Light fixture setup", description: "Install ceiling lights, spot lights or chandeliers.", price: 850, estimatedDuration: 60 },
    { title: "IPS / UPS installation", description: "Wire an IPS line with battery and change-over.", price: 3000, estimatedDuration: 180 },
    { title: "Doorbell & intercom fix", description: "Repair or replace a doorbell or intercom unit.", price: 550, estimatedDuration: 40 },
  ],
  cleaning: [
    { title: "Home deep cleaning", description: "Whole-flat cleaning including kitchen and bathrooms.", price: 2500, estimatedDuration: 180 },
    { title: "Sofa cleaning", description: "Shampoo and vacuum fabric or leather sofas.", price: 900, estimatedDuration: 60 },
    { title: "Kitchen degreasing", description: "Deep clean of chimney, hob and cabinet surfaces.", price: 1400, estimatedDuration: 120 },
    { title: "Bathroom sanitising", description: "Descale tiles, fittings and commode.", price: 1100, estimatedDuration: 90 },
    { title: "Post-renovation cleanup", description: "Remove dust, paint spots and construction debris.", price: 3200, estimatedDuration: 240 },
    { title: "Window & glass cleaning", description: "Inside and reachable outside glass panels.", price: 800, estimatedDuration: 60 },
  ],
  painting: [
    { title: "Single room painting", description: "Two coats of plastic paint for one room.", price: 3500, estimatedDuration: 240 },
    { title: "Full apartment painting", description: "Complete interior repaint with putty and primer.", price: 12000, estimatedDuration: 600 },
    { title: "Exterior wall painting", description: "Weather-coat finish for outside walls.", price: 9000, estimatedDuration: 480 },
    { title: "Wall putty & primer", description: "Surface prep before a finish coat.", price: 2800, estimatedDuration: 180 },
    { title: "Wood polish & varnish", description: "Polish doors, frames and furniture.", price: 2100, estimatedDuration: 150 },
    { title: "Ceiling whitewash", description: "Single-coat ceiling refresh.", price: 1600, estimatedDuration: 120 },
  ],
  "ac-repair": [
    { title: "AC general servicing", description: "Filter, coil and drain cleaning for split AC.", price: 1500, estimatedDuration: 90 },
    { title: "AC gas refill", description: "Leak check plus refrigerant top-up.", price: 3500, estimatedDuration: 120 },
    { title: "Split AC installation", description: "Mount indoor and outdoor units with piping.", price: 4000, estimatedDuration: 180 },
    { title: "AC cooling issue diagnosis", description: "Full inspection with a fault report.", price: 900, estimatedDuration: 60 },
    { title: "AC uninstall & shifting", description: "Safe removal and refit at a new address.", price: 2600, estimatedDuration: 150 },
    { title: "Window AC servicing", description: "Deep clean and tune-up of a window unit.", price: 1200, estimatedDuration: 75 },
  ],
  carpentry: [
    { title: "Door lock repair", description: "Fix jammed locks or fit a new lockset.", price: 750, estimatedDuration: 45 },
    { title: "Furniture assembly", description: "Assemble flat-pack beds, desks or wardrobes.", price: 1300, estimatedDuration: 120 },
    { title: "Cabinet hinge fix", description: "Realign or replace kitchen cabinet hinges.", price: 650, estimatedDuration: 45 },
    { title: "Custom shelf making", description: "Build and mount wall shelves to measure.", price: 2400, estimatedDuration: 180 },
    { title: "Wooden door repair", description: "Repair swollen, cracked or sagging doors.", price: 1700, estimatedDuration: 120 },
    { title: "Bed frame restoration", description: "Tighten, re-glue and refinish a bed frame.", price: 2900, estimatedDuration: 210 },
  ],
  "appliance-repair": [
    { title: "Refrigerator repair", description: "Diagnose cooling, compressor or gas faults.", price: 1900, estimatedDuration: 120 },
    { title: "Washing machine repair", description: "Fix drainage, spin or drum problems.", price: 1700, estimatedDuration: 100 },
    { title: "Microwave oven repair", description: "Replace magnetron, fuse or control panel.", price: 1400, estimatedDuration: 90 },
    { title: "Water purifier servicing", description: "Filter change and full system flush.", price: 1100, estimatedDuration: 60 },
    { title: "Geyser installation", description: "Mount and wire an instant or storage geyser.", price: 2000, estimatedDuration: 120 },
    { title: "Electric oven diagnosis", description: "Inspect heating elements and thermostat.", price: 950, estimatedDuration: 60 },
  ],
};
