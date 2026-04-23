import mongoose from 'mongoose'
import dotenv from 'dotenv'
import colors from 'colors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import User from './models/userModel.js'
import Product from './models/productModel.js'
import connectDB from './config/db.js'

dotenv.config()
connectDB()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const imgs = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'unsplashImages.json'), 'utf8')
)

const sized = (url) => `${url}?w=800&h=640&fit=crop&q=80&auto=format`

const catalog = [
  {
    category: 'Phones',
    imgKey: 'smartphone',
    items: [
      ['iPhone 15 Pro Max 256GB', 'Apple', 1199, 14, 'Titanium frame, A17 Pro chip, 5x optical zoom, USB-C with ProRes video over Thunderbolt.'],
      ['Samsung Galaxy S24 Ultra', 'Samsung', 1299, 11, '6.8\" QHD+ Dynamic AMOLED 2X, 200MP main camera, S Pen, Galaxy AI features built in.'],
      ['Google Pixel 8 Pro', 'Google', 999, 18, 'Tensor G3 SoC, 50MP triple camera, Magic Editor, 7 years of OS updates.'],
      ['OnePlus 12 5G', 'OnePlus', 799, 22, 'Snapdragon 8 Gen 3, Hasselblad camera system, 100W SUPERVOOC charging.'],
      ['Xiaomi 14 Ultra', 'Xiaomi', 1099, 9, 'Leica Vario-Summilux quad camera, variable aperture, ceramic body.'],
      ['Nothing Phone (2)', 'Nothing', 599, 25, 'Glyph Interface, Snapdragon 8+ Gen 1, 12GB RAM, transparent design.'],
      ['Sony Xperia 1 V', 'Sony', 1399, 6, '4K 120Hz OLED display, Exmor T mobile sensor, real-time Eye AF.'],
      ['Asus ROG Phone 8 Pro', 'Asus', 1199, 12, 'Snapdragon 8 Gen 3, 165Hz display, AeroActive Cooler, gaming triggers.'],
      ['Motorola Edge 50 Ultra', 'Motorola', 899, 16, 'Curved pOLED 144Hz, 50MP triple camera, 125W TurboPower charging.'],
      ['Honor Magic 6 Pro', 'Honor', 1199, 8, 'AI Privacy Protection, 180MP periscope, Falcon Camera System.'],
    ],
  },
  {
    category: 'Laptops',
    imgKey: 'laptop',
    items: [
      ['MacBook Pro 16" M3 Max', 'Apple', 3499, 7, 'M3 Max with 16-core CPU, 40-core GPU, 36GB unified memory, Liquid Retina XDR.'],
      ['Dell XPS 15 (9530)', 'Dell', 2299, 12, '15.6" OLED 3.5K, Intel Core i9-13900H, NVIDIA RTX 4070, InfinityEdge display.'],
      ['Lenovo ThinkPad X1 Carbon Gen 12', 'Lenovo', 1899, 15, '14" 2.8K OLED, Core Ultra 7 165U, Intel vPro, MIL-SPEC tested.'],
      ['HP Spectre x360 14', 'HP', 1699, 10, '2-in-1 convertible, OLED touch, Core Ultra 7, 360-degree hinge.'],
      ['Asus ROG Zephyrus G14 (2024)', 'Asus', 2199, 9, 'Ryzen 9 8945HS, RTX 4070, 14" OLED 120Hz, AniMe Matrix lid.'],
      ['Razer Blade 16', 'Razer', 3299, 5, 'Dual-mode mini-LED display, Intel i9-14900HX, RTX 4090, CNC aluminum.'],
      ['MSI Stealth 14 Studio', 'MSI', 1999, 11, 'OLED 2.8K 120Hz, Intel Core i7-13700H, RTX 4060, 1.7kg ultra-thin.'],
      ['Microsoft Surface Laptop Studio 2', 'Microsoft', 2399, 8, 'Dynamic Woven Hinge, Intel Core i7, NVIDIA RTX 4060, Surface Slim Pen 2.'],
      ['Acer Swift Edge 16', 'Acer', 1299, 14, 'AMD Ryzen 7 7840U, 16" 3.2K OLED 120Hz, magnesium-aluminum chassis.'],
      ['LG Gram 17 (2024)', 'LG', 1499, 13, '17" WQXGA IPS, Core Ultra 7, 1199g lightweight, 19.5h battery.'],
    ],
  },
  {
    category: 'Audio',
    imgKey: 'headphones',
    items: [
      ['Sony WH-1000XM5', 'Sony', 399, 30, 'Industry-leading noise cancellation, Auto NC Optimizer, 30h battery.'],
      ['Bose QuietComfort Ultra', 'Bose', 429, 22, 'Immersive Audio, CustomTune sound calibration, world-class quiet.'],
      ['Apple AirPods Pro (2nd gen, USB-C)', 'Apple', 249, 50, 'Adaptive Audio, Personalized Volume, MagSafe USB-C charging case.'],
      ['Sennheiser Momentum 4 Wireless', 'Sennheiser', 379, 18, '60h battery, adaptive noise cancellation, premium 42mm transducers.'],
      ['Beats Studio Pro', 'Beats', 349, 25, 'Personalized Spatial Audio, Apple H1-style chip, USB-C lossless.'],
      ['Jabra Elite 10', 'Jabra', 249, 35, 'Dolby Atmos with Dolby Head Tracking, comfort design, 6-mic call tech.'],
      ['Sony LinkBuds S', 'Sony', 199, 40, 'Adaptive Sound Control, integrated processor V1, hi-res LDAC audio.'],
      ['Marshall Major V', 'Marshall', 169, 27, '100+ hours playtime, wireless charging, classic Marshall design.'],
      ['Audio-Technica ATH-M50xBT2', 'Audio-Technica', 199, 19, 'Studio reference quality, 50h Bluetooth battery, multi-point pairing.'],
      ['JBL Tour Pro 2', 'JBL', 249, 33, 'Smart Charging Case touchscreen, True Adaptive ANC, Spatial Sound.'],
    ],
  },
  {
    category: 'Cameras',
    imgKey: 'camera',
    items: [
      ['Canon EOS R5', 'Canon', 3899, 5, '45MP full-frame mirrorless, 8K RAW video, in-body image stabilization.'],
      ['Sony Alpha 7 IV', 'Sony', 2499, 8, '33MP full-frame, 4K 60p, AI-based subject detection autofocus.'],
      ['Nikon Z8', 'Nikon', 3999, 4, '45.7MP stacked CMOS, 8.3K RAW, 120fps burst, fully electronic shutter.'],
      ['Fujifilm X-T5', 'Fujifilm', 1699, 12, '40.2MP X-Trans 5 HR, 6.2K video, classic dial-driven shooting.'],
      ['Panasonic Lumix S5 II', 'Panasonic', 1999, 9, '24.2MP full-frame, hybrid AF with phase detection, 6K open gate video.'],
      ['Leica Q3', 'Leica', 5995, 3, '60.3MP full-frame, fixed Summilux 28mm f/1.7 ASPH, 8K video.'],
      ['Sony ZV-E10 Vlog Camera', 'Sony', 698, 20, 'APS-C interchangeable lens, side flip screen, Product Showcase mode.'],
      ['GoPro HERO12 Black', 'GoPro', 399, 35, '5.3K60 video, HDR, HyperSmooth 6.0, 10-bit color, AirPods support.'],
      ['Insta360 X3 360 Camera', 'Insta360', 449, 25, '5.7K 360 video, 72MP photos, 2.29" touchscreen, Active HDR.'],
      ['DJI Pocket 3 Creator Combo', 'DJI', 799, 14, '1-inch CMOS, 4K/120fps, 3-axis stabilization, ActiveTrack 6.0.'],
    ],
  },
  {
    category: 'Gaming',
    imgKey: 'gaming-console',
    items: [
      ['PlayStation 5 Slim Disc Edition', 'Sony', 499, 18, 'Custom AMD Zen 2, 825GB SSD, 4K UHD Blu-ray, DualSense controller included.'],
      ['Xbox Series X 1TB', 'Microsoft', 499, 22, '12 TFLOPS GPU, 4K @ 60-120fps, Quick Resume, Smart Delivery.'],
      ['Nintendo Switch OLED Model', 'Nintendo', 349, 40, '7" OLED screen, enhanced audio, 64GB internal storage, dock with LAN.'],
      ['Steam Deck OLED 1TB', 'Valve', 649, 12, '7.4" HDR OLED, AMD APU 6nm, 90Hz, 1TB NVMe SSD, Wi-Fi 6E.'],
      ['Asus ROG Ally Z1 Extreme', 'Asus', 699, 10, '7" 120Hz FHD, Ryzen Z1 Extreme, AMD Radeon RDNA 3, Windows 11.'],
      ['Logitech G Pro X Superlight 2', 'Logitech', 159, 45, '60g ultra-light, HERO 2 sensor, LIGHTSPEED wireless, 95h battery.'],
      ['Razer DeathAdder V3 Pro', 'Razer', 149, 38, '63g, Focus Pro 30K Optical Sensor, HyperSpeed wireless, 90h battery.'],
      ['SteelSeries Arctis Nova Pro Wireless', 'SteelSeries', 349, 16, 'Hi-Res certified, Hot-swappable battery, dual wireless 2.4GHz + BT.'],
      ['Elgato Stream Deck MK.2', 'Elgato', 149, 28, '15 customizable LCD keys, removable USB-C, magnetic stand.'],
      ['NVIDIA GeForce RTX 4090 Founders', 'NVIDIA', 1599, 4, '24GB GDDR6X, Ada Lovelace, DLSS 3, ray tracing flagship.'],
    ],
  },
  {
    category: 'Wearables',
    imgKey: 'smartwatch',
    items: [
      ['Apple Watch Series 9 GPS 45mm', 'Apple', 429, 32, 'S9 SiP, Double Tap gesture, brightest Apple display, on-device Siri.'],
      ['Samsung Galaxy Watch 6 Classic 47mm', 'Samsung', 429, 19, 'Rotating bezel, sapphire crystal, advanced sleep coaching.'],
      ['Garmin Fenix 7 Sapphire Solar', 'Garmin', 899, 11, 'Solar charging, multi-band GNSS, 1.3" sapphire display, 22-day battery.'],
      ['Fitbit Charge 6', 'Fitbit', 159, 50, 'Google Maps, YouTube Music control, ECG + EDA stress sensor.'],
      ['Oura Ring Generation 3 Heritage', 'Oura', 299, 22, 'Sleep, readiness, activity tracking, 7-day battery, titanium.'],
      ['WHOOP 4.0 with 12 Month Membership', 'WHOOP', 239, 30, 'Continuous strain, recovery, sleep coaching, no screen design.'],
      ['Polar Vantage V3', 'Polar', 599, 14, 'AMOLED, ECG, dual-frequency GPS, training load Pro.'],
      ['Coros Apex 2 Pro', 'Coros', 449, 17, 'Sapphire glass, 75-day battery, dual-frequency GNSS, offline maps.'],
      ['Withings ScanWatch 2', 'Withings', 349, 21, 'Hybrid analog smartwatch, 24/7 temp tracking, ECG, 30-day battery.'],
      ['Amazfit T-Rex Ultra', 'Amazfit', 399, 18, '10ATM water resistance, dual-band GPS, freediving mode, MIL-STD-810G.'],
    ],
  },
  {
    category: 'Smart Home',
    imgKey: 'smart-home',
    items: [
      ['Amazon Echo Hub', 'Amazon', 179, 26, '8" smart display control panel, Matter & Zigbee, wall-mountable.'],
      ['Google Nest Hub Max', 'Google', 229, 19, '10" HD display, Nest Cam, stereo speakers, Google Assistant hub.'],
      ['Apple HomePod (2nd gen)', 'Apple', 299, 15, 'S7 chip, spatial audio, room sensing, temperature & humidity sensor.'],
      ['Philips Hue White & Color Starter Kit', 'Philips', 199, 25, '4 A19 bulbs, Hue Bridge, voice control, 16M colors.'],
      ['Ring Video Doorbell Pro 2', 'Ring', 249, 17, '1536p HD+ Head-to-Toe Video, 3D Motion Detection, Pre-Roll.'],
      ['Arlo Pro 5S 2K Spotlight', 'Arlo', 249, 13, '2K HDR video, color night vision, dual-band Wi-Fi, 6-month battery.'],
      ['Ecobee Smart Thermostat Premium', 'Ecobee', 249, 22, 'Smart sensor included, air quality monitor, built-in Alexa.'],
      ['Nanoleaf Lines Smarter Kit (15 pack)', 'Nanoleaf', 269, 11, 'Modular backlit smart light bars, Thread border router.'],
      ['Eufy Robovac X10 Pro Omni', 'Eufy', 799, 9, '8000Pa suction, self-empty + self-wash + self-dry station, 3D ToF.'],
      ['iRobot Roomba j7+', 'iRobot', 599, 12, 'PrecisionVision Navigation, Clean Base auto-empty, Pet Owner Promise.'],
    ],
  },
  {
    category: 'TVs',
    imgKey: 'television',
    items: [
      ['LG OLED evo C3 65"', 'LG', 1799, 8, 'Self-lit OLED, α9 Gen6 AI Processor, Dolby Vision IQ, 120Hz.'],
      ['Samsung QN90C Neo QLED 65"', 'Samsung', 1999, 9, 'Mini LED, Neural Quantum Processor 4K, Anti-Reflection screen.'],
      ['Sony Bravia A95L QD-OLED 65"', 'Sony', 3499, 5, 'QD-OLED panel, Cognitive Processor XR, Bravia Cam, IMAX Enhanced.'],
      ['TCL QM8 75" Mini LED', 'TCL', 1599, 11, '4K HDR Mini LED, AiPQ Engine, Dolby Vision IQ, 120Hz native.'],
      ['Hisense U8K 65" Mini LED ULED', 'Hisense', 1099, 14, '1500-nit peak, full-array local dimming, Game Mode Pro 144Hz.'],
      ['Panasonic MZ2000 OLED 55"', 'Panasonic', 2299, 7, 'Master OLED Ultimate, HCX Pro AI Processor MK II, 360 Soundscape Pro.'],
      ['Philips OLED+908 55"', 'Philips', 2099, 6, '4-sided Ambilight, Bowers & Wilkins sound, MLA OLED panel.'],
      ['Vizio MQX 65" Quantum', 'Vizio', 749, 17, '4K HDR QLED, 120Hz with VRR, AMD FreeSync Premium, Smart TV.'],
      ['Roku Pro Series Mini-LED 75"', 'Roku', 1499, 10, 'QLED Mini-LED, Dolby Vision IQ, Backlit Voice Remote Pro.'],
      ['Sony X95L Mini LED 75"', 'Sony', 3299, 4, 'XR Backlight Master Drive, Cognitive Processor XR, Acoustic Multi-Audio+.'],
    ],
  },
  {
    category: 'Tablets',
    imgKey: 'tablet-device',
    items: [
      ['iPad Pro 13" M4 1TB Wi-Fi', 'Apple', 1899, 9, 'Ultra Retina XDR Tandem OLED, M4 chip, Apple Pencil Pro support.'],
      ['Samsung Galaxy Tab S9 Ultra 14.6"', 'Samsung', 1199, 11, 'Dynamic AMOLED 2X 120Hz, Snapdragon 8 Gen 2 for Galaxy, IP68.'],
      ['Microsoft Surface Pro 10 for Business', 'Microsoft', 1299, 13, '13" PixelSense Flow, Intel Core Ultra, Surface Pen, NPU for AI.'],
      ['Lenovo Yoga Tab Plus', 'Lenovo', 699, 17, '12.7" 3K LTPS, Snapdragon 8 Gen 3, JBL quad speakers, kickstand.'],
      ['OnePlus Pad 11.61"', 'OnePlus', 479, 22, '144Hz IPS LCD, Dimensity 9000, Magnetic Keyboard, 67W charging.'],
      ['Xiaomi Pad 6 Pro', 'Xiaomi', 449, 25, '11" 144Hz LCD, Snapdragon 8+ Gen 1, MIUI Pad 14, 8840mAh battery.'],
      ['Amazon Fire Max 11', 'Amazon', 229, 35, '11" 2000x1200 LCD, MediaTek octa-core, Stylus Pen support.'],
      ['Google Pixel Tablet 256GB', 'Google', 599, 19, '11" LCD, Tensor G2, included Charging Speaker Dock, Hub Mode.'],
      ['Wacom MovInk 13', 'Wacom', 1999, 6, '13" OLED, Pro Pen 3, weighs 420g, USB-C connectivity, anti-glare.'],
      ['Boox Note Air3 C 10.3"', 'Boox', 499, 14, 'Color E Ink Kaleido 3, octa-core, Wacom stylus, Android 12.'],
    ],
  },
  {
    category: 'Accessories',
    imgKey: 'keyboard-mouse',
    items: [
      ['Logitech MX Master 3S', 'Logitech', 99, 60, '8K DPI sensor, MagSpeed wheel, quiet click, multi-device Flow.'],
      ['Keychron Q1 Max QMK Wireless', 'Keychron', 219, 18, '75% layout, gasket-mounted, hot-swappable, tri-mode wireless.'],
      ['Apple Magic Keyboard with Touch ID & Numpad', 'Apple', 199, 22, 'Touch ID, scissor-switch, USB-C charging, full-size with numeric keypad.'],
      ['Anker 737 Power Bank 24K mAh', 'Anker', 149, 33, '140W output, 3 ports, smart digital display, USB-C PD 3.1.'],
      ['UGREEN Nexode 100W GaN Charger 4-Port', 'UGREEN', 79, 45, '3x USB-C + 1x USB-A, GaN II tech, foldable plug, MacBook Pro 16 capable.'],
      ['Belkin BoostCharge Pro 3-in-1 with MagSafe 15W', 'Belkin', 149, 21, 'Apple Watch fast charging, MagSafe iPhone, AirPods Qi, 1m cable.'],
      ['Razer Basilisk V3 Pro', 'Razer', 159, 24, 'HyperScroll Tilt Wheel, Focus Pro 30K, HyperSpeed Wireless.'],
      ['Logitech MX Keys S', 'Logitech', 109, 28, 'Smart Backlighting, Logi Bolt USB receiver, Logi Options+.'],
      ['Dell UltraSharp U3225QE 32" 4K Thunderbolt', 'Dell', 999, 8, '6K IPS Black, Thunderbolt 4 hub, 140W power delivery to laptop.'],
      ['CalDigit TS4 Thunderbolt 4 Dock', 'CalDigit', 379, 13, '18 ports, 98W charging, dual 6K display support, 40Gb/s.'],
    ],
  },
]

