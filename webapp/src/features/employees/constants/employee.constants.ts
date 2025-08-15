export const EMPLOYEE_STATUS = {
  ACTIVE: "active",
  ON_LEAVE: "leave",
  TEMPORARY: "temporary",
} as const;

export const PAYMENT_STATUS_LABELS = {
  PENDING: "Oczekujące",
  PROCESSING: "Przetwarzanie",
  PAID: "Zapłacone",
  FAILED: "Błąd",
  CANCELLED: "Anulowane",
} as const;

export const PAYMENT_STATUS_COLORS = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-800",
} as const;

export const EMPLOYMENT_TYPE_LABELS = {
  FULL_TIME: "Pełny etat",
  PART_TIME: "Część etatu",
  CONTRACT: "Umowa",
  TEMPORARY: "Tymczasowy",
} as const;

export const QUALITY_SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  AVERAGE: 60,
  POOR: 0,
} as const;

export const QUALITY_SCORE_COLORS = {
  EXCELLENT: "text-green-600",
  GOOD: "text-blue-600",
  AVERAGE: "text-yellow-600",
  POOR: "text-red-600",
} as const;