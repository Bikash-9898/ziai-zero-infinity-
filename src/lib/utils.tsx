type ClassValue = string | number | false | null | undefined | ClassValue[] | { [key: string]: any }

export function cn(...inputs: ClassValue[]) {
  return inputs
    .flatMap((input) => {
      if (Array.isArray(input)) return input
      if (typeof input === "object" && input !== null) {
        return Object.entries(input)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
      }
      return input ? String(input) : []
    })
    .filter(Boolean)
    .join(" ")
}