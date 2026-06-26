const formatJsonTable = (
  obj: any,
  indent = 0
): string => {
  if (
    !obj ||
    typeof obj !== 'object'
  ) {
    return String(obj)
  }

  const pad = ' '.repeat(indent)

  return Object.entries(obj)
    .map(([key, value]) => {
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        return (
          `${pad}${key}\n` +
          formatJsonTable(
            value,
            indent + 2
          )
        )
      }

      if (Array.isArray(value)) {
        return (
          `${pad}${key}\n` +
          value
            .map(
              (
                item,
                index
              ) => {
                if (
                  typeof item ===
                  'object'
                ) {
                  return (
                    `${pad}[${index}]\n` +
                    formatJsonTable(
                      item,
                      indent + 4
                    )
                  )
                }

                return `${pad}• ${item}`
              }
            )
            .join('\n')
        )
      }

      return `${pad}${key.padEnd(
        28,
        '.'
      )} ${value}`
    })
    .join('\n')
}

export default formatJsonTable