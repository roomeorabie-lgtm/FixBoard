export interface Brand {
  id: string;
  name: string;
  nameAr?: string;
  logoUrl?: string;
  country?: string;
  order?: number;
  createdAt: number;
}

export interface Series {
  id: string;
  brandId: string;
  name: string;
  description?: string;
  createdAt: number;
}

export interface DeviceModel {
  id: string;
  brandId: string;
  seriesId: string;
  name: string;
  modelCode: string; // e.g., SM-S911B, A2894
  releaseYear?: number;
  imageUrl?: string;
  description?: string;
  specsSummary?: string;
  createdAt: number;
}

export interface Board {
  id: string;
  modelId: string;
  name: string; // e.g. Main Board (Top/Sub), Sub Board
  version?: string; // e.g. Rev 1.0, Rev 2.1
  partNumber?: string;
  boardSideAImage?: string; // High-res image/render of top side
  boardSideBImage?: string; // High-res image/render of bottom side
  widthMm?: number;
  heightMm?: number;
  createdAt: number;
}

export type ComponentType = 
  | 'IC'          // Integrated Circuit (Uxxx)
  | 'RESISTOR'    // Rxxx
  | 'CAPACITOR'   // Cxxx
  | 'INDUCTOR'    // Lxxx
  | 'DIODE'       // Dxxx
  | 'TRANSISTOR'  // Qxxx
  | 'CONNECTOR'   // Jxxx
  | 'TEST_POINT'  // TPxxx
  | 'CRYSTAL'     // Yxxx
  | 'FUSE'        // Fxxx
  | 'SWITCH'      // SWxxx
  | 'FILTER'      // FLxxx
  | 'OTHER';

export interface BoardPin {
  id: string; // e.g. "1", "A1", "GND"
  name?: string; // e.g. "VBUS_IN", "SDA_I2C"
  netName: string; // The electrical net this pin connects to, e.g. "PP_VDD_MAIN"
  x: number; // coordinate relative to component (or board)
  y: number;
  isGnd?: boolean;
  isPower?: boolean;
}

export interface BoardComponent {
  id: string; // Unique doc ID
  boardId: string;
  refDes: string; // e.g. U1001, C204, TP12, R401
  type: ComponentType;
  name?: string; // e.g., Power Management IC (PMIC), Audio Codec
  partNumber?: string; // e.g., PM8150, WCD9385
  package?: string; // BGA-152, 0201, 0402, QFN-32
  layer: 'TOP' | 'BOTTOM';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // degrees
  value?: string; // e.g. 10uF 6.3V, 100k ohm, 1.2V
  description?: string;
  diodeModeValue?: string; // e.g. 0.425 V
  resistanceValue?: string;
  voltageValue?: string; // e.g. 3.8V VBAT
  pins?: BoardPin[];
  connectedNets?: string[];
  troubleshootingNotes?: string;
}

export interface ConnectionNet {
  id: string;
  boardId: string;
  name: string; // e.g., "VBUS_5V", "PP_VDD_MAIN", "I2C3_SCL", "BAT_SENSE", "GND"
  voltage?: string; // e.g., "4.2V", "1.8V"
  type: 'POWER' | 'GROUND' | 'SIGNAL' | 'DATA' | 'CLOCK' | 'RF';
  color?: string;
  points: {
    x: number;
    y: number;
    layer: 'TOP' | 'BOTTOM';
    refDes?: string;
    pin?: string;
  }[];
  traces?: {
    layer: 'TOP' | 'BOTTOM';
    path: [number, number][];
  }[];
  description?: string;
}

export interface SchematicDoc {
  id: string;
  modelId: string;
  boardId?: string;
  title: string;
  category: 'SCHEMATIC_PDF' | 'SERVICE_MANUAL' | 'BLOCK_DIAGRAM' | 'PINOUT' | 'REPAIR_GUIDE';
  fileUrl: string;
  pageCount?: number;
  version?: string;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  phoneNumber: string;
  displayName: string;
  role: 'admin' | 'technician' | 'user';
  workshopName?: string;
  avatarUrl?: string;
  createdAt: number;
}

export interface UserFavorite {
  id: string;
  userId: string;
  type: 'MODEL' | 'BOARD' | 'COMPONENT';
  targetId: string;
  title: string;
  subtitle?: string;
  brandName?: string;
  createdAt: number;
}

export interface UserHistoryItem {
  id: string;
  userId: string;
  modelId: string;
  modelName: string;
  brandName: string;
  boardId: string;
  boardName: string;
  viewedAt: number;
}

export interface GlobalSearchResult {
  type: 'MODEL' | 'COMPONENT' | 'NET' | 'TEST_POINT' | 'IC';
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  brandName?: string;
  modelName?: string;
  boardId?: string;
  componentRef?: string;
  netName?: string;
}