const buildProducts = (adminId) => {
  const products = []
  for (const block of catalog) {
    const pool = imgs[block.imgKey] || []
    block.items.forEach(([name, brand, price, countInStock, description], idx) => {
      const url = pool[idx % pool.length]
      products.push({
        user: adminId,
        name,
        image: sized(url),
        brand,
        category: block.category,
        description,
        rating: Math.round((Math.random() * 2 + 3) * 10) / 10,
        numReviews: Math.floor(Math.random() * 80) + 1,
        price,
        countInStock,
      })
    })
  }
  return products
}

const run = async () => {
  try {
    const admin = await User.findOne({ isAdmin: true })
    if (!admin) {
      console.error('No admin user found. Run npm run data:import first.'.red.inverse)
      process.exit(1)
    }

    const newProducts = buildProducts(admin._id)
    const names = newProducts.map((p) => p.name)
    const existing = await Product.find({ name: { $in: names } }, 'name').lean()
    const existingSet = new Set(existing.map((e) => e.name))
    const toInsert = newProducts.filter((p) => !existingSet.has(p.name))

    if (toInsert.length === 0) {
      console.log('All extra products already present, nothing to insert.'.yellow.inverse)
    } else {
      const inserted = await Product.insertMany(toInsert)
      console.log(`Inserted ${inserted.length} new products.`.green.inverse)
    }

    const total = await Product.countDocuments()
    console.log(`Total products in DB: ${total}`.cyan.inverse)
    process.exit(0)
  } catch (err) {
    console.error(`${err}`.red.inverse)
    process.exit(1)
  }
}

run()
