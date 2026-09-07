/* ============================================
   SHARED DATA STORE - STEM IoT Shop
   Dung chung boi trang chu (app.js) va trang admin (admin/admin.js)
   - stem_products : catalog san pham that
   - stem_orders   : don hang that (khach dat tren trang chu hoac tao tu admin)
   - stem_users    : khach hang (tu cap nhat khi co don hang moi)
   - stemCart      : gio hang cua khach (trang chu doc/ghi key nay)
   ============================================ */

var STORE_KEYS = {
  products: 'stem_products',
  orders: 'stem_orders',
  users: 'stem_users',
  cart: 'stemCart',
  seeded: 'stem_store_seeded'
};

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
var STORE_CATEGORIES = [
  {
    id: "ics",
    icon: "▣",
    label: { vi: "IC - Mạch tích hợp", en: "ICs - Integrated Circuits", ja: "IC・集積回路" },
    subs: [
      { id: "power-ic", label: { vi: "IC nguồn", en: "Power ICs", ja: "電源IC" } },
      { id: "logic-ic", label: { vi: "IC logic", en: "Logic ICs", ja: "ロジックIC" } },
      { id: "motor-driver", label: { vi: "Driver motor", en: "Motor drivers", ja: "モータードライバ" } },
      { id: "op-amp", label: { vi: "Op-Amp", en: "Op-Amps", ja: "オペアンプ" } }
    ]
  },
  {
    id: "board",
    icon: "◆",
    label: { vi: "BOARD IoT", en: "IoT Boards", ja: "IoTボード" },
    subs: [
      { id: "esp32", label: { vi: "ESP32", en: "ESP32", ja: "ESP32" } },
      { id: "arduino", label: { vi: "Arduino", en: "Arduino", ja: "Arduino" } },
      { id: "stm32", label: { vi: "STM32", en: "STM32", ja: "STM32" } },
      { id: "raspberry-pi", label: { vi: "Raspberry Pi", en: "Raspberry Pi", ja: "Raspberry Pi" } }
    ]
  },
  {
    id: "passive",
    icon: "◇",
    label: { vi: "Linh kiện thụ động", en: "Passive Components", ja: "受動部品" },
    subs: [
      { id: "resistor", label: { vi: "Điện trở", en: "Resistors", ja: "抵抗" } },
      { id: "capacitor", label: { vi: "Tụ điện", en: "Capacitors", ja: "コンデンサ" } },
      { id: "inductor", label: { vi: "Cuộn cảm", en: "Inductors", ja: "インダクタ" } },
      { id: "potentiometer", label: { vi: "Biến trở", en: "Potentiometers", ja: "可変抵抗" } }
    ]
  },
  {
    id: "sensors",
    icon: "◉",
    label: { vi: "Cảm biến", en: "Sensors", ja: "センサー" },
    subs: [
      { id: "temperature", label: { vi: "Nhiệt độ", en: "Temperature", ja: "温度" } },
      { id: "distance", label: { vi: "Khoảng cách", en: "Distance", ja: "距離" } },
      { id: "motion", label: { vi: "Chuyển động", en: "Motion", ja: "動き" } },
      { id: "color", label: { vi: "Màu sắc", en: "Color", ja: "色" } }
    ]
  },
  {
    id: "industrial",
    icon: "▤",
    label: { vi: "Điện công nghiệp", en: "Industrial Electrical", ja: "産業用電気" },
    subs: [
      { id: "relay", label: { vi: "Relay", en: "Relays", ja: "リレー" } },
      { id: "din-power", label: { vi: "Nguồn DIN rail", en: "DIN rail power", ja: "DINレール電源" } },
      { id: "button", label: { vi: "Nút nhấn", en: "Push buttons", ja: "押しボタン" } },
      { id: "mini-plc", label: { vi: "PLC mini", en: "Mini PLC", ja: "ミニPLC" } }
    ]
  },
  {
    id: "robot",
    icon: "◎",
    label: { vi: "Robot", en: "Robots", ja: "ロボット" },
    subs: [
      { id: "robot-car", label: { vi: "Xe robot", en: "Robot cars", ja: "ロボットカー" } },
      { id: "servo", label: { vi: "Servo", en: "Servos", ja: "サーボ" } },
      { id: "motor", label: { vi: "Motor", en: "Motors", ja: "モーター" } },
      { id: "mechanical-frame", label: { vi: "Khung cơ khí", en: "Mechanical frames", ja: "メカフレーム" } }
    ]
  },
  {
    id: "tools",
    icon: "△",
    label: { vi: "Dụng cụ - Hàn mạch", en: "Tools - Soldering", ja: "工具・はんだ" },
    subs: [
      { id: "soldering-iron", label: { vi: "Mỏ hàn", en: "Soldering irons", ja: "はんだごて" } },
      { id: "solder-wire", label: { vi: "Thiếc hàn", en: "Solder wire", ja: "はんだ線" } },
      { id: "multimeter", label: { vi: "Đồng hồ đo", en: "Multimeters", ja: "マルチメータ" } },
      { id: "pliers", label: { vi: "Kìm cắt", en: "Cutting pliers", ja: "ニッパー" } }
    ]
  },
  {
    id: "power",
    icon: "◧",
    label: { vi: "Bộ nguồn - Pin", en: "Power - Batteries", ja: "電源・バッテリー" },
    subs: [
      { id: "ac-dc", label: { vi: "AC-DC", en: "AC-DC", ja: "AC-DC" } },
      { id: "dc-dc", label: { vi: "DC-DC", en: "DC-DC", ja: "DC-DC" } },
      { id: "battery", label: { vi: "Pin sạc", en: "Rechargeable batteries", ja: "充電池" } },
      { id: "charger", label: { vi: "Mạch sạc", en: "Charging modules", ja: "充電モジュール" } }
    ]
  }
];

