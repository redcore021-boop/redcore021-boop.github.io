// RedCore — PC configurator parts catalogue.
// PRICES: market average of KSP / Ivory / TMS / Plonter, surveyed 16.10.2026 (see docs/market-survey). Parts not found in stores keep a sample price. Technical fields drive the compatibility checks:
//   cpu.socket / cpu.memory (supported RAM types) / cpu.power (typical gaming load, W)
//   board.socket / board.memory / board.form / board.gen5 (has a PCIe 5.0 M.2 slot)
//   gpu.power (W) / gpu.length (mm, typical for the chip — confirm against the exact model) / gpu.minPsu (W)
//   cooler.type 'air'|'aio' / cooler.height (mm, air) / cooler.radiator (mm, AIO) / cooler.rating (W it can handle)
//   case.forms / case.gpuMax / case.coolerMax / case.radiators / case.style ('panoramic' picks the panoramic illustration)
window.RC_PARTS = {
  cpu: [
    { id: 'r5-5600', name: 'AMD Ryzen 5 5600', price: 449, socket: 'AM4', memory: ['DDR4'], power: 76, note: '6 ליבות · 12 תהליכונים', tier: 'budget' },
    { id: 'r7-5700x3d', name: 'AMD Ryzen 7 5700X3D', price: 849, socket: 'AM4', memory: ['DDR4'], power: 105, note: '8 ליבות · 3D V-Cache', tier: 'budget' },
    { id: 'i5-12400f', name: 'Intel Core i5-12400F', price: 599, socket: 'LGA1700', memory: ['DDR4', 'DDR5'], power: 117, note: '6 ליבות · ללא גרפיקה מובנית', tier: 'budget' },
    { id: 'r5-7600', name: 'AMD Ryzen 5 7600', price: 719, socket: 'AM5', memory: ['DDR5'], power: 88, note: '6 ליבות · Zen 4', tier: 'mid' },
    { id: 'r5-9600x', name: 'AMD Ryzen 5 9600X', price: 799, socket: 'AM5', memory: ['DDR5'], power: 88, note: '6 ליבות · Zen 5', tier: 'mid' },
    { id: 'i5-14600k', name: 'Intel Core i5-14600K', price: 1159, socket: 'LGA1700', memory: ['DDR4', 'DDR5'], power: 181, note: '14 ליבות · פתוח להאצה', tier: 'mid' },
    { id: 'r7-7800x3d', name: 'AMD Ryzen 7 7800X3D', price: 1239, socket: 'AM5', memory: ['DDR5'], power: 120, note: '8 ליבות · 3D V-Cache', tier: 'high' },
    { id: 'r7-9800x3d', name: 'AMD Ryzen 7 9800X3D', price: 1689, socket: 'AM5', memory: ['DDR5'], power: 120, note: '8 ליבות · המעבד המהיר לגיימינג', tier: 'high' },
    { id: 'u7-265k', name: 'Intel Core Ultra 7 265K', price: 1299, socket: 'LGA1851', memory: ['DDR5'], power: 250, note: '20 ליבות · עבודה ויצירה', tier: 'high' },
    { id: 'r9-9950x3d', name: 'AMD Ryzen 9 9950X3D', price: 2709, socket: 'AM5', memory: ['DDR5'], power: 200, note: '16 ליבות · גיימינג ועבודה כבדה', tier: 'ultra' },
    { id: 'i3-12100f', name: 'Intel Core i3-12100F', price: 349, socket: 'LGA1700', memory: ['DDR4', 'DDR5'], power: 89, note: '4 ליבות · ללא גרפיקה מובנית', tier: 'budget' },
    { id: 'r5-5600x', name: 'AMD Ryzen 5 5600X', price: 529, socket: 'AM4', memory: ['DDR4'], power: 76, note: '6 ליבות · 12 תהליכונים', tier: 'budget' },
    { id: 'i5-13400f', name: 'Intel Core i5-13400F', price: 699, socket: 'LGA1700', memory: ['DDR4', 'DDR5'], power: 148, note: '10 ליבות · ללא גרפיקה מובנית', tier: 'budget' },
    { id: 'r7-5800x', name: 'AMD Ryzen 7 5800X', price: 649, socket: 'AM4', memory: ['DDR4'], power: 105, note: '8 ליבות · 16 תהליכונים', tier: 'budget' },
    { id: 'r5-8600g', name: 'AMD Ryzen 5 8600G', price: 689, socket: 'AM5', memory: ['DDR5'], power: 88, note: '6 ליבות · גרפיקה מובנית חזקה', tier: 'mid' },
    { id: 'r7-7700', name: 'AMD Ryzen 7 7700', price: 809, socket: 'AM5', memory: ['DDR5'], power: 88, note: '8 ליבות · Zen 4', tier: 'mid' },
    { id: 'r7-9700x', name: 'AMD Ryzen 7 9700X', price: 1039, socket: 'AM5', memory: ['DDR5'], power: 88, note: '8 ליבות · Zen 5', tier: 'mid' },
    { id: 'u5-245k', name: 'Intel Core Ultra 5 245K', price: 919, socket: 'LGA1851', memory: ['DDR5'], power: 159, note: '14 ליבות · פתוח להאצה', tier: 'mid' },
    { id: 'i7-14700k', name: 'Intel Core i7-14700K', price: 1679, socket: 'LGA1700', memory: ['DDR4', 'DDR5'], power: 253, note: '20 ליבות · עבודה וגיימינג', tier: 'high' },
    { id: 'r9-7900x', name: 'AMD Ryzen 9 7900X', price: 1389, socket: 'AM5', memory: ['DDR5'], power: 160, note: '12 ליבות · Zen 4', tier: 'high' },
    { id: 'r9-9900x', name: 'AMD Ryzen 9 9900X', price: 1629, socket: 'AM5', memory: ['DDR5'], power: 160, note: '12 ליבות · Zen 5', tier: 'high' },
    { id: 'i9-14900k', name: 'Intel Core i9-14900K', price: 1929, socket: 'LGA1700', memory: ['DDR4', 'DDR5'], power: 253, note: '24 ליבות · פתוח להאצה', tier: 'ultra' },
    { id: 'r9-9950x', name: 'AMD Ryzen 9 9950X', price: 2159, socket: 'AM5', memory: ['DDR5'], power: 200, note: '16 ליבות · עבודה ויצירה', tier: 'ultra' },
    { id: 'u9-285k', name: 'Intel Core Ultra 9 285K', price: 2279, socket: 'LGA1851', memory: ['DDR5'], power: 250, note: '24 ליבות · עבודה כבדה', tier: 'ultra' },
  ],
  board: [
    { id: 'b550m-pro', name: 'MSI B550M PRO-VDH WiFi', price: 459, socket: 'AM4', memory: 'DDR4', form: 'mATX', gen5: false, wifi: true, note: 'mATX · WiFi' },
    { id: 'tuf-b550', name: 'ASUS TUF Gaming B550-PLUS WiFi II', price: 639, socket: 'AM4', memory: 'DDR4', form: 'ATX', gen5: false, wifi: true, note: 'ATX · WiFi 6' },
    { id: 'b760m-ds3h', name: 'Gigabyte B760M DS3H DDR4', price: 459, socket: 'LGA1700', memory: 'DDR4', form: 'mATX', gen5: false, wifi: false, note: 'mATX · DDR4' },
    { id: 'prime-b760', name: 'ASUS PRIME B760-PLUS', price: 719, socket: 'LGA1700', memory: 'DDR5', form: 'ATX', gen5: false, wifi: false, note: 'ATX · DDR5' },
    { id: 'b650m-gp', name: 'MSI B650M GAMING PLUS WIFI', price: 619, socket: 'AM5', memory: 'DDR5', form: 'mATX', gen5: false, wifi: true, note: 'mATX · WiFi 6E' },
    { id: 'b850-gp', name: 'MSI B850 GAMING PLUS WIFI', price: 839, socket: 'AM5', memory: 'DDR5', form: 'ATX', gen5: true, wifi: true, note: 'ATX · WiFi 7 · M.2 Gen5' },
    { id: 'x870e-e', name: 'ASUS ROG STRIX X870E-E GAMING WIFI', price: 2449, socket: 'AM5', memory: 'DDR5', form: 'ATX', gen5: true, wifi: true, note: 'ATX · פרימיום · WiFi 7' },
    { id: 'z890-a', name: 'MSI PRO Z890-A WIFI', price: 1339, socket: 'LGA1851', memory: 'DDR5', form: 'ATX', gen5: true, wifi: true, note: 'ATX · WiFi 7 · M.2 Gen5' },
    { id: 'a520m-hdv', name: 'ASRock A520M-HDV', price: 299, socket: 'AM4', memory: 'DDR4', form: 'mATX', gen5: false, wifi: false, note: 'mATX · בסיסי' },
    { id: 'b550-aorus', name: 'Gigabyte B550 AORUS ELITE AX V2', price: 649, socket: 'AM4', memory: 'DDR4', form: 'ATX', gen5: false, wifi: true, note: 'ATX · WiFi 6' },
    { id: 'b650m-pro-rs', name: 'ASRock B650M Pro RS WiFi', price: 649, socket: 'AM5', memory: 'DDR5', form: 'mATX', gen5: true, wifi: true, note: 'mATX · WiFi 6E · M.2 Gen5' },
    { id: 'b650-eagle', name: 'Gigabyte B650 EAGLE AX', price: 739, socket: 'AM5', memory: 'DDR5', form: 'ATX', gen5: false, wifi: true, note: 'ATX · WiFi 6E' },
    { id: 'tuf-b650', name: 'ASUS TUF GAMING B650-PLUS WIFI', price: 819, socket: 'AM5', memory: 'DDR5', form: 'ATX', gen5: true, wifi: true, note: 'ATX · WiFi 6 · M.2 Gen5' },
    { id: 'b850-i', name: 'ASUS ROG STRIX B850-I GAMING WIFI', price: 1679, socket: 'AM5', memory: 'DDR5', form: 'ITX', gen5: true, wifi: true, note: 'Mini-ITX · WiFi 7' },
    { id: 'x870-tomahawk', name: 'MSI MAG X870 TOMAHAWK WIFI', price: 1439, socket: 'AM5', memory: 'DDR5', form: 'ATX', gen5: true, wifi: true, note: 'ATX · WiFi 7 · M.2 Gen5' },
    { id: 'b760m-a', name: 'MSI PRO B760M-A WIFI', price: 669, socket: 'LGA1700', memory: 'DDR5', form: 'mATX', gen5: false, wifi: true, note: 'mATX · WiFi 6E' },
    { id: 'z790-tomahawk', name: 'MSI MAG Z790 TOMAHAWK WIFI', price: 1269, socket: 'LGA1700', memory: 'DDR5', form: 'ATX', gen5: false, wifi: true, note: 'ATX · פתוח להאצה · WiFi 6E' },
    { id: 'b860m-ds3h', name: 'Gigabyte B860M DS3H WIFI6E', price: 619, socket: 'LGA1851', memory: 'DDR5', form: 'mATX', gen5: false, wifi: true, note: 'mATX · WiFi 6E' },
    { id: 'prime-b860', name: 'ASUS PRIME B860-PLUS WIFI', price: 779, socket: 'LGA1851', memory: 'DDR5', form: 'ATX', gen5: true, wifi: true, note: 'ATX · WiFi 6E · M.2 Gen5' },
  ],
  ram: [
    { id: 'ddr4-16', name: '16GB (2x8GB) DDR4 3200MHz', price: 749, type: 'DDR4', note: 'בסיסי לגיימינג' },
    { id: 'ddr4-32', name: '32GB (2x16GB) DDR4 3600MHz', price: 1579, type: 'DDR4', note: 'מומלץ ל-DDR4' },
    { id: 'ddr5-32', name: '32GB (2x16GB) DDR5 6000MHz CL30', price: 2419, type: 'DDR5', note: 'הנקודה המתוקה לגיימינג' },
    { id: 'ddr5-64', name: '64GB (2x32GB) DDR5 6000MHz CL30', price: 4509, type: 'DDR5', note: 'עריכה, סטרימינג ועבודה כבדה' },
    { id: 'ddr4-32-3200', name: '32GB (2x16GB) DDR4 3200MHz CL16', price: 1249, type: 'DDR4', note: 'משתלם ל-DDR4' },
    { id: 'ddr4-64', name: '64GB (2x32GB) DDR4 3200MHz', price: 2769, type: 'DDR4', note: 'עבודה כבדה על AM4' },
    { id: 'ddr5-32-rgb', name: '32GB (2x16GB) DDR5 6000MHz CL30 RGB', price: 2349, type: 'DDR5', note: 'עם תאורת RGB' },
    { id: 'ddr5-32-6400', name: '32GB (2x16GB) DDR5 6400MHz CL32', price: 2369, type: 'DDR5', note: 'מהיר במיוחד' },
    { id: 'ddr5-48', name: '48GB (2x24GB) DDR5 6000MHz', price: 2789, type: 'DDR5', note: 'מעבר ל-32GB' },
    { id: 'ddr5-96', name: '96GB (2x48GB) DDR5 6000MHz', price: 9299, type: 'DDR5', note: 'תלת-ממד, וידאו ו-AI' },
  ],
  gpu: [
    { id: 'rtx5060', name: 'NVIDIA GeForce RTX 5060 8GB', price: 1969, power: 145, length: 245, minPsu: 550, note: '1080p בקצב גבוה' },
    { id: 'rx9060xt', name: 'AMD Radeon RX 9060 XT 16GB', price: 2599, power: 160, length: 270, minPsu: 550, note: '1080p / 1440p' },
    { id: 'rtx5060ti', name: 'NVIDIA GeForce RTX 5060 Ti 16GB', price: 3279, power: 180, length: 260, minPsu: 600, note: '1440p' },
    { id: 'rtx5070', name: 'NVIDIA GeForce RTX 5070 12GB', price: 3489, power: 250, length: 300, minPsu: 650, note: '1440p בקצב גבוה' },
    { id: 'rx9070xt', name: 'AMD Radeon RX 9070 XT 16GB', price: 3829, power: 304, length: 320, minPsu: 750, note: '1440p אולטרה' },
    { id: 'rtx5070ti', name: 'NVIDIA GeForce RTX 5070 Ti 16GB', price: 5449, power: 300, length: 330, minPsu: 750, note: '1440p אולטרה / 4K' },
    { id: 'rtx5080', name: 'NVIDIA GeForce RTX 5080 16GB', price: 6509, power: 360, length: 340, minPsu: 850, note: '4K' },
    { id: 'rtx5090', name: 'NVIDIA GeForce RTX 5090 32GB', price: 24699, power: 575, length: 360, minPsu: 1000, note: '4K ללא פשרות' },
    { id: 'rtx3050', name: 'NVIDIA GeForce RTX 3050 6GB', price: 1059, power: 70, length: 200, minPsu: 300, note: 'גיימינג קל · 1080p' },
    { id: 'rx7600', name: 'AMD Radeon RX 7600 8GB', price: 1529, power: 165, length: 240, minPsu: 550, note: '1080p' },
    { id: 'rx9060xt8', name: 'AMD Radeon RX 9060 XT 8GB', price: 1819, power: 150, length: 250, minPsu: 500, note: '1080p בקצב גבוה' },
    { id: 'rtx5060ti8', name: 'NVIDIA GeForce RTX 5060 Ti 8GB', price: 2229, power: 180, length: 250, minPsu: 600, note: '1080p / 1440p' },
    { id: 'rx9070', name: 'AMD Radeon RX 9070 16GB', price: 3239, power: 220, length: 300, minPsu: 650, note: '1440p' },
    { id: 'rx7900xtx', name: 'AMD Radeon RX 7900 XTX 24GB', price: 4199, power: 355, length: 330, minPsu: 850, note: '4K' },
  ],
  storage: [
    { id: 'nvme-1tb', name: 'SSD NVMe Gen4 1TB', price: 719, gen: 4, note: 'עד ~7,000MB/s' },
    { id: 'nvme-2tb', name: 'SSD NVMe Gen4 2TB', price: 1179, gen: 4, note: 'עד ~7,000MB/s' },
    { id: 'nvme-2tb-g5', name: 'Corsair MP700 Elite 2TB Gen5', price: 1659, gen: 5, note: 'עד ~10,000MB/s' },
    { id: 'nvme-4tb', name: 'SSD NVMe Gen4 4TB', price: 2009, gen: 4, note: 'הרבה מקום למשחקים' },
    { id: 'nvme-500-g3', name: 'SSD NVMe Gen3 500GB', price: 449, gen: 3, note: 'עד ~3,500MB/s' },
    { id: 'sn850x-1tb', name: 'WD Black SN850X 1TB', price: 1319, gen: 4, note: 'עד ~7,300MB/s' },
    { id: '990pro-1tb', name: 'Samsung 990 PRO 1TB', price: 969, gen: 4, note: 'עד ~7,450MB/s' },
    { id: '990pro-2tb', name: 'Samsung 990 PRO 2TB', price: 1769, gen: 4, note: 'עד ~7,450MB/s' },
    { id: 't705-2tb', name: 'Crucial T705 2TB Gen5', price: 1469, gen: 5, note: 'עד ~14,500MB/s' },
  ],
  cooler: [
    { id: 'pa120se', name: 'Thermalright Peerless Assassin 120 SE', price: 279, type: 'air', height: 155, rating: 200, sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], note: 'קירור אוויר כפול · 155mm' },
    { id: 'ps120se', name: 'Thermalright Phantom Spirit 120 SE', price: 219, type: 'air', height: 154, rating: 230, sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], note: 'קירור אוויר כפול · 154mm' },
    { id: 'lf3-240', name: 'Arctic Liquid Freezer III 240', price: 369, type: 'aio', radiator: 240, rating: 250, sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], note: 'קירור נוזלי 240mm' },
    { id: 'lf3-360', name: 'Arctic Liquid Freezer III 360', price: 499, type: 'aio', radiator: 360, rating: 320, sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], note: 'קירור נוזלי 360mm' },
    { id: 'ax120se', name: 'Thermalright Assassin X 120 Refined SE', price: 129, type: 'air', height: 148, rating: 160, sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], note: 'קירור אוויר בסיסי · 148mm' },
    { id: 'ak400', name: 'DeepCool AK400', price: 149, type: 'air', height: 155, rating: 180, sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], note: 'קירור אוויר · 155mm' },
    { id: 'nh-d15g2', name: 'Noctua NH-D15 G2', price: 609, type: 'air', height: 168, rating: 250, sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], note: 'קירור אוויר פרימיום · 168mm' },
    { id: 'lf3-280', name: 'Arctic Liquid Freezer III 280', price: 449, type: 'aio', radiator: 280, rating: 280, sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], note: 'קירור נוזלי 280mm' },
    { id: 'kraken-360', name: 'NZXT Kraken 360', price: 899, type: 'aio', radiator: 360, rating: 320, sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851'], note: 'קירור נוזלי 360mm · מסך LCD' },
  ],
  case: [
    { id: 'a3-matx', name: 'Lian Li A3-mATX', price: 429, forms: ['mATX', 'ITX'], gpuMax: 415, coolerMax: 165, radiators: [240, 360], note: 'קומפקטי · mATX בלבד' },
    { id: '4000d', name: 'Corsair 4000D Airflow', price: 449, forms: ['ATX', 'mATX', 'ITX'], gpuMax: 360, coolerMax: 170, radiators: [240, 280, 360], note: 'זרימת אוויר מעולה' },
    { id: 'o11-evo', name: 'Lian Li O11 Dynamic EVO', price: 579, forms: ['ATX', 'mATX', 'ITX'], gpuMax: 422, coolerMax: 167, radiators: [240, 280, 360], style: 'panoramic', note: 'פנורמי · זכוכית כפולה' },
    { id: 'q300l', name: 'Cooler Master MasterBox Q300L', price: 249, forms: ['mATX', 'ITX'], gpuMax: 360, coolerMax: 159, radiators: [240], note: 'קומפקטי וחסכוני · mATX' },
    { id: 'north', name: 'Fractal Design North', price: 719, forms: ['ATX', 'mATX', 'ITX'], gpuMax: 355, coolerMax: 170, radiators: [240, 280, 360], note: 'עיצוב עץ ורשת · שקט' },
    { id: 'lancool-216', name: 'Lian Li Lancool 216', price: 409, forms: ['ATX', 'mATX', 'ITX'], gpuMax: 392, coolerMax: 180, radiators: [240, 280, 360], note: 'זרימת אוויר חזקה · 2 מאווררי 160mm' },
    { id: 'hyte-y60', name: 'HYTE Y60', price: 849, forms: ['ATX', 'mATX', 'ITX'], gpuMax: 375, coolerMax: 160, radiators: [240, 280, 360], style: 'panoramic', note: 'פנורמי · כרטיס מסך אנכי' },
    { id: 'o11-vision', name: 'Lian Li O11 Vision', price: 659, forms: ['ATX', 'mATX', 'ITX'], gpuMax: 455, coolerMax: 167, radiators: [240, 280, 360], style: 'panoramic', note: 'פנורמי · שלושה צדדי זכוכית' },
  ],
  psu: [
    { id: 'cx550', name: 'Corsair CX550 550W Bronze', price: 279, watts: 550, note: '80+ Bronze' },
    { id: 'cx650', name: 'Corsair CX650 650W Bronze', price: 299, watts: 650, note: '80+ Bronze' },
    { id: 'rm750e', name: 'Corsair RM750e 750W Gold', price: 559, watts: 750, note: '80+ Gold · מודולרי' },
    { id: 'rm850e', name: 'Corsair RM850e 850W Gold', price: 589, watts: 850, note: '80+ Gold · מודולרי' },
    { id: 'rm1000e', name: 'Corsair RM1000e 1000W Gold', price: 739, watts: 1000, note: '80+ Gold · מודולרי' },
    { id: 'cv450', name: 'Corsair CV450 450W Bronze', price: 179, watts: 450, note: '80+ Bronze' },
    { id: 'cx750', name: 'Corsair CX750 750W Bronze', price: 299, watts: 750, note: '80+ Bronze' },
    { id: 'focus-gx850', name: 'Seasonic FOCUS GX-850 850W Gold', price: 709, watts: 850, note: '80+ Gold · מודולרי' },
    { id: 'pp12m-1000', name: 'be quiet! Pure Power 12 M 1000W Gold', price: 799, watts: 1000, note: '80+ Gold · ATX 3.0' },
    { id: 'vertex-1200', name: 'Seasonic VERTEX GX-1200 1200W Gold', price: 1079, watts: 1200, note: '80+ Gold · ATX 3.0' },
  ],

  // ---- Optional accessories ("ציוד משלים") — generic names; replace with the exact models you sell ----
  os: [
    { id: "win11-home", name: "Windows 11 Home", price: 599, note: "רישיון דיגיטלי · מותקן ומופעל" },
    { id: "win11-pro", name: "Windows 11 Pro", price: 889, note: "רישיון דיגיטלי · מותקן ומופעל" },
  ],
  // Monitors: real example models with ESTIMATED prices (not from the market survey) — check each model and price before selling.
  //   use 'office'|'gaming' / size (inches) / res — drive the picker's filter chips
  monitor: [
    // Office
    { id: 'mon-off-22-dell', name: 'Dell SE2225H 21.5" Full HD', price: 399, use: 'office', size: 22, res: '1080p', note: 'משרדי · VA 75Hz · HDMI + VGA', image: 'assets/img/parts/mon-off-22-dell.jpg' },
    { id: 'mon-off-24-samsung', name: 'Samsung S3 S24C310 24" Full HD', price: 449, use: 'office', size: 24, res: '1080p', note: 'משרדי · IPS 75Hz · מסגרת דקה', image: 'assets/img/parts/mon-off-24-samsung.jpg' },
    { id: 'mon-off-24-dell-p', name: 'Dell P2425H 24" Full HD', price: 799, use: 'office', size: 24, res: '1080p', note: 'משרדי · IPS 100Hz · כוונון גובה וסיבוב', image: 'assets/img/parts/mon-off-24-dell-p.jpg' },
    { id: 'mon-off-27-lg', name: 'LG 27MR400 27" Full HD', price: 549, use: 'office', size: 27, res: '1080p', note: 'משרדי · IPS 100Hz', image: 'assets/img/parts/mon-off-27-lg.jpg' },
    { id: 'mon-off-27-dell-qhd', name: 'Dell S2725DS 27" QHD', price: 999, use: 'office', size: 27, res: '1440p', note: 'משרדי · IPS 100Hz · רמקולים מובנים', image: 'assets/img/parts/mon-off-27-dell-qhd.jpg' },
    { id: 'mon-off-27-lg-4k', name: 'LG 27UP600 27" 4K', price: 1199, use: 'office', size: 27, res: '4K', note: 'עבודה ועיצוב · IPS · HDR400', image: 'assets/img/parts/mon-off-27-lg-4k.jpg' },
    { id: 'mon-off-32-lg-4k', name: 'LG 32UR500 32" 4K', price: 1299, use: 'office', size: 32, res: '4K', note: 'עבודה ומולטימדיה · VA · HDR10', image: 'assets/img/parts/mon-off-32-lg-4k.jpg' },
    { id: 'mon-off-34-dell-uw', name: 'Dell P3424WE 34" Ultrawide מעוקל', price: 2199, use: 'office', size: 34, res: 'Ultrawide', note: 'עבודה מרובת חלונות · USB-C 90W', image: 'assets/img/parts/mon-off-34-dell-uw.jpg' },
    // Gaming
    { id: 'mon-24-1080', name: 'AOC 24G4X 24" Full HD', price: 549, use: 'gaming', size: 24, res: '1080p', note: 'גיימינג · IPS 180Hz · 1ms', image: 'assets/img/parts/mon-24-1080.jpg' },
    { id: 'mon-24-1080-240', name: 'AOC 25G3ZM 24.5" Full HD', price: 599, use: 'gaming', size: 24, res: '1080p', note: 'לתחרותיים · VA 240Hz · Esports', image: 'assets/img/parts/mon-24-1080-240.jpg' },
    { id: 'mon-27-1080', name: 'AOC 27G4X 27" Full HD', price: 649, use: 'gaming', size: 27, res: '1080p', note: 'גיימינג · IPS 180Hz', image: 'assets/img/parts/mon-27-1080.jpg' },
    { id: 'mon-27-1440', name: 'AOC Q27G4X 27" QHD', price: 799, use: 'gaming', size: 27, res: '1440p', note: 'גיימינג · IPS 180Hz · מתאים ל-1440p', image: 'assets/img/parts/mon-27-1440.jpg' },
    { id: 'mon-27-1440-lg', name: 'LG UltraGear 27GS75Q 27" QHD', price: 999, use: 'gaming', size: 27, res: '1440p', note: 'גיימינג · IPS 180Hz · HDR10', image: 'assets/img/parts/mon-27-1440-lg.jpg' },
    { id: 'mon-27-oled', name: 'MSI MAG 271QPX QD-OLED E2 27" QHD', price: 1999, use: 'gaming', size: 27, res: '1440p', note: 'OLED 240Hz · שחור מושלם', image: 'assets/img/parts/mon-27-oled.jpg' },
    { id: 'mon-27-4k', name: 'MSI MAG 274UPF E2 27" 4K', price: 1499, use: 'gaming', size: 27, res: '4K', note: 'גיימינג · Rapid IPS 160Hz · מתאים ל-4K', image: 'assets/img/parts/mon-27-4k.jpg' },
    { id: 'mon-32-1440', name: 'Samsung Odyssey G5 32" QHD מעוקל', price: 1199, use: 'gaming', size: 32, res: '1440p', note: 'גיימינג · VA 165Hz · מסך מעוקל', image: 'assets/img/parts/mon-32-1440.jpg' },
    { id: 'mon-32-4k-oled', name: 'MSI MPG 321URX QD-OLED 32" 4K', price: 4299, use: 'gaming', size: 32, res: '4K', note: 'OLED 240Hz · הקצה העליון', image: 'assets/img/parts/mon-32-4k-oled.jpg' },
    { id: 'mon-34-uw', name: 'AOC CU34G2XP 34" Ultrawide מעוקל', price: 1399, use: 'gaming', size: 34, res: 'Ultrawide', note: 'רחב במיוחד · VA 180Hz · משחקים ועבודה', image: 'assets/img/parts/mon-34-uw.jpg' },
    { id: 'mon-34-uw-oled', name: 'Samsung Odyssey OLED G8 34" Ultrawide', price: 3499, use: 'gaming', size: 34, res: 'Ultrawide', note: 'QD-OLED 175Hz · מעוקל', image: 'assets/img/parts/mon-34-uw-oled.jpg' },
    { id: 'mon-49-suw', name: 'Samsung Odyssey G9 49" Super Ultrawide', price: 4499, use: 'gaming', size: 49, res: 'Ultrawide', note: 'רחב כמו שני מסכים · VA 240Hz', image: 'assets/img/parts/mon-49-suw.jpg' },
  ],
  keyboard: [
    { id: "kb-mech", name: "מקלדת מכנית גיימינג RGB", price: 249, note: "חוטית · עברית/אנגלית" },
    { id: "kb-75-wl", name: "מקלדת מכנית אלחוטית 75%", price: 449, note: "אלחוטית · Hot-swap" },
    { id: 'kb-membrane', name: 'מקלדת גיימינג ממברנה RGB', price: 129, note: 'חוטית · עברית/אנגלית' },
    { id: 'kb-mech-tkl', name: 'מקלדת מכנית TKL אלחוטית', price: 549, note: 'בלי מקשי מספרים · אלחוטית' },
  ],
  mouse: [
    { id: "ms-wired", name: "עכבר גיימינג חוטי RGB", price: 129, note: "חיישן אופטי מדויק" },
    { id: "ms-wl", name: "עכבר גיימינג אלחוטי קל משקל", price: 349, note: "אלחוטי · פחות מ-60 גרם" },
    { id: 'ms-basic', name: 'עכבר גיימינג בסיסי', price: 79, note: 'חוטי' },
    { id: 'ms-wl-pro', name: 'עכבר גיימינג אלחוטי פרימיום', price: 549, note: 'חיישן מתקדם · פחות מ-60 גרם' },
  ],
  headset: [
    { id: "hs-wired", name: "אוזניות גיימינג חוטיות", price: 199, note: "מיקרופון נשלף" },
    { id: "hs-wl", name: "אוזניות גיימינג אלחוטיות", price: 499, note: "אלחוטיות · סוללה ארוכה" },
    { id: 'hs-wl-pro', name: 'אוזניות גיימינג אלחוטיות פרימיום', price: 899, note: 'סינון רעשים · סאונד היקפי' },
  ],
  fans: [
    { id: "fans-3", name: "ערכת 3 מאווררי ARGB 120mm", price: 199, note: "זרימת אוויר ותאורה" },
    { id: "fans-6", name: "ערכת 6 מאווררי ARGB 120mm", price: 349, note: "למארזים פנורמיים" },
    { id: 'fans-140', name: 'ערכת 3 מאווררי ARGB 140mm', price: 279, note: 'זרימת אוויר שקטה' },
  ],
  wifi: [
    { id: "wifi-6e", name: "כרטיס WiFi 6E + Bluetooth 5.3 (PCIe)", price: 399, note: "ללוחות ללא WiFi" },
    { id: 'wifi-7', name: 'כרטיס WiFi 7 + Bluetooth 5.4 (PCIe)', price: 249, note: 'ללוחות ללא WiFi' },
  ],
};

