export const formatTime = (language: string, input: Date) => {
  return input.toLocaleTimeString(language, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatDate = (language: string, input: Date) => {
  return input.toLocaleDateString(language, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}