var SEED_PRODUCTS = [
  {
    id: "arduino-proto-shield-rev3",
    sku: "ST-BOARD-001",
    name: { vi: "Arduino Proto Shield Rev3", en: "Arduino Proto Shield Rev3", ja: "Arduino Proto Shield Rev3" },
    category: "board",
    sub: "arduino",
    price: 150000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 32,
    image: "assets/arduino-proto-shield-rev3.png",
    imagePosition: "50% 50%",
    badge: { vi: "Prototype", en: "Prototype", ja: "プロトタイプ" },
    description: {
      vi: "Shield proto dành cho học tập, mô phỏng mạch và thử nghiệm linh kiện nhanh chóng.",
      en: "Prototype shield for electronics learning, quick circuit experiments, and component testing.",
      ja: "回路の学習や実験、部品テストに使えるプロトタイプシールド。"
    },
    isNew: true
  },
  {
    id: "adafruit-airlift-esp32",
    sku: "ST-BOARD-002",
    name: { vi: "Adafruit AirLift ESP32 WiFi Co-Processor", en: "Adafruit AirLift ESP32 WiFi Co-Processor", ja: "Adafruit AirLift ESP32 WiFi Co-Processor" },
    category: "board",
    sub: "esp32",
    price: 390000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 14,
    image: "assets/adafruit-airlift-shield-esp32-wifi-co-processor.png",
    imagePosition: "50% 50%",
    badge: { vi: "ESP32", en: "ESP32", ja: "ESP32" },
    description: {
      vi: "Module WiFi co-processor cho ESP32, phù hợp dự án IoT, cảm biến và hệ thống giám sát từ xa.",
      en: "ESP32 WiFi co-processor module for IoT projects, sensor systems, and remote monitoring.",
      ja: "IoTプロジェクト、センサーシステム、遠隔監視向けのESP32 WiFi共役モジュール。"
    },
    isNew: true
  },
  {
    id: "adafruit-2-8-tft-touch-shield",
    sku: "ST-BOARD-003",
    name: { vi: "Adafruit 2.8 inch TFT Touch Shield", en: "Adafruit 2.8 inch TFT Touch Shield", ja: "Adafruit 2.8 inch TFT Touch Shield" },
    category: "board",
    sub: "arduino",
    price: 560000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 9,
    image: "assets/adafruit-2-8-inch-tft-touch-shield-v2.png",
    imagePosition: "50% 50%",
    badge: { vi: "Màn hình", en: "Display", ja: "表示" },
    description: {
      vi: "Màn hình cảm ứng TFT giúp tạo giao diện người dùng cho ứng dụng Arduino và robot giáo dục.",
      en: "TFT touch display for Arduino dashboards, educational robots, and interactive interfaces.",
      ja: "Arduinoダッシュボードや教育用ロボット向けのTFTタッチ表示モジュール。"
    },
    isNew: false
  },
  {
    id: "adafruit-2-7-epaper-shield",
    sku: "ST-BOARD-004",
    name: { vi: "Adafruit 2.7 inch ePaper Shield", en: "Adafruit 2.7 inch ePaper Shield", ja: "Adafruit 2.7 inch ePaper Shield" },
    category: "board",
    sub: "arduino",
    price: 420000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 10,
    image: "assets/adafruit-2-7-tri-color-eink-epaper-shield-sram-red-black-white.png",
    imagePosition: "50% 50%",
    badge: { vi: "ePaper", en: "ePaper", ja: "ePaper" },
    description: {
      vi: "Shield ePaper tiết kiệm điện năng, phù hợp bảng thông tin, sản phẩm DIY và ứng dụng hiển thị nhàn rỗi.",
      en: "Low-power ePaper shield for signage, DIY projects, and low-refresh displays.",
      ja: "低消費電力のePaperシールドで、表示板やDIYプロジェクトに適しています。"
    },
    isNew: true
  },
  {
    id: "bme280-sensor-shield",
    sku: "ST-SEN-001",
    name: { vi: "Adafruit BME280 Sensor Shield", en: "Adafruit BME280 Sensor Shield", ja: "Adafruit BME280 Sensor Shield" },
    category: "sensors",
    sub: "temperature",
    price: 240000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 22,
    image: "assets/adafruit-bme280-shield.png",
    imagePosition: "50% 50%",
    badge: { vi: "Cảm biến", en: "Sensor", ja: "センサー" },
    description: {
      vi: "Cảm biến nhiệt độ, độ ẩm và áp suất cho hệ thống giám sát môi trường, nhà thông minh và lab.",
      en: "Temperature, humidity, and pressure sensor for environmental monitoring and smart lab systems.",
      ja: "温度、湿度、気圧を測る環境監視やスマートラボ向けのセンサー。"
    },
    isNew: true
  },
  {
    id: "gps-logger-shield",
    sku: "ST-SEN-002",
    name: { vi: "Adafruit GPS Logger Shield", en: "Adafruit GPS Logger Shield", ja: "Adafruit GPS Logger Shield" },
    category: "sensors",
    sub: "distance",
    price: 430000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 11,
    image: "assets/adafruit-gps-logger-shield-kit-v1-1.png",
    imagePosition: "50% 50%",
    badge: { vi: "GPS", en: "GPS", ja: "GPS" },
    description: {
      vi: "Shield GPS cho dự án định vị, lưu trữ tọa độ và giám sát vị trí theo thời gian thực.",
      en: "GPS shield for positioning, coordinate logging, and real-time location monitoring.",
      ja: "位置情報の記録やリアルタイム監視に使うGPSシールド。"
    },
    isNew: true
  },
  {
    id: "max485-module",
    sku: "ST-IND-001",
    name: { vi: "MAX485 Module RS485", en: "MAX485 RS485 Module", ja: "MAX485 RS485モジュール" },
    category: "industrial",
    sub: "relay",
    price: 78000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 41,
    image: "assets/max485.png",
    imagePosition: "50% 50%",
    badge: { vi: "RS485", en: "RS485", ja: "RS485" },
    description: {
      vi: "Mạch truyền nhận RS485 dùng cho đường dây dài, kết nối công nghiệp và hệ thống điều khiển.",
      en: "RS485 transceiver module for long-distance communication and industrial control systems.",
      ja: "長距離通信や産業制御向けのRS485トランシーバー。"
    },
    isNew: false
  },
  {
    id: "relay-shield-v3",
    sku: "ST-IND-002",
    name: { vi: "Relay Shield 4 kênh v3.0", en: "4-Channel Relay Shield v3.0", ja: "4チャンネル リレーシールド v3.0" },
    category: "industrial",
    sub: "relay",
    price: 260000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 23,
    image: "assets/relay-shield-v3-0.png",
    imagePosition: "50% 50%",
    badge: { vi: "Relay", en: "Relay", ja: "リレー" },
    description: {
      vi: "Shield relay 4 kênh phù hợp điều khiển đèn, quạt, máy bơm và mô hình tự động hóa mini.",
      en: "4-channel relay shield for controlling lights, fans, pumps, and mini automation systems.",
      ja: "照明、ファン、ポンプ、ミニ自動化向けの4チャンネルリレーシールド。"
    },
    isNew: true
  },
  {
    id: "arduino-4-relay-shield",
    sku: "ST-IND-003",
    name: { vi: "Arduino 4 Relay Shield", en: "Arduino 4 Relay Shield", ja: "Arduino 4 Relay Shield" },
    category: "industrial",
    sub: "relay",
    price: 220000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 21,
    image: "assets/arduino-4-relays-shield.png",
    imagePosition: "50% 50%",
    badge: { vi: "Relay", en: "Relay", ja: "リレー" },
    description: {
      vi: "Mạch relay 4 kênh giúp điều khiển tải điện cho mô hình tự động hóa và hệ thống cảnh báo.",
      en: "4-relay module for switching electrical loads in automation and alarm systems.",
      ja: "自動化や警報システムの負荷制御に使う4チャンネルリレー。"
    },
    isNew: false
  },
  {
    id: "rs485-shield-max3485",
    sku: "ST-IND-004",
    name: { vi: "RS485 Shield MAX3485", en: "RS485 Shield MAX3485", ja: "RS485 Shield MAX3485" },
    category: "industrial",
    sub: "relay",
    price: 180000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 27,
    image: "assets/rs485-shield-max3485-sp3485.png",
    imagePosition: "50% 50%",
    badge: { vi: "RS485", en: "RS485", ja: "RS485" },
    description: {
      vi: "Shield truyền dữ liệu RS485 với độ ổn định cao, phù hợp bộ điều khiển công nghiệp và máy móc.",
      en: "Stable RS485 communication shield for industrial controllers and machine interfaces.",
      ja: "産業用コントローラーや機械インターフェース向けの安定RS485シールド。"
    },
    isNew: false
  },
  {
    id: "can-bus-shield-v2",
    sku: "ST-IND-005",
    name: { vi: "CAN Bus Shield v2 MCP2515", en: "CAN Bus Shield v2 MCP2515", ja: "CAN Bus Shield v2 MCP2515" },
    category: "industrial",
    sub: "mini-plc",
    price: 510000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 9,
    image: "assets/can-bus-shield-v2-mcp2515-mcp2551.png",
    imagePosition: "50% 50%",
    badge: { vi: "CAN", en: "CAN", ja: "CAN" },
    description: {
      vi: "Shield CAN bus cho xe tự động hóa, robot công nghiệp và hệ thống điều khiển mạng.",
      en: "CAN bus shield for autonomous vehicles, industrial robots, and networked control systems.",
      ja: "自動運転車両、産業用ロボット、ネットワーク制御システム向けCANバスシールド。"
    },
    isNew: true
  },
  {
    id: "sn65hvd230-can-module",
    sku: "ST-IND-006",
    name: { vi: "SN65HVD230 CAN Transceiver", en: "SN65HVD230 CAN Transceiver", ja: "SN65HVD230 CANトランシーバー" },
    category: "industrial",
    sub: "mini-plc",
    price: 120000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 31,
    image: "assets/sn65hvd230.png",
    imagePosition: "50% 50%",
    badge: { vi: "CAN", en: "CAN", ja: "CAN" },
    description: {
      vi: "Module CAN transceiver cho truyền tải dữ liệu đáng tin cậy trong hệ thống công nghiệp.",
      en: "CAN transceiver module for reliable data transfer in industrial systems.",
      ja: "産業システムでの信頼性の高いデータ伝送向けCANトランシーバー。"
    },
    isNew: false
  },
  {
    id: "robot-servo-shield",
    sku: "ST-ROB-001",
    name: { vi: "Adafruit 16 Ch PWM Servo Shield", en: "Adafruit 16-Channel PWM Servo Shield", ja: "Adafruit 16ch PWMサーボシールド" },
    category: "robot",
    sub: "servo",
    price: 690000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 8,
    image: "assets/adafruit-16-channel-pwm-servo-shield.png",
    imagePosition: "50% 50%",
    badge: { vi: "Servo", en: "Servo", ja: "サーボ" },
    description: {
      vi: "Shield điều khiển nhiều servo cùng lúc, lý tưởng cho robot cánh tay, chân máy và mô hình cơ khí.",
      en: "Multi-servo controller shield ideal for robotic arms, legs, and mechanical models.",
      ja: "ロボットアームや機械モデル向けの多サーボ制御シールド。"
    },
    isNew: true
  },
  {
    id: "stepper-motor-shield",
    sku: "ST-ROB-002",
    name: { vi: "Adafruit Motor Stepper Servo Shield", en: "Adafruit Motor Stepper Servo Shield", ja: "Adafruit Motor Stepper Servo Shield" },
    category: "robot",
    sub: "motor",
    price: 620000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 7,
    image: "assets/adafruit-motor-stepper-servo-shield-v2.png",
    imagePosition: "50% 50%",
    badge: { vi: "Motor", en: "Motor", ja: "モーター" },
    description: {
      vi: "Shield điều khiển động cơ bước và servo cho robot, máy in 3D và mô hình cơ điện.",
      en: "Stepper and servo motor control shield for robots, 3D printers, and mechatronic models.",
      ja: "ロボット、3Dプリンター、機械モデル向けのステッパーとサーボ制御シールド。"
    },
    isNew: true
  },
  {
    id: "pcf8574-io-expander",
    sku: "ST-IC-001",
    name: { vi: "PCF8574 I/O Expander", en: "PCF8574 I/O Expander", ja: "PCF8574 I/Oエキスパンダー" },
    category: "ics",
    sub: "logic-ic",
    price: 95000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 36,
    image: "assets/PCF8574.png",
    imagePosition: "50% 50%",
    badge: { vi: "IC", en: "IC", ja: "IC" },
    description: {
      vi: "Mạch mở rộng chân GPIO cho Arduino, ESP32 và board nhúng cần nhiều đầu vào/ra hơn.",
      en: "GPIO expander for Arduino, ESP32, and embedded boards requiring additional I/O pins.",
      ja: "Arduino、ESP32、組み込みボードのGPIOを拡張するI/Oエキスパンダー。"
    },
    isNew: false
  },
  {
    id: "w5100-ethernet-module",
    sku: "ST-BOARD-005",
    name: { vi: "W5100 Ethernet Module", en: "W5100 Ethernet Module", ja: "W5100 Ethernetモジュール" },
    category: "board",
    sub: "arduino",
    price: 240000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 18,
    image: "assets/w5100.png",
    imagePosition: "50% 50%",
    badge: { vi: "Ethernet", en: "Ethernet", ja: "Ethernet" },
    description: {
      vi: "Module Ethernet W5100 giúp các dự án Arduino và ESP32 kết nối internet và truyền dữ liệu ổn định.",
      en: "W5100 Ethernet module for Arduino and ESP32 projects requiring stable internet connectivity.",
      ja: "ArduinoやESP32のインターネット接続と安定したデータ通信に使うEthernetモジュール。"
    },
    isNew: false
  },
  {
    id: "gravity-1602-lcd-shield",
    sku: "ST-BOARD-006",
    name: { vi: "Gravity 1602 LCD Keypad Shield", en: "Gravity 1602 LCD Keypad Shield", ja: "Gravity 1602 LCDキーパッドシールド" },
    category: "board",
    sub: "arduino",
    price: 160000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 32,
    image: "assets/gravity-1602-lcd-keypad-shield-arduino.png",
    imagePosition: "50% 50%",
    badge: { vi: "LCD", en: "LCD", ja: "LCD" },
    description: {
      vi: "Shield LCD keypad tiện dụng cho menu điều khiển, hiển thị trạng thái và demo giáo dục.",
      en: "LCD keypad shield for menu control, status display, and educational demos.",
      ja: "メニュー制御、状態表示、教育デモ用のLCDキーパッドシールド。"
    },
    isNew: false
  },
  {
    id: "arduino-ethernet-shield-2",
    sku: "ST-BOARD-007",
    name: { vi: "Arduino Ethernet Shield 2", en: "Arduino Ethernet Shield 2", ja: "Arduino Ethernet Shield 2" },
    category: "board",
    sub: "arduino",
    price: 350000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 12,
    image: "assets/arduino-ethernet-shield-2.png",
    imagePosition: "50% 50%",
    badge: { vi: "Ethernet", en: "Ethernet", ja: "Ethernet" },
    description: {
      vi: "Shield Ethernet giúp Arduino kết nối mạng LAN và dễ dàng tích hợp với hệ thống IoT.",
      en: "Ethernet shield for Arduino networking and IoT integration over a local LAN.",
      ja: "ArduinoのLAN接続とIoT統合に使うEthernetシールド。"
    },
    isNew: false
  },
  {
    id: "wifi-debug-board",
    sku: "ST-BOARD-008",
    name: { vi: "Adafruit FeatherWing OLED 128x64", en: "Adafruit FeatherWing OLED 128x64", ja: "Adafruit FeatherWing OLED 128x64" },
    category: "board",
    sub: "arduino",
    price: 180000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 28,
    image: "assets/adafruit-featherwing-oled-128x64-oled-add-on-feather-stemma-qt-qwiic.png",
    imagePosition: "50% 50%",
    badge: { vi: "OLED", en: "OLED", ja: "OLED" },
    description: {
      vi: "Màn hình OLED mini giúp hiển thị trạng thái hệ thống, số liệu và menu nhắn tin đơn giản.",
      en: "Compact OLED display for system status, metrics, and simple menu interfaces.",
      ja: "システム状態や簡単なメニュー表示に使う小型OLEDディスプレイ。"
    },
    isNew: false
  },
  {
    id: "lora-sx1276-shield",
    sku: "ST-BOARD-009",
    name: { vi: "LoRa SX1276 SX1278 Shield", en: "LoRa SX1276 SX1278 Shield", ja: "LoRa SX1276 SX1278 Shield" },
    category: "board",
    sub: "esp32",
    price: 490000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 13,
    image: "assets/lora-sx1276-sx1278-rfm95-3-3v-logic-shield.png",
    imagePosition: "50% 50%",
    badge: { vi: "LoRa", en: "LoRa", ja: "LoRa" },
    description: {
      vi: "Shield truyền thông LoRa dành cho cảm biến xa, hệ thống giám sát và mạng cảm biến không dây.",
      en: "LoRa communication shield for remote sensors, monitoring systems, and wireless networks.",
      ja: "遠隔センサーや監視システム向けのLoRa通信シールド。"
    },
    isNew: true
  },
  {
    id: "neopixel-rgb-shield",
    sku: "ST-BOARD-010",
    name: { vi: "Adafruit NeoPixel Shield 40 LED", en: "Adafruit NeoPixel Shield 40 LED", ja: "Adafruit NeoPixel Shield 40 LED" },
    category: "board",
    sub: "arduino",
    price: 260000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 19,
    image: "assets/adafruit-neopixel-shield-arduino-40-rgb-led-pixel-matrix.png",
    imagePosition: "50% 50%",
    badge: { vi: "LED", en: "LED", ja: "LED" },
    description: {
      vi: "Shield đèn LED RGB để tạo hiệu ứng ánh sáng, demo STEM và trang trí mô hình sáng tạo.",
      en: "RGB LED shield for lighting effects, STEM demos, and creative visual displays.",
      ja: "照明効果やSTEMデモ、クリエイティブ表示に使うRGB LEDシールド。"
    },
    isNew: true
  },
  {
    id: "data-logging-shield",
    sku: "ST-BOARD-011",
    name: { vi: "Adafruit Data Logging Shield", en: "Adafruit Data Logging Shield", ja: "Adafruit Data Logging Shield" },
    category: "board",
    sub: "arduino",
    price: 310000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 16,
    image: "assets/adafruit-assembled-data-logging-shield.png",
    imagePosition: "50% 50%",
    badge: { vi: "Lưu dữ liệu", en: "Logging", ja: "記録" },
    description: {
      vi: "Shield ghi dữ liệu với RTC và thẻ nhớ, phù hợp đo nhiệt độ, lưu nhật ký và dự án lab.",
      en: "Data logging shield with RTC and memory card support for lab and monitoring projects.",
      ja: "RTCとメモリーカード対応のデータロギングシールド。"
    },
    isNew: false
  },
  {
    id: "rtc-ds3231-module",
    sku: "ST-BOARD-012",
    name: { vi: "Adafruit DS3231 Precision RTC", en: "Adafruit DS3231 Precision RTC", ja: "Adafruit DS3231 Precision RTC" },
    category: "board",
    sub: "arduino",
    price: 210000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 18,
    image: "assets/adafruit-ds3231-precision-rtc.png",
    imagePosition: "50% 50%",
    badge: { vi: "RTC", en: "RTC", ja: "RTC" },
    description: {
      vi: "Mạch đồng hồ thời gian thực chính xác, hỗ trợ ghi thời gian và xử lý điều khiển theo thời điểm.",
      en: "Accurate real-time clock module for time-stamping and scheduled control operations.",
      ja: "時刻管理とスケジュール制御に使う高精度RTCモジュール。"
    },
    isNew: false
  },
  {
    id: "stem-iot-banner-sample",
    sku: "ST-BANNER-001",
    name: { vi: "STEM IoT Banner", en: "STEM IoT Banner", ja: "STEM IoTバナー" },
    category: "board",
    sub: "esp32",
    price: 99000,
    unit: { vi: "Cái", en: "pc", ja: "個" },
    inventory: 20,
    image: "assets/stem-iot-banner.png",
    imagePosition: "50% 50%",
    badge: { vi: "Banner", en: "Banner", ja: "バナー" },
    description: {
      vi: "Hình banner mẫu cho trang web, quảng cáo sản phẩm và trình diễn dự án STEM IoT.",
      en: "Sample banner image for product showcases, campaign pages, and STEM IoT presentations.",
      ja: "商品紹介やSTEM IoTプロジェクトのデモ用サンプルバナー。"
    },
    isNew: true
  }
];

