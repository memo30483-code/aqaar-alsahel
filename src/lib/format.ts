export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ar-EG", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatArea(area: number): string {
  return `${new Intl.NumberFormat("ar-EG").format(area)} م²`;
}
