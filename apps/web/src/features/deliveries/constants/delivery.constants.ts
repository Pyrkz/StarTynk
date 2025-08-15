// Define enums locally if not available from Prisma client
export enum DeliveryStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  QUALITY_CHECK = 'QUALITY_CHECK',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export enum DeliveryType {
  BULK = 'BULK',
  PALLET = 'PALLET',
  PACKAGE = 'PACKAGE',
  OVERSIZED = 'OVERSIZED',
  MIXED = 'MIXED'
}

export enum ItemQualityStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  DAMAGED = 'DAMAGED',
  DEFECTIVE = 'DEFECTIVE',
  REJECTED = 'REJECTED',
  PARTIALLY_APPROVED = 'PARTIALLY_APPROVED'
}

export enum DeliveryPhotoType {
  ARRIVAL = 'ARRIVAL',
  UNLOADING = 'UNLOADING',
  MATERIALS = 'MATERIALS',
  DAMAGE = 'DAMAGE',
  QUALITY_CHECK = 'QUALITY_CHECK',
  COMPLETION = 'COMPLETION',
  WZ_DOCUMENT = 'WZ_DOCUMENT',
  INVOICE = 'INVOICE',
  GENERAL = 'GENERAL'
}

export enum DeliveryPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
  CRITICAL = 'CRITICAL'
}
import type {
  DeliveryStatusColor,
  DeliveryTypeIcon,
  ItemQualityStatusColor,
  DeliveryTimeSlot
} from '../types/delivery.types'

// ============== STATUS MAPPINGS ==============

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  PENDING: 'Oczekująca',
  RECEIVED: 'Odebrana',
  QUALITY_CHECK: 'Kontrola jakości',
  ACCEPTED: 'Przyjęta',
  REJECTED: 'Odrzucona'
}

export const DELIVERY_STATUS_COLORS: DeliveryStatusColor = {
  PENDING: 'neutral',
  RECEIVED: 'primary',
  QUALITY_CHECK: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'error'
}

export const DELIVERY_STATUS_DESCRIPTIONS: Record<DeliveryStatus, string> = {
  PENDING: 'Dostawa oczekuje na odbiór',
  RECEIVED: 'Dostawa została odebrana',
  QUALITY_CHECK: 'Trwa kontrola jakości materiałów',
  ACCEPTED: 'Wszystkie materiały zostały przyjęte',
  REJECTED: 'Dostawa została odrzucona'
}

// ============== DELIVERY TYPE MAPPINGS ==============

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  BULK: 'Luzem',
  PALLET: 'Paleta',
  PACKAGE: 'Paczka',
  OVERSIZED: 'Ponadgabaryt',
  MIXED: 'Mieszana'
}

export const DELIVERY_TYPE_ICONS: DeliveryTypeIcon = {
  BULK: 'Truck',
  PALLET: 'Package',
  PACKAGE: 'Package2',
  OVERSIZED: 'Container',
  MIXED: 'Boxes'
}

export const DELIVERY_TYPE_DESCRIPTIONS: Record<DeliveryType, string> = {
  BULK: 'Materiały sypkie (piasek, żwir, tynk)',
  PALLET: 'Towary na paletach standardowych i niestandardowych',
  PACKAGE: 'Małe paczki, narzędzia, drobne materiały',
  OVERSIZED: 'Duże elementy wymagające specjalnej obsługi',
  MIXED: 'Dostawa zawierająca różne typy materiałów'
}

// ============== QUALITY STATUS MAPPINGS ==============

export const ITEM_QUALITY_STATUS_LABELS: Record<ItemQualityStatus, string> = {
  PENDING: 'Oczekująca',
  APPROVED: 'Zatwierdzona',
  DAMAGED: 'Uszkodzona',
  DEFECTIVE: 'Wadliwa',
  REJECTED: 'Odrzucona',
  PARTIALLY_APPROVED: 'Częściowo zatwierdzona'
}

export const ITEM_QUALITY_STATUS_COLORS: ItemQualityStatusColor = {
  PENDING: 'neutral',
  APPROVED: 'success',
  DAMAGED: 'warning',
  DEFECTIVE: 'error',
  REJECTED: 'error',
  PARTIALLY_APPROVED: 'warning'
}

// ============== PHOTO TYPE MAPPINGS ==============

export const DELIVERY_PHOTO_TYPE_LABELS: Record<DeliveryPhotoType, string> = {
  ARRIVAL: 'Przyjazd pojazdu',
  UNLOADING: 'Rozładunek',
  MATERIALS: 'Stan materiałów',
  DAMAGE: 'Dokumentacja uszkodzeń',
  QUALITY_CHECK: 'Kontrola jakości',
  COMPLETION: 'Zakończenie dostawy',
  WZ_DOCUMENT: 'Dokument WZ',
  INVOICE: 'Faktura',
  GENERAL: 'Ogólne'
}

// ============== PRIORITY MAPPINGS ==============

export const DELIVERY_PRIORITY_LABELS: Record<DeliveryPriority, string> = {
  LOW: 'Niski',
  NORMAL: 'Normalny',
  HIGH: 'Wysoki',
  URGENT: 'Pilny',
  CRITICAL: 'Krytyczny'
}