// ============== SEED DATA VALIDATION ==============
function normalizeSeedProduct(p) {
  const normI18n = (val, fallback = '') => {
    if (!val) return { vi: fallback, en: fallback, ja: fallback };
    if (typeof val === 'string') return { vi: val, en: val, ja: val };
    return {
      vi: val.vi || fallback,
      en: val.en || val.vi || fallback,
      ja: val.ja || val.vi || fallback
    };
  };

  return {
    id: String(p.id || genStoreId('p')),
    sku: String(p.sku || 'ST-000'),
    name: normI18n(p.name, 'Sản phẩm'),
    category: p.category || 'board',
    sub: p.sub || '',
    price: Number(p.price) || 0,
    unit: normI18n(p.unit, 'Cái'),
    inventory: Math.max(0, p.inventory != null ? Number(p.inventory) : (p.stock != null ? Number(p.stock) : 0)),
    image: p.image || 'assets/stem-iot-banner.png',
    imagePosition: p.imagePosition || '50% 50%',
    badge: normI18n(p.badge, 'Mới'),
    description: normI18n(p.description, ''),
    isNew: !!p.isNew,
    sold: Math.max(0, Number(p.sold) || 0),
    hidden: !!p.hidden
  };
}

// ============== URL HÌNH ẢNH ĐỒNG BỘ TRANG CHỦ VÀ ADMIN ==============
function getStoreImageUrl(path, isAdmin = false) {
  if (!path) return isAdmin ? '../assets/stem-iot-banner.png' : 'assets/stem-iot-banner.png';
  if (/^(https?:|\/\/|data:)/i.test(path)) return path;
  const clean = String(path).replace(/^(\.\.\/|\.\/)+/, '');
  return isAdmin ? ('../' + clean) : clean;
}

