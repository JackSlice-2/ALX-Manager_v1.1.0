export const containsGatewayError = (
  value: any
): boolean => {

  const text =
    String(value).toLowerCase()

  const errorWords = [
    'erro',
    'error',
    'não',
    'invalido',
    'inválido',
    'inválidas',
    'inválidos',
    'parametros',
    'parâmetros',
    'faltando',
    'novamente',
    'falha',
  ]

  return errorWords.some(word =>
    text.includes(word)
  )
}