export const DELIVERY_PRIORITY_COLORS: Record<DeliveryPriority, 'primary' | 'success' | 'warning' | 'error' | 'neutral'> = {
  LOW: 'neutral',
  NORMAL: 'primary',
  HIGH: 'warning',
  URGENT: 'error',
  CRITICAL: 'error'
}

// ============== TIME SLOTS ==============

export const DEFAULT_TIME_SLOTS: DeliveryTimeSlot[] = [
  {
    id: 'morning',
    label: 'Rano (08:00-12:00)',
    startTime: '08:00',
    endTime: '12:00',
    maxDeliveries: 5,
    currentBookings: 0,
    available: true
  },
  {
    id: 'afternoon',
    label: 'Popołudnie (12:00-16:00)',
    startTime: '12:00',
    endTime: '16:00',
    maxDeliveries: 5,
    currentBookings: 0,
    available: true
  },
  {
    id: 'evening',
    label: 'Wieczór (16:00-18:00)',
    startTime: '16:00',
    endTime: '18:00',
    maxDeliveries: 3,
    currentBookings: 0,
    available: true
  }
]

// ============== MEASUREMENT UNITS ==============

export const MEASUREMENT_UNITS = [
  'szt', 'kg', 'g', 't', 'm', 'm2', 'm3', 'l', 'ml',
  'opak', 'pal', 'worek', 'pud', 'bal', 'rol', 'ark'
] as const

export const WEIGHT_UNITS = ['kg', 'g', 't'] as const
export const VOLUME_UNITS = ['m3', 'l', 'ml'] as const
export const LENGTH_UNITS = ['m', 'cm', 'mm'] as const
export const AREA_UNITS = ['m2', 'cm2'] as const

// ============== VEHICLE TYPES ==============

export const VEHICLE_TYPES = [
  'Ciężarówka',
  'Dostawczy',
  'Przyczepa',
  'HDS',
  'Betoniarka',
  'Wywrotka',
  'Platforma',
  'Kontener',
  'Inne'
] as const

// ============== WAREHOUSE SECTIONS ==============

export const WAREHOUSE_SECTIONS = [
  'A - Materiały sypkie',
  'B - Materiały płytowe',
  'C - Narzędzia i akcesoria',
  'D - Izolacje',
  'E - Instalacje',
  'F - Wykończenie',
  'G - Chemia budowlana',
  'H - Tymczasowy',
  'I - Odbiór jakości',
  'J - Odrzucone'
] as const

// ============== FORM VALIDATION ==============

export const DELIVERY_FORM_VALIDATION = {
  supplierName: {
    minLength: 2,
    maxLength: 100,
    required: true
  },
  deliveryDate: {
    required: true,
    minDate: new Date() // Can't schedule in the past
  },
  totalWeight: {
    min: 0,
    max: 50000 // 50 tons
  },
  totalVolume: {
    min: 0,
    max: 1000 // 1000 m3
  },
  palletCount: {
    min: 0,
    max: 100
  },
  packageCount: {
    min: 0,
    max: 1000
  },
  deliveryCost: {
    min: 0,
    max: 1000000
  },
  item: {
    itemName: {
      minLength: 2,
      maxLength: 200,
      required: true
    },
    orderedQuantity: {
      min: 0,
      required: true
    },
    deliveredQuantity: {
      min: 0,
      required: true
    },
    unitPrice: {
      min: 0
    }
  }
} as const

// ============== DEFAULT VALUES ==============

export const DEFAULT_DELIVERY_VALUES = {
  currency: 'PLN',
  deliveryType: DeliveryType.PACKAGE,
  status: DeliveryStatus.PENDING,
  qualityCheckRequired: false,
  priority: DeliveryPriority.NORMAL
} as const

// ============== PAGINATION ==============

export const DELIVERY_PAGINATION = {
  defaultLimit: 20,
  maxLimit: 100,
  limitOptions: [10, 20, 50, 100]
} as const

// ============== FILE UPLOAD ==============

export const PHOTO_UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxFilesPerDelivery: 50,
  compressionQuality: 0.8
} as const

// ============== PERMISSIONS ==============

export const DELIVERY_PERMISSIONS = {
  CREATE: ['ADMIN', 'MODERATOR', 'COORDINATOR'],
  UPDATE: ['ADMIN', 'MODERATOR', 'COORDINATOR'],
  DELETE: ['ADMIN', 'MODERATOR'],
  APPROVE_QUALITY: ['ADMIN', 'MODERATOR', 'COORDINATOR'],
  VIEW_COSTS: ['ADMIN', 'MODERATOR', 'COORDINATOR'],
  MANAGE_SCHEDULE: ['ADMIN', 'MODERATOR', 'COORDINATOR']
} as const

// ============== NOTIFICATION THRESHOLDS ==============

export const NOTIFICATION_THRESHOLDS = {
  DELIVERY_OVERDUE_HOURS: 2,
  QUALITY_CHECK_OVERDUE_HOURS: 24,
  HIGH_VALUE_DELIVERY_AMOUNT: 10000,
  BULK_DELIVERY_WEIGHT_TONS: 5
} as const