// ============== BROADCAST CHANNEL ĐỒNG BỘ ĐA TAB ==============
var _storeBroadcastChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    _storeBroadcastChannel = new BroadcastChannel('stem_store_sync_channel');
    _storeBroadcastChannel.onmessage = function (event) {
      try {
        window.dispatchEvent(new CustomEvent('store-changed', { detail: event.data }));
      } catch (e) { /* noop */ }
    };
  }
} catch (e) { /* noop */ }

function notifyStoreChanged(detail = 'store-updated') {
  try {
    window.dispatchEvent(new CustomEvent('store-changed', { detail }));
  } catch (e) { /* noop */ }
  try {
    if (_storeBroadcastChannel) {
      _storeBroadcastChannel.postMessage({
        type: 'store-changed',
        detail,
        timestamp: Date.now()
      });
    }
  } catch (e) { /* noop */ }
}

// ============== API DÙNG CHUNG ==============
function getStoreProducts() {
  const seeded = localStorage.getItem(STORE_KEYS.seeded);
  const stored = readJSON(STORE_KEYS.products, null);
  if (!seeded || !Array.isArray(stored)) {
    const seed = SEED_PRODUCTS.map(normalizeSeedProduct);
    writeJSON(STORE_KEYS.products, seed);
    localStorage.setItem(STORE_KEYS.seeded, '1');
    return seed;
  }
  return stored.map(normalizeSeedProduct);
}