// Optional accessories group (no compatibility rules except notes in configurator.js)
window.RC_EXTRAS = [
  { key: "os", label: "מערכת הפעלה", icon: "i-os" },
  { key: "monitor", label: "מסך", icon: "i-monitor" },
  { key: "keyboard", label: "מקלדת", icon: "i-keyboard" },
  { key: "mouse", label: "עכבר", icon: "i-mouse" },
  { key: "headset", label: "אוזניות", icon: "i-headset" },
  { key: "fans", label: "מאווררים נוספים", icon: "i-fan" },
  { key: "wifi", label: "כרטיס רשת אלחוטי", icon: "i-wifi" },
];

// Assembly + Windows install + stress testing (SAMPLE price — update)
window.RC_ASSEMBLY_FEE = 300;

// Order, labels and icons of the configurator steps
window.RC_STEPS = [
  { key: 'cpu', label: 'מעבד', icon: 'i-cpu' },
  { key: 'board', label: 'לוח אם', icon: 'i-board' },
  { key: 'ram', label: 'זיכרון RAM', icon: 'i-ram' },
  { key: 'gpu', label: 'כרטיס מסך', icon: 'i-gpu' },
  { key: 'storage', label: 'אחסון', icon: 'i-drive' },
  { key: 'cooler', label: 'קירור', icon: 'i-fan' },
  { key: 'case', label: 'מארז', icon: 'i-case' },
  { key: 'psu', label: 'ספק כוח', icon: 'i-zap' },
];