function saveStoreProducts(list, shouldNotify = true) {
  writeJSON(STORE_KEYS.products, list.map(normalizeSeedProduct));
  if (shouldNotify) notifyStoreChanged('products-saved');
}

function getStoreCart() {
  const c = readJSON(STORE_KEYS.cart, []);
  return Array.isArray(c) ? c : [];
}

function saveStoreCart(cart, shouldNotify = true) {
  writeJSON(STORE_KEYS.cart, Array.isArray(cart) ? cart : []);
  if (shouldNotify) notifyStoreChanged('cart-saved');
}

function getStoreOrders() {
  const list = readJSON(STORE_KEYS.orders, []);
  return Array.isArray(list) ? list : [];
}

function saveStoreOrders(list, shouldNotify = true) {
  writeJSON(STORE_KEYS.orders, Array.isArray(list) ? list : []);
  if (shouldNotify) notifyStoreChanged('orders-saved');
}

function getStoreUsers() {
  const list = readJSON(STORE_KEYS.users, []);
  return Array.isArray(list) ? list : [];
}

function saveStoreUsers(list, shouldNotify = true) {
  writeJSON(STORE_KEYS.users, Array.isArray(list) ? list : []);
  if (shouldNotify) notifyStoreChanged('users-saved');
}

// ============== ĐỒNG BỘ KHÁCH HÀNG THEO TỔNG ĐƠN HÀNG THẬT ==============
function syncStoreUsersFromOrders() {
  const orders = getStoreOrders().filter((o) => o.status !== 'cancelled');
  const users = getStoreUsers();

  users.forEach((u) => {
    const userOrders = orders.filter(
      (o) =>
        (u.phone && String(o.phone).trim() === String(u.phone).trim()) ||
        (u.email && o.email && u.email.toLowerCase() === o.email.toLowerCase())
    );
    u.orderCount = userOrders.length;
    u.spent = userOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    if (userOrders.length > 0) {
      u.lastOrderAt = Math.max(...userOrders.map((o) => o.createdAt || 0));
    }
    // Tự động nâng hạng VIP nếu tổng chi tiêu đạt từ 2.000.000đ trở lên
    if (u.role === 'customer' && u.spent >= 2000000) {
      u.role = 'vip';
    }
  });

  saveStoreUsers(users, false);
}

// ============== TẠO ĐƠN HÀNG THẬT ==============
// Dùng bởi trang chủ (checkout) và admin (tạo đơn)
function placeStoreOrder(customerInfo, items) {
  const name = (customerInfo.customer || customerInfo.name || '').trim();
  const phone = (customerInfo.phone || '').trim();
  const address = (customerInfo.address || '').trim();
  const email = (customerInfo.email || '').trim();

  if (!name || !phone) {
    return { ok: false, message: 'Vui lòng nhập đủ họ tên và số điện thoại.' };
  }

  const products = getStoreProducts();
  const orderItems = [];
  let subtotal = 0;

  for (const raw of items) {
    const p = products.find((x) => x.id === raw.id || x.id === raw.productId);
    if (!p) continue;
    const qty = Math.max(1, parseInt(raw.qty, 10) || 1);
    if (p.inventory < qty) {
      const pName = typeof p.name === 'string' ? p.name : (p.name?.vi || p.sku);
      return { ok: false, message: 'Sản phẩm "' + pName + '" chỉ còn ' + p.inventory + ' sản phẩm.' };
    }
    orderItems.push({
      productId: p.id,
      name: p.name,
      price: p.price,
      qty,
      image: p.image
    });
    subtotal += p.price * qty;
  }

  if (orderItems.length === 0) {
    return { ok: false, message: 'Giỏ hàng trống hoặc sản phẩm không còn tồn tại.' };
  }

  // Phí giao hàng: Miễn phí nếu từ 500.000đ trở lên, dưới 500.000đ là 30.000đ
  const shipping = subtotal > 0 && subtotal < 500000 ? 30000 : 0;
  const total = subtotal + shipping;

  const orders = getStoreOrders();
  const order = {
    id: nextStoreOrderId(orders),
    customer: name,
    phone,
    email,
    address,
    items: orderItems,
    subtotal,
    shipping,
    total,
    status: customerInfo.status || 'pending',
    payment: customerInfo.payment || 'unpaid',
    createdAt: Date.now()
  };

  // Trừ tồn kho thật cho từng sản phẩm
  for (const it of orderItems) {
    const p = products.find((x) => x.id === it.productId);
    if (p) {
      p.inventory = Math.max(0, p.inventory - it.qty);
    }
  }

  orders.push(order);
  recalcStoreSold(products, orders);

  saveStoreOrders(orders, false);
  saveStoreProducts(products, false);
  upsertStoreUser(order);
  syncStoreUsersFromOrders();

  notifyStoreChanged('order-placed');
  return { ok: true, order, message: 'Đặt hàng thành công.' };
}