// Starting points ("בלי להסתבך") — every preset must pass all compatibility checks
window.RC_PRESETS = [
  { id: 'budget', label: 'חסכוני', hint: '1080p', parts: { cpu: 'r5-5600', board: 'b550m-pro', ram: 'ddr4-16', gpu: 'rtx5060', storage: 'nvme-1tb', cooler: 'pa120se', case: 'a3-matx', psu: 'cx650' } },
  { id: 'mid', label: 'מאוזן', hint: '1440p', parts: { cpu: 'r5-7600', board: 'b650m-gp', ram: 'ddr5-32', gpu: 'rtx5070', storage: 'nvme-2tb', cooler: 'ps120se', case: 'a3-matx', psu: 'rm750e' } },
  { id: 'high', label: 'עוצמתי', hint: '1440p אולטרה / 4K', parts: { cpu: 'r7-9800x3d', board: 'b850-gp', ram: 'ddr5-32', gpu: 'rtx5070ti', storage: 'nvme-2tb-g5', cooler: 'lf3-360', case: 'o11-evo', psu: 'rm850e' } },
  { id: 'ultra', label: 'ללא פשרות', hint: '4K', parts: { cpu: 'r9-9950x3d', board: 'x870e-e', ram: 'ddr5-64', gpu: 'rtx5090', storage: 'nvme-4tb', cooler: 'lf3-360', case: 'o11-evo', psu: 'rm1000e' } },
];