// ============== CẬP NHẬT TRẠNG THÁI / HỦY / XÓA ĐƠN ==============
function cancelStoreOrder(orderId) {
  const orders = getStoreOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, message: 'Đơn hàng không tồn tại' };
  if (order.status === 'cancelled') return { ok: false, message: 'Đơn hàng này đã bị hủy trước đó' };

  const products = getStoreProducts();
  // Hoàn trả số lượng vào kho cho từng sản phẩm
  for (const it of order.items) {
    const p = products.find((x) => x.id === (it.productId || it.id));
    if (p) {
      p.inventory += Number(it.qty) || 1;
    }
  }

  order.status = 'cancelled';
  if (order.payment === 'paid') {
    order.payment = 'refunded';
  }

  recalcStoreSold(products, orders);
  saveStoreOrders(orders, false);
  saveStoreProducts(products, false);
  syncStoreUsersFromOrders();

  notifyStoreChanged('order-cancelled');
  return { ok: true, order, message: 'Đã hủy đơn hàng và hoàn trả tồn kho thành công.' };
}

function updateStoreOrderStatus(orderId, newStatus) {
  const orders = getStoreOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, message: 'Không tìm thấy đơn hàng' };

  order.status = newStatus;
  saveStoreOrders(orders, false);
  notifyStoreChanged('order-status-updated');
  return { ok: true, order };
}

function updateStoreOrderPayment(orderId, newPayment) {
  const orders = getStoreOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, message: 'Không tìm thấy đơn hàng' };

  order.payment = newPayment;
  saveStoreOrders(orders, false);
  notifyStoreChanged('order-payment-updated');
  return { ok: true, order };
}

function deleteStoreOrder(orderId) {
  let orders = getStoreOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order) return { ok: false, message: 'Không tìm thấy đơn hàng' };

  orders = orders.filter((o) => o.id !== orderId);
  const products = getStoreProducts();
  recalcStoreSold(products, orders);

  saveStoreOrders(orders, false);
  saveStoreProducts(products, false);
  syncStoreUsersFromOrders();

  notifyStoreChanged('order-deleted');
  return { ok: true };
}

// Cập nhật sold (đã bán) cho từng sản phẩm = tổng số lượng trong các đơn KHÔNG bị hủy
function recalcStoreSold(products, orders) {
  const valid = orders.filter((o) => o.status !== 'cancelled');
  products.forEach((p) => {
    p.sold = valid.reduce(
      (s, o) => s + o.items.filter((i) => (i.productId || i.id) === p.id).reduce((a, i) => a + (Number(i.qty) || 0), 0),
      0
    );
  });
}

// Tự tạo/cập nhật khách hàng khi có đơn hàng mới
function upsertStoreUser(order) {
  const users = getStoreUsers();
  const existing = users.find(
    (u) =>
      (order.phone && u.phone && String(u.phone).trim() === String(order.phone).trim()) ||
      (order.email && u.email && u.email.toLowerCase() === order.email.toLowerCase())
  );

  if (existing) {
    existing.name = order.customer || existing.name;
    existing.email = order.email || existing.email;
    existing.phone = order.phone || existing.phone;
    saveStoreUsers(users, false);
    return existing;
  }

  const user = {
    id: genStoreId('u'),
    name: order.customer,
    email: order.email || '',
    phone: order.phone,
    role: 'customer',
    status: 'active',
    spent: order.total,
    orderCount: 1,
    lastOrderAt: order.createdAt,
    createdAt: order.createdAt
  };
  users.push(user);
  saveStoreUsers(users, false);
  return user;
}

function nextStoreOrderId(orders) {
  const maxNum = (orders || []).reduce((m, o) => {
    const n = parseInt(String(o.id).split('-').pop(), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  return 'ORD-' + String(maxNum + 1).padStart(4, '0');
}

function genStoreId(prefix = 'id') {
  return prefix + String(Date.now()).slice(-8) + Math.random().toString(36).slice(2, 5);
}

// ============== RESET TOÀN BỘ DỮ LIỆU ==============
// Trả về seed ban đầu (dùng bởi nút Reset của admin)
function resetStore() {
  [STORE_KEYS.products, STORE_KEYS.orders, STORE_KEYS.users, STORE_KEYS.cart, STORE_KEYS.seeded].forEach((k) =>
    localStorage.removeItem(k)
  );
  getStoreProducts(); // re-seed
  saveStoreOrders([], false);
  saveStoreUsers([], false);
  saveStoreCart([], false);
  notifyStoreChanged('reset');
}
